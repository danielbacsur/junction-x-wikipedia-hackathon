# /// script
# requires-python = ">=3.11,<3.15"
# dependencies = ["pymysql==1.1.2"]
# ///
"""The revision table as of a date: the plan MariaDB picks (its own history
key, which ends in row_end) against the product's KEY (page_id, row_start).

  uv run revision_bench.py        # writes data/revision.json
"""
import json
import pathlib
import statistics
import time

import pymysql

ROOT = pathlib.Path(__file__).resolve().parent
PAGES = [("typical", 43853), ("talvisota", 1256), ("halonen", 1187)]
DATES = ["2006-12-31 23:59:59", "2012-12-31 23:59:59", "2019-12-31 23:59:59", "2026-09-30 23:59:59"]
PLANS = {"chosen": "", "page_id_row_start": "FORCE INDEX (page_id)"}
SQL = """SELECT rev_id, title, bytes FROM wtt.revision
         FOR SYSTEM_TIME AS OF TIMESTAMP %s AS r {hint} WHERE page_id = %s"""

connection = pymysql.connect(host="127.0.0.1", port=3310, user="root", password="wtt",
                             autocommit=True, init_command="SET time_zone = '+00:00'")
cursor = connection.cursor()


def counters():
    cursor.execute("""SHOW SESSION STATUS WHERE Variable_name LIKE 'Handler_read%'
                      OR Variable_name = 'Handler_icp_attempts'""")
    return {name: int(value) for name, value in cursor.fetchall()}


rows = []
for name, page in PAGES:
    for date in DATES:
        for plan, hint in PLANS.items():
            sql = SQL.format(hint=hint)
            cursor.execute("EXPLAIN " + sql, (date, page))
            key = cursor.fetchall()[0][5]
            cursor.execute(sql, (date, page))
            cursor.fetchall()
            before = counters()
            cursor.execute(sql, (date, page))
            cursor.fetchall()
            after = counters()
            times = []
            for _ in range(7):
                started = time.perf_counter()
                cursor.execute(sql, (date, page))
                cursor.fetchall()
                times.append((time.perf_counter() - started) * 1000)
            row = {
                "page": name, "as_of": date, "plan": plan, "key": key,
                "handler_reads": sum(after[k] - before[k] for k in after if k.startswith("Handler_read")),
                "icp_attempts": after["Handler_icp_attempts"] - before["Handler_icp_attempts"],
                "median_ms": round(statistics.median(times), 3),
                "min_ms": round(min(times), 3), "max_ms": round(max(times), 3),
            }
            rows.append(row)
            print(row, flush=True)

(ROOT / "data" / "revision.json").write_text(json.dumps({
    "title": "One version of an article as of a date, from the revision table",
    "unit": "milliseconds (median of 7 after a warm-up); handler reads and pushed-down index checks for one run",
    "source": "labs/history-at-scale: uv run revision_bench.py",
    "rows": rows,
}, indent=1) + "\n")
