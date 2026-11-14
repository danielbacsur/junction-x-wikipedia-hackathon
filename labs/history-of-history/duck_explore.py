# /// script
# dependencies = ["duckdb", "pytz"]
# ///
"""Supplementary DuckDB-only questions about Part 1, answered from
cache/name_count.parquet (built by duck_names.py): who added the mentions, and
which articles drove the jumps.

uv run duck_explore.py
"""
import pathlib
import duckdb

here = pathlib.Path(__file__).parent
con = duckdb.connect()
con.execute(f"""CREATE TABLE v AS
    SELECT *, vapaus_c1 - vapaus_c2 AS medal,
           lag(sisällis_c4, 1, 0) OVER w AS p_sis, lag(vapaus_c4, 1, 0) OVER w AS p_vap, lag(vapaus_c1 - vapaus_c2, 1, 0) OVER w AS p_medal
    FROM read_parquet('{here / 'cache' / 'name_count.parquet'}')
    WINDOW w AS (PARTITION BY page_id ORDER BY timestamp, rev_id)""")


def show(title, sql):
    print("--", title)
    for r in con.execute(sql).fetchall():
        print("  ", r)


show("net running-text 'sisällissota' mentions added per user in 2008 (top 5) and the year's total",
     """SELECT "user", sum(sisällis_c4 - p_sis) AS added, count(DISTINCT page_id) AS articles FROM v WHERE year(timestamp) = 2008
        GROUP BY ALL ORDER BY added DESC LIMIT 5""")
show("total net added in 2008", "SELECT sum(sisällis_c4 - p_sis) FROM v WHERE year(timestamp) = 2008")
show("net 'Vapaussodan muistomitali' mentions added per user, 2008-2009 (top 5) and the total",
     """SELECT "user", sum(medal - p_medal) AS added, count(DISTINCT page_id) AS articles FROM v WHERE year(timestamp) IN (2008, 2009)
        GROUP BY ALL ORDER BY added DESC LIMIT 5""")
show("total medal net added 2008-2009", "SELECT sum(medal - p_medal) FROM v WHERE year(timestamp) IN (2008, 2009)")
for y in (2016, 2022):
    show(f"net running-text 'vapaussota' mentions added per article in {y} (top 8)",
         f"""SELECT title, sum(vapaus_c4 - p_vap) AS added FROM v WHERE year(timestamp) = {y} GROUP BY ALL ORDER BY added DESC LIMIT 8""")
    show(f"... and per user in {y} (top 5)",
         f"""SELECT "user", sum(vapaus_c4 - p_vap) AS added, count(DISTINCT page_id) FROM v WHERE year(timestamp) = {y} GROUP BY ALL ORDER BY added DESC LIMIT 5""")
show("articles on 2026-10-01 with the most running-text 'vapaussota' mentions",
     """SELECT title, vapaus_c4, sisällis_c4 FROM v QUALIFY row_number() OVER (PARTITION BY page_id ORDER BY timestamp DESC, rev_id DESC) = 1
        ORDER BY vapaus_c4 DESC LIMIT 12""")
show("articles on 2026-10-01 that use vapaussota in running text and never sisällissota",
     """SELECT count(*) FILTER (vapaus_c4 > 0 AND sisällis_c4 = 0), count(*) FILTER (vapaus_c4 > 0 AND sisällis_c4 > 0), count(*) FILTER (vapaus_c4 = 0 AND sisällis_c4 > 0)
        FROM (SELECT * FROM v QUALIFY row_number() OVER (PARTITION BY page_id ORDER BY timestamp DESC, rev_id DESC) = 1)""")

# Part 2: what the cleaning in year-heatmap.sql removes, on the articles of 2026-10-01
P = str(here.parent.parent / "data" / "m" / "versions-*.parquet")
con.execute(f"""CREATE TABLE cur AS SELECT page_id, text FROM read_parquet('{P}')
    QUALIFY row_number() OVER (PARTITION BY page_id ORDER BY timestamp DESC, rev_id DESC) = 1""")
REFS = "(?is)<ref[^>/]*>.*?</ref>|<ref[^>]*>"
CITE = r"(?i)\{\{[a-zåäö]*viite[^{}]*\}\}"
steps = {
    "raw wikitext": "text",
    "footnotes removed": f"regexp_replace(text, '{REFS}', ' ', 'g')",
    "footnotes and citation templates removed": f"regexp_replace(regexp_replace(text, '{REFS}', ' ', 'g'), '{CITE}', ' ', 'g')",
    "also century phrases removed (as in year-heatmap.sql)": f"regexp_replace(regexp_replace(text, '{REFS}|[0-9]{{2}}00-lu[kv]u', ' ', 'g'), '{CITE}', ' ', 'g')",
}
print("-- year mentions on 2026-10-01 by how much of the text is cleaned: total, share of years 2000-2026, mentions of 1975, 1800, 1918")
for label, expr in steps.items():
    r = con.execute(f"""WITH tok AS (SELECT unnest(regexp_extract_all({expr}, '[0-9]+')) AS tok FROM cur),
        y AS (SELECT tok::INT AS y FROM tok WHERE regexp_full_match(tok, '1[0-9]{{3}}|20[01][0-9]|202[0-6]'))
        SELECT count(*), round(100 * avg((y >= 2000)::INT), 1), count(*) FILTER (y = 1975), count(*) FILTER (y = 1800), count(*) FILTER (y = 1918) FROM y""").fetchone()
    print("  ", label, r)
show("mentions of the book 'Suomen jääkärien elämäkerrasto 1975' left in running text on 2026-10-01",
     f"""SELECT sum(len(regexp_extract_all({steps['also century phrases removed (as in year-heatmap.sql)']}, 'elämäkerrasto[^0-9]{{0,3}}1975'))),
                sum(len(regexp_extract_all({steps['also century phrases removed (as in year-heatmap.sql)']}, 'Vaasa 1975'))) FROM cur""")
