# /// script
# dependencies = ["duckdb", "pytz"]
# ///
"""Cross-check of Part 2 on the Parquet files with DuckDB, same definition as
year-heatmap.sql. Writes cache/duck-years.json. Needs cache/name_count.parquet
(from duck_names.py) to know which version of each article stood at each date.

uv run duck_years.py
"""
import json, pathlib, time
import duckdb
from snapshots import SNAPSHOTS

here = pathlib.Path(__file__).parent
P = str(here.parent.parent / "data" / "m" / "versions-*.parquet")
con = duckdb.connect()
con.execute("SET threads = 4")
con.execute(f"CREATE VIEW nc AS SELECT page_id, rev_id, timestamp FROM read_parquet('{here / 'cache' / 'name_count.parquet'}')")
t = time.time()
con.execute("CREATE TABLE snap (d VARCHAR, page_id UINTEGER, rev_id UINTEGER)")
for d in SNAPSHOTS:
    con.execute(f"""INSERT INTO snap SELECT '{d[:10]}', page_id, rev_id FROM nc WHERE timestamp <= TIMESTAMPTZ '{d}+00'
        QUALIFY row_number() OVER (PARTITION BY page_id ORDER BY timestamp DESC, rev_id DESC) = 1""")
con.execute(f"""CREATE TABLE y AS
    WITH v AS (SELECT rev_id, regexp_replace(regexp_replace(text, '(?is)<ref[^>/]*>.*?</ref>|<ref[^>]*>|[0-9]{{2}}00-lu[kv]u', ' ', 'g'),
                                              '(?i)\\{{\\{{[a-zåäö]*viite[^{{}}]*\\}}\\}}', ' ', 'g') AS clean
               FROM read_parquet('{P}') WHERE rev_id IN (SELECT DISTINCT rev_id FROM snap)),
    tok AS (SELECT rev_id, unnest(regexp_extract_all(clean, '[0-9]+')) AS tok FROM v)
    SELECT rev_id, tok::INT AS year, count(*) AS n FROM tok
    WHERE regexp_full_match(tok, '1[0-9]{{3}}|20[01][0-9]|202[0-6]') GROUP BY 1, 2""")
res = {}
for d, year, mentions, articles in con.execute("""SELECT s.d, y.year, sum(y.n), count(DISTINCT s.page_id)
        FROM snap s JOIN y USING (rev_id) GROUP BY 1, 2 ORDER BY 1, 2""").fetchall():
    res.setdefault(d, {})[int(year)] = [int(mentions), int(articles)]
(here / "cache" / "duck-years.json").write_text(json.dumps(res))
print(f"{time.time() - t:.0f} s;", {d: sum(m for m, _ in v.values()) for d, v in res.items()})
