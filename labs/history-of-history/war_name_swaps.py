# /// script
# dependencies = ["pymysql"]
# ///
"""Part 1b and 1c: builds lab_history_of_history.name_count (name-count.sql, one pass
over all 862,076 versions), finds the swap edits (war-name-swaps.sql), reads the
title history (title-history.sql) and writes data/war-name-swaps.json.

uv run war_name_swaps.py            # everything
uv run war_name_swaps.py --keep     # reuse name_count if it is already built
"""
import datetime, decimal, json, pathlib, sys, time
import pymysql
from snapshots import DB

here = pathlib.Path(__file__).parent


def statements(name):
    sql = "\n".join(l for l in (here / name).read_text().splitlines() if not l.startswith("--"))
    return [s.strip() for s in sql.split(";") if s.strip()]


def plain(v):
    """JSON-friendly value: timestamps as text, DECIMAL as int or float."""
    if isinstance(v, (datetime.datetime, datetime.date)):
        return str(v)
    if isinstance(v, decimal.Decimal):
        return int(v) if v == int(v) else float(v)
    return v


def run(cur, sql):
    t = time.time()
    cur.execute(sql)
    rows = [{k: plain(v) for k, v in r.items()} for r in cur.fetchall()]
    secs = round(time.time() - t, 1)
    print(f"{secs:7.1f} s  {' '.join(sql.split())[:90]}  -> {cur.rowcount} rows", flush=True)
    return rows, secs


con = pymysql.connect(**{**DB, "user": "root"})
cur = con.cursor(pymysql.cursors.DictCursor)
cur.execute("SET time_zone = '+00:00'")
timings = {}
if "--keep" not in sys.argv:
    for s in statements("name-count.sql"):
        _, secs = run(cur, s)
        if s.startswith("INSERT"):
            timings["name_count_pass_seconds"] = secs
            timings["name_count_rows"] = cur.rowcount

create, detail, by_direction, by_article = statements("war-name-swaps.sql")
_, timings["swap_seconds"] = run(cur, create)
rows, _ = run(cur, detail)
directions, _ = run(cur, by_direction)
articles, _ = run(cur, by_article)
titles, moved, moves, first = [run(cur, s)[0] for s in statements("title-history.sql")]

out = {
    "title": "Edits that swapped one name of the 1918 war for another inside an existing article",
    "unit": "one row per edit and name pair; from_* and to_* are mention counts in the version before and after the edit; moved = min(drop, rise)",
    "source": "wtt.revision FOR SYSTEM_TIME ALL counted into lab_history_of_history.name_count, joined to wtt.edit (labs/history-of-history/name-count.sql, war-name-swaps.sql, title-history.sql)",
    "timings": timings,
    "by_direction": directions,
    "by_article": articles,
    "main_article": {"page_id": 1150, "titles_in_history": titles, "articles_with_more_than_one_title": moved[0]["articles_with_more_than_one_title"],
                     "page_moves_naming_the_war": moves, "first_version_with_each_name": first},
    "rows": rows,
}
(here / "data" / "war-name-swaps.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print("wrote data/war-name-swaps.json", len(rows), "swaps;", timings)
for r in directions:
    print(r)
