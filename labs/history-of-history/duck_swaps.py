# /// script
# dependencies = ["duckdb", "pytz", "pymysql"]
# ///
"""Cross-check of Part 1b with DuckDB. Compares lab_history_of_history.name_count
(MariaDB, one row per version) with cache/name_count.parquet (built from the
Parquet files by duck_names.py), then finds the swap edits again in DuckDB and
compares them with data/war-name-swaps.json.

uv run duck_swaps.py
"""
import json, pathlib
import duckdb, pymysql
from snapshots import DB

here = pathlib.Path(__file__).parent
con = duckdb.connect()
con.execute(f"""CREATE TABLE v AS SELECT page_id, rev_id, row_number() OVER (PARTITION BY page_id ORDER BY timestamp, rev_id) AS seq,
    sisällis_c0 AS n1, vapaus_c0 AS n2, kansalais_c0 AS n3, luokka_c0 AS n4, veljes_c0 AS n5, punaka_c0 AS n6
    FROM read_parquet('{here / 'cache' / 'name_count.parquet'}')""")

my = pymysql.connect(**DB).cursor()
my.execute("""SELECT rev_id, sisallis, vapaus, kansalais, luokka, veljes, punakapina FROM lab_history_of_history.name_count
              WHERE sisallis + vapaus + kansalais + luokka + veljes + punakapina > 0""")
maria_counts = {r[0]: tuple(r[1:]) for r in my.fetchall()}
duck_counts = {r[0]: tuple(r[1:]) for r in con.execute("SELECT rev_id, n1, n2, n3, n4, n5, n6 FROM v WHERE n1 + n2 + n3 + n4 + n5 + n6 > 0").fetchall()}
bad = [k for k in set(maria_counts) | set(duck_counts) if maria_counts.get(k) != duck_counts.get(k)]
print(f"versions that mention a name: MariaDB {len(maria_counts)}, DuckDB {len(duck_counts)}, versions whose six counts differ: {len(bad)}")

names = ["sisällissota", "vapaussota", "kansalaissota", "luokkasota", "veljessota", "punakapina"]
duck = set()
for i, a in enumerate(names, 1):
    for j, b in enumerate(names, 1):
        if i != j:
            for r in con.execute(f"""SELECT c.rev_id, p.n{i}, c.n{i}, p.n{j}, c.n{j} FROM v c JOIN v p ON p.page_id = c.page_id AND p.seq = c.seq - 1
                                     WHERE c.n{i} < p.n{i} AND c.n{j} > p.n{j}""").fetchall():
                duck.add((int(r[0]), a, b, *map(int, r[1:])))
maria = {(r["rev_id"], r["name_from"], r["name_to"], r["from_before"], r["from_after"], r["to_before"], r["to_after"])
         for r in json.loads((here / "data" / "war-name-swaps.json").read_text())["rows"]}
print(f"swaps: MariaDB {len(maria)}, DuckDB {len(duck)}, only in MariaDB {len(maria - duck)}, only in DuckDB {len(duck - maria)}")
print(sorted(maria - duck)[:5], sorted(duck - maria)[:5])
