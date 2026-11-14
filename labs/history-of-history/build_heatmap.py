# /// script
# dependencies = []
# ///
"""Part 2: turns the per-snapshot year counts into data/year-heatmap.json (decades)
and data/year-heatmap-years.json (single years). Uses the MariaDB result
(cache/maria-years.json, from year_heatmap.py) and compares every number with the
DuckDB result (cache/duck-years.json, from duck_years.py) when that file exists.

uv run build_heatmap.py
"""
import json, pathlib

here = pathlib.Path(__file__).parent
maria = json.loads((here / "cache" / "maria-years.json").read_text())
duck_file = here / "cache" / "duck-years.json"
duck = json.loads(duck_file.read_text()) if duck_file.exists() else {}

dates = sorted(maria)
diff = 0
for d in dates:
    if d in duck:
        a = {int(y): v for y, v in maria[d]["years"].items()}
        b = {int(y): v for y, v in duck[d].items()}
        bad = [y for y in set(a) | set(b) if a.get(y) != b.get(y)]
        diff += len(bad)
        if bad:
            print("DIFF", d, len(bad), "years, e.g.", [(y, a.get(y), b.get(y)) for y in sorted(bad)[:5]])
print(f"{len(dates)} snapshots from MariaDB, {sum(d in duck for d in dates)} compared with DuckDB, {diff} (snapshot, year) cells differ")

rows, year_rows = [], []
for d in dates:
    years = {int(y): v[0] for y, v in maria[d]["years"].items()}
    total = sum(years.values())
    for decade in range(1000, 2030, 10):
        n = sum(years.get(y, 0) for y in range(decade, decade + 10))
        rows.append({"date": d, "decade": decade, "mentions": n, "share": round(n / total, 5)})
    year_rows.append({"date": d, "total": total, "seconds": maria[d]["seconds"], "mentions": [years.get(y, 0) for y in range(1000, 2027)]})

source = "wtt.revision FOR SYSTEM_TIME AS OF each date (labs/history-of-history/year-heatmap.sql)"
(here / "data" / "year-heatmap.json").write_text(json.dumps({
    "title": "History of history: decade of Finnish history mentioned, by the date Wikipedia was read",
    "unit": "mentions of four-digit years 1000-2026 outside footnotes, summed per decade; share = mentions / all year mentions on that date",
    "source": source, "rows": rows}, indent=1))
(here / "data" / "year-heatmap-years.json").write_text(json.dumps({
    "title": "History of history: year of Finnish history mentioned, by the date Wikipedia was read",
    "unit": "mentions of each four-digit year outside footnotes; rows[i].mentions[k] is the count for year 1000 + k",
    "source": source, "first_year": 1000, "last_year": 2026, "rows": year_rows}))
print("wrote data/year-heatmap.json", len(rows), "rows and data/year-heatmap-years.json", len(year_rows), "rows")
