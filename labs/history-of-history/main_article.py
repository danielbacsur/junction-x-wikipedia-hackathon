# /// script
# dependencies = ["pymysql"]
# ///
"""Part 1c: runs lead-sentence.sql and lead-name-history.sql (the main article,
page_id 1150) and writes data/main-article.json.

uv run main_article.py
"""
import datetime, decimal, json, pathlib, time
import pymysql
from snapshots import DB

here = pathlib.Path(__file__).parent


def statements(name):
    sql = "\n".join(l for l in (here / name).read_text().splitlines() if not l.startswith("--"))
    return [s.strip() for s in sql.split(";") if s.strip()]


def plain(v):
    if isinstance(v, (datetime.datetime, datetime.date)):
        return str(v)
    if isinstance(v, decimal.Decimal):
        return int(v) if v == int(v) else float(v)
    return v


con = pymysql.connect(**DB)
cur = con.cursor(pymysql.cursors.DictCursor)
cur.execute("SET time_zone = '+00:00'")
results = []
for name in ("lead-sentence.sql", "lead-name-history.sql"):
    for sql in statements(name):
        t = time.time()
        cur.execute(sql)
        rows = [{k: plain(v) for k, v in r.items()} for r in cur.fetchall()]
        results.append(rows)
        print(f"{time.time() - t:5.1f} s  {name}: {len(rows)} rows", flush=True)
lead, opening, sides, switches = results

(here / "data" / "main-article.json").write_text(json.dumps({
    "title": "How the article Suomen sisällissota (page 1150) opens, and which side its infobox lists first",
    "unit": "rows: the opening text as it stood at each date; opening_names and infobox_belligerent_1: versions and days per value over all 3,357 versions",
    "source": "wtt.revision FOR SYSTEM_TIME AS OF / ALL WHERE page_id = 1150 (labs/history-of-history/lead-sentence.sql, lead-name-history.sql)",
    "opening_names": opening,
    "infobox_belligerent_1": sides,
    "infobox_side_switches": switches,
    "rows": lead,
}, ensure_ascii=False, indent=1))
print("wrote data/main-article.json")
for r in opening[:4] + sides:
    print(r)
