# /// script
# dependencies = ["pymysql"]
# ///
"""Part 3: runs term-shares.sql once per snapshot date and writes data/term-shares.json.
Every finished snapshot is kept in cache/maria-terms.json, so the run can be stopped
and resumed. The three dates the README quotes most run first. A date MariaDB has not
done yet is filled from the DuckDB result (cache/duck-terms.json, from duck_terms.py)
and marked "engine": "duckdb".

uv run term_shares.py           # run what is missing, then write the JSON
uv run term_shares.py --write   # only write the JSON from what is cached
"""
import json, pathlib, sys, time
import pymysql
from snapshots import SNAPSHOTS, DB, TERMS

here = pathlib.Path(__file__).parent
(here / "cache").mkdir(exist_ok=True)
cache = here / "cache" / "maria-terms.json"
done = json.loads(cache.read_text()) if cache.exists() else {}
query = "\n".join(l for l in (here / "term-shares.sql").read_text().splitlines() if not l.startswith("--")).strip().rstrip(";")


def write():
    duck_file = here / "cache" / "duck-terms.json"
    duck = json.loads(duck_file.read_text()) if duck_file.exists() else {}
    rows = []
    for d in sorted(set(done) | set(duck)):
        r = dict(done.get(d) or duck[d])
        secs, total = r.pop("seconds", None), r.pop("articles_total")
        for term in TERMS:
            rows.append({"date": d, "term": term, "articles": r[term], "articles_total": total, "share": round(r[term] / total, 4),
                         "engine": "mariadb" if d in done else "duckdb", "seconds": secs})
    (here / "data" / "term-shares.json").write_text(json.dumps({
        "title": "Share of history-of-Finland articles that mention a word, by snapshot date",
        "unit": "articles mentioning the word at least once; share = articles / articles that existed on that date",
        "source": "wtt.revision FOR SYSTEM_TIME AS OF each date (labs/history-of-history/term-shares.sql); rows with engine duckdb come from the same patterns on data/m/versions-*.parquet",
        "patterns": TERMS,
        "rows": rows,
    }, ensure_ascii=False, indent=1))


if "--write" not in sys.argv:
    first = [d for d in SNAPSHOTS if d[:4] in ("2026", "2021", "2016")]
    con = pymysql.connect(**DB)
    cur = con.cursor(pymysql.cursors.DictCursor)
    cur.execute("SET time_zone = '+00:00'")
    for d in first[::-1] + [d for d in SNAPSHOTS[::-1] if d not in first]:
        if d[:10] in done:
            continue
        t = time.time()
        cur.execute(query.replace("2010-12-31 23:59:59", d))
        r = {k: int(v) for k, v in cur.fetchone().items()}
        r["seconds"] = round(time.time() - t, 1)
        done[d[:10]] = r
        cache.write_text(json.dumps(done, ensure_ascii=False))
        write()
        print(d, r, flush=True)
write()
print("wrote data/term-shares.json;", len(done), "snapshots from MariaDB")
