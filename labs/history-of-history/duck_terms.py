# /// script
# dependencies = ["duckdb", "pytz"]
# ///
"""Cross-check of Part 3 on the Parquet files with DuckDB, same patterns as
term-shares.sql. Writes cache/duck-terms.json and compares it with what MariaDB
has finished (cache/maria-terms.json).

uv run duck_terms.py
"""
import json, pathlib
import duckdb
from snapshots import SNAPSHOTS, TERMS

here = pathlib.Path(__file__).parent
P = str(here.parent.parent / "data" / "m" / "versions-*.parquet")
con = duckdb.connect()
con.execute("SET threads = 4")
con.execute(f"CREATE VIEW nc AS SELECT page_id, rev_id, timestamp FROM read_parquet('{here / 'cache' / 'name_count.parquet'}')")
con.execute("CREATE TABLE snap (d VARCHAR, page_id UINTEGER, rev_id UINTEGER)")
for d in SNAPSHOTS:
    con.execute(f"""INSERT INTO snap SELECT '{d[:10]}', page_id, rev_id FROM nc WHERE timestamp <= TIMESTAMPTZ '{d}+00'
        QUALIFY row_number() OVER (PARTITION BY page_id ORDER BY timestamp DESC, rev_id DESC) = 1""")
flags = ", ".join(f"regexp_matches(text, '(?i){p}')::INT AS {k}" for k, p in TERMS.items())
con.execute(f"CREATE TABLE f AS SELECT rev_id, {flags} FROM read_parquet('{P}') WHERE rev_id IN (SELECT DISTINCT rev_id FROM snap)")
sums = ", ".join(f"sum({k})" for k in TERMS)
duck = {row[0]: {"articles_total": int(row[1]), **{k: int(n) for k, n in zip(TERMS, row[2:])}}
        for row in con.execute(f"SELECT s.d, count(*), {sums} FROM snap s JOIN f USING (rev_id) GROUP BY 1").fetchall()}
(here / "cache" / "duck-terms.json").write_text(json.dumps(duck, ensure_ascii=False))

maria_file = here / "cache" / "maria-terms.json"
maria = json.loads(maria_file.read_text()) if maria_file.exists() else {}
bad = [(d, k, maria[d][k], duck[d][k]) for d in maria for k in ["articles_total", *TERMS] if maria[d][k] != duck[d][k]]
print(f"MariaDB has {len(maria)} of {len(SNAPSHOTS)} snapshots ({', '.join(sorted(maria))});")
print(f"compared {len(maria) * (len(TERMS) + 1)} numbers with DuckDB: {len(bad)} differ", bad[:10])
