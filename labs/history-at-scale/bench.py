# /// script
# requires-python = ">=3.11,<3.15"
# dependencies = ["pymysql==1.1.2"]
# ///
"""Times the product's hot statements against one or more copies of passage.

  uv run bench.py NAME label=table[@hint] ... [--only blocks,diff] [--quick]

For every case the labels are measured one after the other, so numbers in
one row of a table were taken within seconds of each other. Per case and
label: EXPLAIN, one warm-up, one run between two readings of the session's
Handler_read counters, seven timed runs, and one ANALYZE FORMAT=JSON.
Times are client wall time of execute plus fetch, in milliseconds.
Writes data/raw/NAME.json.
"""
import json
import pathlib
import statistics
import sys
import time

import pymysql

ROOT = pathlib.Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)
LAB = "lab_history_at_scale"
RUNS = 7

# name, page_id, rows over all time, rows today (from page_rows)
PAGES = [
    ("small", 80770),       # 14 rows, 10 versions
    ("typical", 43853),     # 44 rows, the median article
    ("p95", 8631),          # 402 rows
    ("p99", 7649),          # 1,000 rows
    ("talvisota", 1256),    # 6,462 rows, 2,143 versions
    ("halonen", 1187),      # 23,974 rows, 3,078 versions, since 2003
    ("largest", 1420428),   # 66,302 rows, since December 2017
]
DATES = [
    "2006-12-31 23:59:59",
    "2012-12-31 23:59:59",
    "2019-12-31 23:59:59",
    "2026-09-30 23:59:59",
    None,  # now: no FOR SYSTEM_TIME clause at all
]
GLOBAL_DATES = ["2006-12-31 23:59:59", "2010-12-31 23:59:59", "2019-12-31 23:59:59"]

SQL = {
    # every block of one article as of a moment
    "blocks": """
        SELECT p.hash, p.dup, p.ord, p.gap, p.rev_id, p.born_rev, p.slot
        FROM {t} {asof} AS p {hint}
        WHERE p.page_id = %(page)s
        ORDER BY p.ord""",
    # the same, joined to the wording
    "blocks_text": """
        SELECT HEX(p.hash), t.kind, t.chars, p.born_rev, p.slot
        FROM {t} {asof} AS p {hint}
        JOIN wtt.passage_text AS t USING (hash)
        WHERE p.page_id = %(page)s
        ORDER BY p.ord""",
    # the blocks that stood at exactly one of two moments (then and now)
    "diff": """
        SELECT HEX(u.hash), MAX(u.side), t.kind, MAX(u.slot), MAX(u.born_rev)
        FROM (
          SELECT 'from' AS side, hash, dup, slot, born_rev, ord
          FROM {t} {asof} AS p {hint} WHERE page_id = %(page)s
          UNION ALL
          SELECT 'to', hash, dup, slot, born_rev, ord
          FROM {t} AS p {hint} WHERE page_id = %(page)s
        ) AS u
        JOIN wtt.passage_text AS t USING (hash)
        GROUP BY u.hash, u.dup
        HAVING COUNT(*) = 1
        ORDER BY MAX(u.ord)""",
    # the whole history of one wording in one article
    "wording": """
        SELECT row_start, row_end, born_rev, slot, row_end > NOW()
        FROM {t} FOR SYSTEM_TIME ALL AS p {hint}
        WHERE page_id = %(page)s AND hash = %(hash)s
        ORDER BY row_start""",
    # search: 300 candidate wordings joined to what stood at a moment
    "search": """
        SELECT p.page_id, HEX(p.hash), p.born_rev, p.slot
        FROM lab_history_at_scale.cand AS c
        JOIN {t} {asof} AS p {hint} USING (hash)""",
    # a question about every article at once
    "global": """
        SELECT COUNT(*) FROM {t} {asof} AS p {hint}""",
}


def connect():
    return pymysql.connect(
        host="127.0.0.1", port=3310, user="root", password="wtt",
        database=LAB, autocommit=True, read_timeout=1800,
        init_command="SET time_zone = '+00:00'",
    )


def handler_reads(cursor):
    cursor.execute(
        """SHOW SESSION STATUS WHERE Variable_name LIKE 'Handler_read%'
           OR Variable_name LIKE 'Handler_icp%'""")
    return {name: int(value) for name, value in cursor.fetchall()}


def tables_of(node, found):
    """Pulls the table nodes out of an ANALYZE FORMAT=JSON document."""
    if isinstance(node, dict):
        table = node.get("table")
        if isinstance(table, dict) and "table_name" in table:
            found.append({
                "table": table["table_name"],
                "access": table.get("access_type"),
                "key": table.get("key"),
                "partitions": table.get("partitions"),
                "r_rows": table.get("r_rows"),
                "r_loops": table.get("r_loops"),
                "r_filtered": table.get("r_filtered"),
                "pages": (table.get("r_engine_stats") or {}).get("pages_accessed"),
                "attached": table.get("attached_condition"),
                "index_condition": table.get("index_condition"),
            })
        for value in node.values():
            tables_of(value, found)
    elif isinstance(node, list):
        for value in node:
            tables_of(value, found)
    return found


def measure(cursor, sql, params, quick):
    cursor.execute("EXPLAIN PARTITIONS " + sql, params)
    names = [column[0] for column in cursor.description]
    plan = [dict(zip(names, row)) for row in cursor.fetchall()]

    cursor.execute(sql, params)  # warm-up
    rows = len(cursor.fetchall())

    before = handler_reads(cursor)
    cursor.execute(sql, params)
    cursor.fetchall()
    after = handler_reads(cursor)
    reads = {name: after[name] - before[name] for name in after if after[name] != before[name]}

    times = []
    for _ in range(RUNS):
        started = time.perf_counter()
        cursor.execute(sql, params)
        cursor.fetchall()
        times.append((time.perf_counter() - started) * 1000)

    analyzed = None
    if not quick:
        cursor.execute("ANALYZE FORMAT=JSON " + sql, params)
        text = cursor.fetchall()[0][0]
        try:
            # a binary hash in a condition is printed as raw bytes
            document = json.loads(text, strict=False)
            analyzed = {
                "r_total_time_ms": document.get("query_block", {}).get("r_total_time_ms"),
                "tables": tables_of(document, []),
            }
        except json.JSONDecodeError:
            analyzed = {"unparsed": True}

    ordered = sorted(times)
    return {
        "rows": rows,
        "median_ms": round(statistics.median(times), 3),
        "min_ms": round(ordered[0], 3),
        "max_ms": round(ordered[-1], 3),
        "q1_ms": round(ordered[1], 3),
        "q3_ms": round(ordered[-2], 3),
        # rows the engine handed to the server
        "handler_reads": sum(v for k, v in reads.items() if k.startswith("Handler_read")),
        # index entries tested inside the engine by a pushed-down condition
        "icp_attempts": reads.get("Handler_icp_attempts", 0),
        "handler_detail": reads,
        "plan": [
            {key.lower(): row[key] for key in ("table", "partitions", "type", "key", "key_len", "rows", "Extra")}
            for row in plan
        ],
        "analyze": analyzed,
    }


def main():
    name, *rest = sys.argv[1:]
    only = None
    quick = False
    labels = []
    for arg in rest:
        if arg.startswith("--only"):
            only = set(arg.split("=", 1)[1].split(","))
        elif arg == "--quick":
            quick = True
        else:
            label, target = arg.split("=", 1)
            table, _, hint = target.partition("@")
            labels.append((label, table, hint))

    connection = connect()
    cursor = connection.cursor()

    cursor.execute("SELECT page_id, rows_all, rows_now FROM page_rows")
    shape = {page: (int(total), int(now)) for page, total, now in cursor.fetchall()}
    # the wording with the most stretches in each article
    busiest = {}
    for _, page in PAGES:
        cursor.execute(
            """SELECT hash FROM wtt.passage FOR SYSTEM_TIME ALL
               WHERE page_id = %s GROUP BY hash ORDER BY COUNT(*) DESC, hash LIMIT 1""",
            (page,))
        busiest[page] = cursor.fetchone()[0]

    cases = []
    for statement in ("blocks", "blocks_text", "diff"):
        for page_name, page in PAGES:
            for date in DATES:
                if statement == "diff" and date is None:
                    continue
                cases.append((statement, page_name, page, date))
    for page_name, page in PAGES:
        cases.append(("wording", page_name, page, None))
    for date in DATES:
        cases.append(("search", None, None, date))
    for date in GLOBAL_DATES + [None]:
        cases.append(("global", None, None, date))

    records = []
    started = time.strftime("%Y-%m-%dT%H:%M:%S")
    for statement, page_name, page, date in cases:
        if only and statement not in only:
            continue
        for label, table, hint in labels:
            asof = "FOR SYSTEM_TIME AS OF TIMESTAMP %(at)s" if date else ""
            sql = SQL[statement].format(t=table, asof=asof, hint=hint)
            params = {"page": page, "at": date, "hash": busiest.get(page)}
            result = measure(cursor, sql, params, quick)
            record = {
                "layout": label, "statement": statement, "page": page_name,
                "page_id": page, "as_of": date or "now",
                "page_rows_all": shape.get(page, (None, None))[0],
                "page_rows_now": shape.get(page, (None, None))[1],
                **result,
            }
            records.append(record)
            print(f"{statement:11} {page_name or '-':9} {record['as_of'][:10]:10} {label:10} "
                  f"rows={result['rows']:5} reads={result['handler_reads']:8} icp={result['icp_attempts']:6} "
                  f"median={result['median_ms']:9.2f} ms  [{result['min_ms']:.2f}, {result['max_ms']:.2f}] "
                  f"key={result['plan'][-1]['key'] if statement != 'diff' else result['plan'][-2]['key']}",
                  flush=True)

    out = RAW / f"{name}.json"
    out.write_text(json.dumps({
        "started": started, "finished": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "runs": RUNS, "labels": [{"label": l, "table": t, "hint": h} for l, t, h in labels],
        "records": records,
    }, indent=1, default=str) + "\n")
    print("wrote", out)


if __name__ == "__main__":
    main()
