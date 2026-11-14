# /// script
# dependencies = ["pymysql"]
# ///
"""Part 1: runs war-names.sql once per snapshot date and writes data/war-names.json.

uv run war_names.py
"""
import json, pathlib, time
import pymysql
from snapshots import SNAPSHOTS, DB

here = pathlib.Path(__file__).parent
sql = "\n".join(l for l in (here / "war-names.sql").read_text().splitlines() if not l.startswith("--"))
set_sql, query = [s.strip() for s in sql.split(";") if s.strip()]

con = pymysql.connect(**DB)
cur = con.cursor(pymysql.cursors.DictCursor)
cur.execute("SET time_zone = '+00:00'")
cur.execute(set_sql)

rows = []
for d in SNAPSHOTS:
    t = time.time()
    cur.execute(query.replace("2010-12-31 23:59:59", d))
    got = cur.fetchall()
    secs = round(time.time() - t, 1)
    all_m = sum(int(r["mentions"]) for r in got)
    war_m = sum(int(r["mentions"] - r["other_countries"] - r["medal"]) for r in got)
    run_m = sum(int(r["running_text"]) for r in got)
    for r in got:
        r = {k: (int(v) if k != "name" else v) for k, v in r.items()}
        war = r["mentions"] - r["other_countries"] - r["medal"]
        rows.append({
            "date": d[:10], **r,
            "mentions_1918": war,
            "share_mentions": round(r["mentions"] / all_m, 4) if all_m else 0,
            "share_1918": round(war / war_m, 4) if war_m else 0,
            "share_running": round(r["running_text"] / run_m, 4) if run_m else 0,
            "seconds": secs,
        })
    print(d, secs, "s", {r["name"]: int(r["running_text"]) for r in got}, flush=True)

out = {
    "title": "Names of the 1918 war in Finnish Wikipedia's history-of-Finland articles, by snapshot date",
    "unit": "articles and mentions per name; shares are of the six names' mentions on that date",
    "source": "wtt.revision FOR SYSTEM_TIME AS OF each date (labs/history-of-history/war-names.sql)",
    "columns": {
        "articles_total": "articles that existed on the date",
        "articles": "articles with at least one mention of the name anywhere in the wikitext",
        "mentions": "all mentions",
        "other_countries": "mentions qualified by another country (Viron vapaussota, Venäjän sisällissota ...)",
        "medal": "mentions inside 'Vapaussodan muistomitali'",
        "category_or_file": "mentions inside [[Luokka:...]] or [[Kuva:/Tiedosto:...]]",
        "link_target": "mentions inside the hidden target of a piped link [[target|label]]",
        "running_text": "the rest: what a reader sees",
        "articles_running": "articles with at least one running-text mention",
        "mentions_1918": "mentions - other_countries - medal",
        "share_mentions": "mentions / sum of mentions over the six names",
        "share_1918": "mentions_1918 / sum over the six names",
        "share_running": "running_text / sum over the six names",
        "seconds": "wall time of the snapshot query",
    },
    "rows": rows,
}
(here / "data" / "war-names.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print("wrote data/war-names.json", len(rows), "rows")
