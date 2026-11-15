# /// script
# requires-python = ">=3.11,<3.15"
# dependencies = ["pymysql==1.1.2"]
# ///
"""Builds the lab's copies of wtt.passage in lab_history_at_scale.

  uv run build.py create flat hc year idx   # empty tables, then load copy 0
  uv run build.py create hcp                # two partitions plus two indexes
  uv run build.py grow idx 1 2 3            # append shifted copies (2x, 3x, 4x)
  uv run build.py sizes                     # rows and bytes of every copy
  uv run build.py drop flat hc year idx     # remove the large copies

One connection, one statement at a time. Before every chunk the script reads
`docker stats` and waits while the container is above 6.5 GiB.
Every step appends one line to data/raw/build.jsonl.
"""
import json
import pathlib
import re
import subprocess
import sys
import time

import pymysql

ROOT = pathlib.Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)
DB = "lab_history_at_scale"
CONTAINER = "wikipedia-through-time-mariadb-1"
CHUNKS = 8
PAGE_SHIFT = 2_000_000  # larger than any page id in the set
REV_SHIFT = 100_000_000

COLUMNS = """
  page_id   INT UNSIGNED NOT NULL,
  hash      BINARY(8)    NOT NULL,
  dup       SMALLINT UNSIGNED NOT NULL,
  ord       VARBINARY(255) NOT NULL,
  gap       INT UNSIGNED NOT NULL,
  rev_id    INT UNSIGNED NOT NULL,
  born_rev  INT UNSIGNED NOT NULL,
  slot      INT UNSIGNED NOT NULL,
  prev_hash BINARY(8),
  sim       FLOAT,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  PRIMARY KEY (page_id, hash, dup),
  KEY (hash),
  KEY (page_id, slot),
  KEY (born_rev)"""

EXTRA = """,
  KEY pe (page_id, row_end),
  KEY ps (page_id, row_start),
  KEY se (row_start, row_end),
  KEY es (row_end, row_start)"""

LAYOUTS = {
    # (a) what the product has today
    "flat": f"CREATE TABLE p_flat ({COLUMNS}) WITH SYSTEM VERSIONING",
    # (b) all history in one partition, current rows in another
    "hc": f"""CREATE TABLE p_hc ({COLUMNS}) WITH SYSTEM VERSIONING
      PARTITION BY SYSTEM_TIME (
        PARTITION p_hist HISTORY, PARTITION p_cur CURRENT)""",
    # (c) one history partition per year a row ended in, 2003 to 2026
    "year": f"""CREATE TABLE p_year ({COLUMNS}) WITH SYSTEM VERSIONING
      PARTITION BY SYSTEM_TIME INTERVAL 1 YEAR
      STARTS '2003-01-01 00:00:00' PARTITIONS 25""",
    # (a) plus four candidate indexes on the period columns
    "idx": f"CREATE TABLE p_idx ({COLUMNS}{EXTRA}) WITH SYSTEM VERSIONING",
    # (b) plus the two indexes that carry both ends of the period
    "hcp": f"""CREATE TABLE p_hcp ({COLUMNS},
      KEY ps (page_id, row_start),
      KEY per (page_id, row_end, row_start)) WITH SYSTEM VERSIONING
      PARTITION BY SYSTEM_TIME (
        PARTITION p_hist HISTORY, PARTITION p_cur CURRENT)""",
}


def connect():
    return pymysql.connect(
        host="127.0.0.1", port=3310, user="root", password="wtt",
        database=DB, autocommit=True, read_timeout=3600,
        init_command="SET time_zone = '+00:00'",
    )


def log(record):
    record["at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    with (RAW / "build.jsonl").open("a") as out:
        out.write(json.dumps(record, default=str) + "\n")
    print(json.dumps(record, default=str), flush=True)


def memory_gib():
    out = subprocess.run(
        ["docker", "stats", "--no-stream", "--format", "{{.MemUsage}}", CONTAINER],
        capture_output=True, text=True,
    ).stdout
    match = re.match(r"([\d.]+)(GiB|MiB)", out.strip())
    if not match:
        return 0.0
    value = float(match.group(1))
    return value if match.group(2) == "GiB" else value / 1024


def wait_for_memory():
    while (used := memory_gib()) > 6.5:
        print(f"memory {used:.2f} GiB, waiting", flush=True)
        time.sleep(20)
    return used


def chunks(cursor):
    cursor.execute("SELECT page_id FROM wtt.page_stats ORDER BY page_id")
    pages = [row[0] for row in cursor.fetchall()]
    if not pages:
        raise RuntimeError("wtt.page_stats is empty")
    size = -(-len(pages) // CHUNKS)
    bounds = []
    for start in range(0, len(pages), size):
        part = pages[start:start + size]
        bounds.append((part[0], part[-1]))
    bounds[0] = (0, bounds[0][1])
    bounds[-1] = (bounds[-1][0], 4_000_000_000)
    return bounds


def load(cursor, table, copy):
    """Copies wtt.passage with its real lifetimes. `copy` > 0 shifts the
    page, the versions and the last byte of the hash so the rows are new
    articles with new wordings and the same shape of history."""
    hash_expr = (
        "hash" if copy == 0 else
        f"CAST(CONCAT(LEFT(hash, 7), CHAR(ORD(RIGHT(hash, 1)) ^ {copy})) AS BINARY(8))"
    )
    select = f"""page_id + {copy * PAGE_SHIFT}, {hash_expr}, dup, ord, gap,
                 rev_id + {copy * REV_SHIFT}, born_rev + {copy * REV_SHIFT},
                 slot, prev_hash, sim"""
    fields = "page_id, hash, dup, ord, gap, rev_id, born_rev, slot, prev_hash, sim"
    cursor.execute("SET system_versioning_insert_history = 1")
    started = time.perf_counter()
    rows = 0
    peak = 0.0
    for low, high in chunks(cursor):
        peak = max(peak, wait_for_memory())
        # history rows keep both ends of their lifetime
        rows += cursor.execute(
            f"""INSERT INTO {table} ({fields}, row_start, row_end)
                SELECT {select}, row_start, row_end
                FROM wtt.passage FOR SYSTEM_TIME ALL
                WHERE page_id BETWEEN {low} AND {high}
                  AND row_end < '2100-01-01'""")
        # current rows are given their start only
        rows += cursor.execute(
            f"""INSERT INTO {table} ({fields}, row_start)
                SELECT {select}, row_start
                FROM wtt.passage
                WHERE page_id BETWEEN {low} AND {high}""")
    seconds = time.perf_counter() - started
    cursor.execute("SET system_versioning_insert_history = 0")
    return rows, seconds, peak


def sizes(cursor):
    cursor.execute(
        """SELECT table_name, SUM(table_rows), SUM(data_length), SUM(index_length)
           FROM information_schema.partitions
           WHERE table_schema = %s AND table_name LIKE 'p\\_%%'
           GROUP BY table_name""", (DB,))
    tables = {
        name: {"table": name, "estimated_rows": int(rows), "data_bytes": int(data),
               "index_bytes": int(index), "file_bytes": 0, "files": 0}
        for name, rows, data, index in cursor.fetchall()
    }
    cursor.execute(
        """SELECT name, file_size FROM information_schema.innodb_sys_tablespaces
           WHERE name LIKE %s""", (DB + "/p\\_%",))
    for name, size in cursor.fetchall():
        table = name.split("/")[1].split("#")[0]
        if table in tables:
            tables[table]["file_bytes"] += int(size)
            tables[table]["files"] += 1
    return list(tables.values())


def main():
    command, *args = sys.argv[1:]
    connection = connect()
    cursor = connection.cursor()

    if command == "create":
        for layout in args:
            table = f"p_{layout}"
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            cursor.execute(LAYOUTS[layout])
            rows, seconds, peak = load(cursor, table, 0)
            started = time.perf_counter()
            cursor.execute(f"ANALYZE TABLE {table}")
            cursor.fetchall()
            log({"step": "load", "table": table, "copy": 0, "rows": rows,
                 "seconds": round(seconds, 1), "analyze_seconds":
                 round(time.perf_counter() - started, 1), "memory_gib": peak,
                 "sizes": [s for s in sizes(cursor) if s["table"] == table]})

    elif command == "grow":
        table = f"p_{args[0]}"
        for copy in map(int, args[1:]):
            rows, seconds, peak = load(cursor, table, copy)
            started = time.perf_counter()
            cursor.execute(f"ANALYZE TABLE {table}")
            cursor.fetchall()
            log({"step": "grow", "table": table, "copy": copy, "rows": rows,
                 "seconds": round(seconds, 1), "analyze_seconds":
                 round(time.perf_counter() - started, 1), "memory_gib": peak,
                 "sizes": [s for s in sizes(cursor) if s["table"] == table]})

    elif command == "sizes":
        log({"step": "sizes", "sizes": sizes(cursor)})

    elif command == "drop":
        for layout in args:
            cursor.execute(f"DROP TABLE IF EXISTS p_{layout}")
            log({"step": "drop", "table": f"p_{layout}"})

    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main()
