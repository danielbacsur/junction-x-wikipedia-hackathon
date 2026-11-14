# /// script
# dependencies = ["pymysql"]
# ///
"""Part 2: runs year-heatmap.sql once per snapshot date, newest first, and appends
each finished snapshot to cache/maria-years.json. build_heatmap.py turns that into
data/year-heatmap.json.

uv run year_heatmap.py            # all 23 snapshots
uv run year_heatmap.py 2017 2021  # only the snapshots of those years
"""
import json, pathlib, sys, time
import pymysql
from snapshots import SNAPSHOTS, DB

here = pathlib.Path(__file__).parent
(here / "cache").mkdir(exist_ok=True)
out = here / "cache" / "maria-years.json"
done = json.loads(out.read_text()) if out.exists() else {}
query = "\n".join(l for l in (here / "year-heatmap.sql").read_text().splitlines() if not l.startswith("--")).strip().rstrip(";")
want = [d for d in SNAPSHOTS if not sys.argv[1:] or d[:4] in sys.argv[1:]]

con = pymysql.connect(**DB)
cur = con.cursor()
cur.execute("SET time_zone = '+00:00'")
for d in reversed(want):
    if d[:10] in done:
        continue
    t = time.time()
    cur.execute(query.replace("2010-12-31 23:59:59", d))
    got = cur.fetchall()
    cur.execute("SHOW WARNINGS")
    warnings = cur.fetchall()
    secs = round(time.time() - t, 1)
    done[d[:10]] = {"seconds": secs, "warnings": len(warnings), "years": {int(y): [int(m), int(a)] for y, m, a in got}}
    out.write_text(json.dumps(done))
    print(d, secs, "s", sum(int(m) for _, m, _ in got), "year mentions", len(warnings), "warnings", warnings[:2], flush=True)
