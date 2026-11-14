# /// script
# dependencies = ["duckdb", "pytz"]
# ///
"""Cross-check of Part 1 on the Parquet files with DuckDB, same definitions as war-names.sql.

Pass 1 counts every name in every one of the 862,076 versions (the same table
name-count.sql builds in MariaDB) and writes it to cache/name_count.parquet.
Pass 2 picks the version of each article that stood at each snapshot date and
prints the same aggregate as war-names.sql, then compares with data/war-names.json.

uv run duck_names.py
"""
import json, pathlib, time
import duckdb
from snapshots import SNAPSHOTS

here = pathlib.Path(__file__).parent
(here / "cache").mkdir(exist_ok=True)
P = str(here.parent.parent / "data" / "m" / "versions-*.parquet")
NAMES = [("sisällissota", "sisällisso[dt][ai]"), ("vapaussota", "vapausso[dt][ai]"), ("kansalaissota", "kansalaisso[dt][ai]"),
         ("luokkasota", "luokkaso[dt][ai]"), ("veljessota", "veljesso[dt][ai]"), ("punakapina", "punakapin")]
ANY = "sisällisso[dt]|vapausso[dt]|kansalaisso[dt]|luokkaso[dt]|veljesso[dt]|punakapin"
FOREIGN = ("(?:venäjän|espanjan|yhdysvaltain|yhdysvaltojen|amerikan|ruotsin|viron|eestin|latvian|liettuan|aunuksen|karjalan|inkerin|kreikan|"
           "irlannin|englannin|kiinan|algerian|afganistanin|puolan|unkarin|turkin|rooman) (?:sisällis|vapaus|kansalais)so[dt][ai]")
CATFILE = r"\[\[(?:luokka|category|kuva|tiedosto|file|image):[^\]]*\]\]"
TARGET = r"\[\[[^\]|]*\|"

con = duckdb.connect()
con.execute("SET threads = 4")
out = here / "cache" / "name_count.parquet"
if not out.exists():
    t = time.time()
    cols = ",\n".join(f"len(regexp_extract_all(t{z}, '{re}'))::INT AS {name[:-4]}_c{z}" for name, re in NAMES for z in range(5))
    con.execute(f"""
    COPY (
      WITH a AS (SELECT page_id, rev_id, title, timestamp, "user", comment, bytes,
                        CASE WHEN regexp_matches(lower(text), '{ANY}') THEN lower(text) ELSE '' END AS t0
                 FROM read_parquet('{P}')),
      b AS (SELECT *, regexp_replace(t0, '{FOREIGN}', ' ', 'g') AS t1 FROM a),
      c AS (SELECT *, replace(t1, 'vapaussodan muistomital', ' ') AS t2 FROM b),
      d AS (SELECT *, regexp_replace(t2, '{CATFILE}', ' ', 'g') AS t3 FROM c),
      e AS (SELECT *, regexp_replace(t3, '{TARGET}', ' ', 'g') AS t4 FROM d)
      SELECT page_id, rev_id, title, timestamp, "user", comment, bytes,
      {cols}
      FROM e
    ) TO '{out}' (FORMAT parquet)""")
    print(f"pass 1: counted names in every version in {time.time() - t:.0f} s")

con.execute(f"CREATE VIEW nc AS SELECT * FROM read_parquet('{out}')")
print(con.execute("SELECT count(*) versions, count(DISTINCT page_id) articles FROM nc").fetchall())

rows = []
for d in SNAPSHOTS:
    con.execute(f"""CREATE OR REPLACE TEMP TABLE snap AS
        SELECT * FROM nc WHERE timestamp <= TIMESTAMPTZ '{d}+00'
        QUALIFY row_number() OVER (PARTITION BY page_id ORDER BY timestamp DESC, rev_id DESC) = 1""")
    for name, _ in NAMES:
        k = name[:-4]
        r = con.execute(f"""SELECT count(*), sum(({k}_c0 > 0)::INT), sum({k}_c0), sum({k}_c0 - {k}_c1), sum({k}_c1 - {k}_c2),
            sum({k}_c2 - {k}_c3), sum({k}_c3 - {k}_c4), sum({k}_c4), sum(({k}_c4 > 0)::INT) FROM snap""").fetchone()
        rows.append(dict(zip(["date", "name", "articles_total", "articles", "mentions", "other_countries", "medal",
                              "category_or_file", "link_target", "running_text", "articles_running"], [d[:10], name, *map(int, r)])))
(here / "cache" / "duck-war-names.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))

maria = here / "data" / "war-names.json"
if maria.exists():
    m = {(r["date"], r["name"]): r for r in json.loads(maria.read_text())["rows"]}
    bad = 0
    for r in rows:
        mr = m.get((r["date"], r["name"]))
        if mr is None:
            continue
        diff = {k: (mr[k], v) for k, v in r.items() if mr[k] != v}
        if diff:
            bad += 1
            print("DIFF", r["date"], r["name"], diff)
    print(f"compared {len(rows)} rows x 9 numbers with MariaDB: {bad} rows differ")
