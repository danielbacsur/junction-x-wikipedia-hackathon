# /// script
# dependencies = ["pymysql"]
# ///
"""Ad hoc query runner: uv run q.py "SQL" [db]  (prints rows as tab-separated text with timing)."""
import sys, time, pymysql
sql = sys.argv[1]
db = sys.argv[2] if len(sys.argv) > 2 else "wtt"
c = pymysql.connect(host="127.0.0.1", port=3310, user="root", password="wtt", database=db, autocommit=True)
with c.cursor() as cur:
    for stmt in [s for s in sql.split(";\n") if s.strip()]:
        t = time.perf_counter()
        cur.execute(stmt)
        rows = cur.fetchall() if cur.description else []
        dt = time.perf_counter() - t
        if cur.description:
            print("\t".join(d[0] for d in cur.description))
        for r in rows:
            print("\t".join("NULL" if v is None else str(v) for v in r))
        print(f"-- {len(rows)} rows, {dt*1000:.1f} ms")
