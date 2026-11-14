# /// script
# dependencies = []
# ///
"""Prints every table and number quoted in README.md from the JSON files in data/.

uv run report.py
"""
import json, pathlib

data = pathlib.Path(__file__).parent / "data"
NAMES = ["sisällissota", "vapaussota", "kansalaissota", "luokkasota", "veljessota", "punakapina"]


def load(name):
    f = data / name
    return json.loads(f.read_text()) if f.exists() else None


def pct(x):
    return f"{100 * x:5.1f}"


wn = load("war-names.json")
if wn:
    by = {}
    for r in wn["rows"]:
        by.setdefault(r["date"], {})[r["name"]] = r
    print("PART 1. Running-text mentions of each name and share of the six names, per snapshot")
    print("date        articles | " + " ".join(f"{n[:9]:>9}" for n in NAMES) + " | share % " + " ".join(f"{n[:5]:>5}" for n in NAMES) + " | secs")
    for d, v in by.items():
        print(d, f"{v[NAMES[0]]['articles_total']:9d} | " + " ".join(f"{v[n]['running_text']:9d}" for n in NAMES) + " |         "
              + " ".join(pct(v[n]["share_running"]) for n in NAMES) + f" | {v[NAMES[0]]['seconds']:5.1f}")
    print("\nArticles with at least one running-text mention")
    for d, v in by.items():
        print(d, " ".join(f"{v[n]['articles_running']:6d}" for n in NAMES))
    print("\nWhere the mentions sit (mentions = other_countries + medal + category_or_file + link_target + running_text)")
    for d in ("2004-12-31", "2007-12-31", "2010-12-31", "2017-12-31", "2026-10-01"):
        for n in NAMES[:3]:
            r = by[d][n]
            print(d, f"{n:14}", {k: r[k] for k in ("articles", "mentions", "other_countries", "medal", "category_or_file", "link_target", "running_text")},
                  "share of all mentions", pct(r["share_mentions"]))
    print("\nRank order of the names by running-text mentions (changes only)")
    last = None
    for d, v in by.items():
        order = [n for n in sorted(NAMES, key=lambda n: -v[n]["running_text"])]
        if order[:3] != last:
            print(d, " > ".join(f"{n} {v[n]['running_text']}" for n in order[:3]))
            last = order[:3]
    secs = [v[NAMES[0]]["seconds"] for v in by.values()]
    print(f"\nsnapshot query: {len(secs)} runs, min {min(secs)} s, median {sorted(secs)[len(secs) // 2]} s, max {max(secs)} s, total {sum(secs):.0f} s")

sw = load("war-name-swaps.json")
if sw:
    rows = sw["rows"]
    print(f"\nPART 1b. {len(rows)} swap rows, {len({r['rev_id'] for r in rows})} edits, {len({r['page_id'] for r in rows})} articles;", sw["timings"])
    for r in sw["by_direction"]:
        print("  ", r)
    print("fresh swaps (not themselves reverts) and what became of them")
    for a, b in (("sisällissota", "vapaussota"), ("vapaussota", "sisällissota"), ("kansalaissota", "sisällissota"), ("sisällissota", "kansalaissota")):
        fresh = [r for r in rows if r["name_from"] == a and r["name_to"] == b and not r["is_revert"]]
        undone = [r for r in fresh if r["was_undone"]]
        secs = sorted(r["undone_after_seconds"] for r in undone)
        anon = [r for r in fresh if r["editor"] != "named"]
        print(f"   {a} -> {b}: {len(fresh)} fresh, {len(undone)} undone ({100 * len(undone) / len(fresh):.0f} %), median {secs[len(secs) // 2] / 60:.0f} min to undo, "
              f"{sum(x <= 3600 for x in secs)} within the hour; by anonymous editors {len(anon)}, of which undone {sum(r['was_undone'] for r in anon)}; "
              f"by named editors {len(fresh) - len(anon)}, of which undone {len(undone) - sum(r['was_undone'] for r in anon)}")
        years = {}
        for r in fresh:
            years[r["saved_at"][:4]] = years.get(r["saved_at"][:4], 0) + 1
        print("      per year:", dict(sorted(years.items())))
    main = [r for r in rows if r["page_id"] == 1150 and r["name_from"] == "sisällissota" and r["name_to"] == "vapaussota" and not r["is_revert"]]
    print(f"   main article: {len(main)} fresh sisällissota -> vapaussota swaps, {sum(r['was_undone'] for r in main)} undone")
    print("articles with the most swaps")
    for r in sw["by_article"][:10]:
        print("  ", r)
    print("top swaps between the three main names")
    for r in [r for r in rows if r["name_from"] in NAMES[:3] and r["name_to"] in NAMES[:3]][:25]:
        print("  ", r["saved_at"][:16], r["rev_id"], r["title"], "|", r["user"], f"({r['editor']})", "|", f"{r['name_from']} {r['from_before']}->{r['from_after']}, {r['name_to']} {r['to_before']}->{r['to_after']}",
              "| revert" if r["is_revert"] else "|", f"undone after {r['undone_after_seconds']} s by {r['undone_by_user']}" if r["was_undone"] else "", "|", (r["comment"] or "")[:110])
    print("main article:", {k: v for k, v in sw["main_article"].items() if k != "page_moves_naming_the_war"})
    for r in sw["main_article"]["page_moves_naming_the_war"]:
        print("  move", r["saved_at"][:10], r["title_today"], "|", r["comment"][:120])

ma = load("main-article.json")
if ma:
    print("\nPART 1c. The main article (page 1150): opening name, infobox side, opening text per date")
    for r in ma["opening_names"]:
        print("  ", r)
    for r in ma["infobox_belligerent_1"] + ma["infobox_side_switches"]:
        print("  ", r)
    for r in ma["rows"]:
        print("  ", r["as_of"], r["rev_id"], (r["lead_text"] or "")[:150].replace("\n", " "))

hm = load("year-heatmap.json")
if hm:
    m = {}
    for r in hm["rows"]:
        m.setdefault(r["date"], {})[r["decade"]] = r["mentions"]
    total = {d: sum(v.values()) for d, v in m.items()}
    share = lambda d, k: 100 * m[d][k] / total[d]
    cols = [d for d in ("2006-12-31", "2009-12-31", "2011-12-31", "2017-12-31", "2021-12-31", "2026-10-01") if d in m]
    print("\nPART 2. Share % of all year mentions per decade, by the date Wikipedia is read")
    print("decade      " + " ".join(c[:4].rjust(6) for c in cols) + "   mentions " + cols[-1][:4])
    print("before 1800 " + " ".join(f"{100 * sum(m[c][k] for k in range(1000, 1800, 10)) / total[c]:6.2f}" for c in cols)
          + f"   {sum(m[cols[-1]][k] for k in range(1000, 1800, 10)):8d}")
    for dec in range(1800, 2030, 10):
        print(f"{dec}s       " + " ".join(f"{share(c, dec):6.2f}" for c in cols) + f"   {m[cols[-1]][dec]:8d}")
    print("all         " + " ".join(f"{total[c]:6d}" for c in cols))

    def change(a, b, lo=1000, hi=2030, top=5):
        if a not in m or b not in m:
            return
        ch = sorted((share(b, k) - share(a, k), k, m[a][k], m[b][k]) for k in range(lo, hi, 10))
        fmt = lambda x: f"{x[1]}s {x[0]:+.2f} pt ({share(a, x[1]):.2f} % -> {share(b, x[1]):.2f} %, {x[2]} -> {x[3]} mentions)"
        print(f"{a} -> {b}, decades {lo}-{hi - 1}:\n   gained: " + "; ".join(fmt(x) for x in ch[::-1][:top]) + "\n   lost:   " + "; ".join(fmt(x) for x in ch[:top]))

    change("2006-12-31", "2026-10-01")
    change("2006-12-31", "2026-10-01", hi=2000)
    change("2017-12-31", "2026-10-01", hi=2000)
    change("2016-12-31", "2018-12-31", hi=2000)
    change("2021-12-31", "2026-10-01", hi=2000)
    print("share of the 1910s per snapshot:", ", ".join(f"{d[:4]}: {share(d, 1910):.2f}" for d in sorted(m)))

yy = load("year-heatmap-years.json")
if yy:
    rows = {r["date"]: r for r in yy["rows"]}
    year = lambda d, y: rows[d]["mentions"][y - 1000]
    print("most mentioned year per snapshot:", ", ".join(f"{d[:4]}: {max(range(1000, 2027), key=lambda y: year(d, y))} ({max(r['mentions'])})" for d, r in sorted(rows.items())))
    for d in ("2006-12-31", "2016-12-31", "2026-10-01"):
        if d in rows:
            top = sorted(((n, 1000 + k) for k, n in enumerate(rows[d]["mentions"])), reverse=True)[:10]
            print("most mentioned years", d, ", ".join(f"{y} ({n})" for n, y in top))
    for a, b in (("2017-12-31", "2026-10-01"), ("2021-12-31", "2026-10-01")):
        if a in rows and b in rows:
            ratio = sorted(((year(b, y) / year(a, y), y) for y in range(1000, 2000) if year(a, y) >= 300), reverse=True)
            fmt = lambda x: f"{x[1]} x{x[0]:.2f} ({year(a, x[1])} -> {year(b, x[1])})"
            print(f"{a} -> {b}: all year mentions x{rows[b]['total'] / rows[a]['total']:.2f}; of the years before 2000 with at least 300 mentions on the first date,"
                  f"\n   fastest: " + ", ".join(fmt(x) for x in ratio[:6]) + "\n   slowest: " + ", ".join(fmt(x) for x in ratio[-4:]))
            dec = lambda d, k: sum(year(d, y) for y in range(k, k + 10))
            print("   growth per decade:", ", ".join(f"{k}s x{dec(b, k) / dec(a, k):.2f}" for k in range(1800, 2000, 10)))
    secs = [r["seconds"] for r in yy["rows"]]
    print(f"year query: {len(secs)} runs, min {min(secs)} s, median {sorted(secs)[len(secs) // 2]} s, max {max(secs)} s, total {sum(secs):.0f} s")

ts = load("term-shares.json")
if ts:
    t = {}
    for r in ts["rows"]:
        t.setdefault(r["date"], {})[r["term"]] = r
    terms = list(ts["patterns"])
    print("\nPART 3. Share % of articles mentioning each word, per snapshot")
    print("date        engine   articles " + " ".join(x[:9].rjust(9) for x in terms))
    for d in sorted(t):
        any_row = t[d][terms[0]]
        print(d, f"{any_row['engine']:8} {any_row['articles_total']:8d} " + " ".join(f"{100 * t[d][x]['articles'] / any_row['articles_total']:9.2f}" for x in terms))
    for d in ("2021-12-31", "2026-10-01"):
        print(f"articles {d}          " + " ".join(f"{t[d][x]['articles']:9d}" for x in terms))
    secs = sorted(v[terms[0]]["seconds"] for v in t.values() if v[terms[0]]["engine"] == "mariadb")
    print(f"term query on MariaDB: {len(secs)} of {len(t)} snapshots, min {secs[0]} s, median {secs[len(secs) // 2]} s, max {secs[-1]} s, total {sum(secs):.0f} s")
