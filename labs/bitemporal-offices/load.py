# /// script
# dependencies = ["pymysql"]
# ///
"""Step 2. Turn the cached infoboxes into claim lifetimes and load the bitemporal table.

Reads cache/infobox.json (written by extract.py), decides which versions count as "Wikipedia said",
parses the office fields, collapses consecutive versions that state the same term into one row per
claim lifetime, and loads lab_bitemporal_offices.office_term with system_versioning_insert_history = 1
so that row_start / row_end are Wikipedia's own edit times. Also runs the WITHOUT OVERLAPS trials and
writes data/summary.json (coverage) and data/overlap-trials.json.

    uv run load.py
"""
import collections, datetime, json, time
from pathlib import Path
import pymysql
from parse import parse_box, OPEN_END, PRESIDENT

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"; DATA.mkdir(exist_ok=True)
DB = "lab_bitemporal_offices"
WINDOW = datetime.timedelta(days=30)      # a version undone within this long never counts as "Wikipedia said"
TS = "%Y-%m-%d %H:%M:%S.%f"

def ts(s):
    return datetime.datetime.strptime(s, TS)

# ---------------------------------------------------------------------------------------------- which versions count
def skipped_naive(versions):
    """The brief's rule: edit.undone_by IS NOT NULL."""
    return {v["seq"] for v in versions if v["undone_by"] is not None}

def skipped_window(versions, window=WINDOW):
    """A version is skipped when a revert that itself stood removed it within `window` of its saving.

    edit.restores says which earlier version a revert brought back (same sha1). Everything between the
    restored version and the revert was removed by it. Two things make the plain undone_by flag unusable
    here: a blanked page "restores" the previous blanking, which marks hundreds of good versions in
    between as undone; and a revert that was itself reverted removed nothing. So reverts are walked from
    the newest to the oldest, a revert only counts if it was not itself skipped, and it only removes
    versions that had been live for at most `window` (what stood longer was what Wikipedia said)."""
    by_seq = {v["seq"]: v for v in versions}
    skipped = set()
    for r in sorted(versions, key=lambda v: -v["seq"]):
        if r["restores"] is None or r["seq"] in skipped:
            continue
        at = ts(r["saved_at"])
        for seq in range(r["seq"] - 1, r["restores"], -1):
            v = by_seq.get(seq)
            if v is None:
                continue
            if at - ts(v["saved_at"]) > window:
                break
            skipped.add(seq)
    return skipped

# ---------------------------------------------------------------------------------------------- claim lifetimes
def lifetimes(page_id, title, versions, skipped, parsed):
    """Walk the accepted versions in order; one output row per maximal run of versions stating the same thing."""
    rows, bad_rows = [], []
    open_claims, open_bad = {}, {}
    stats = collections.Counter()
    for v in versions:
        if v["seq"] in skipped:
            stats["versions_skipped"] += 1
            continue
        stats["versions_accepted"] += 1
        if v["box"] is None:
            claims, unparsed = {}, set()
            stats["accepted_without_office_infobox"] += 1
        else:
            claims, unparsed, _ = parsed[v["box"]]
            stats["accepted_with_office_infobox"] += 1
            stats["accepted_fully_parsed" if not unparsed else "accepted_with_unparsed_field"] += 1
            stats["term_fields_parsed"] += len(claims)
            stats["term_fields_unparsed"] += len(unparsed)
            for _, _, reason in unparsed:
                stats["unparsed: " + reason] += 1
        for store, now, out in ((open_claims, claims, rows), (open_bad, {u: u[1] for u in unparsed}, bad_rows)):
            for key in [k for k in store if k not in now]:
                first, n = store.pop(key)
                out.append((key, first, n, v))
            for key, source in now.items():
                if key in store:
                    store[key][1] += 1
                else:
                    store[key] = [dict(v, source=source), 1]
    for store, out in ((open_claims, rows), (open_bad, bad_rows)):
        for key, (first, n) in store.items():
            out.append((key, first, n, None))
    return rows, bad_rows, stats

DDL = """
CREATE TABLE office_term (
  page_id     INT UNSIGNED NOT NULL,            -- the article that makes the statement
  person      VARCHAR(255) NOT NULL,            -- its title: the person the infobox is about
  office      VARCHAR(64)  NOT NULL,
  valid_from  DATE NOT NULL,                    -- stated first day in office
  valid_to    DATE NOT NULL,                    -- stated last day, exclusive: the handover day belongs to the successor
  open_ended  BOOLEAN NOT NULL,                 -- "still in office": valid_to is the 9999-12-31 stand-in
  rev_id      INT UNSIGNED NOT NULL,            -- the version that first made this statement
  seq         INT UNSIGNED NOT NULL,
  editor      VARCHAR(255),                     -- who saved that version
  editor_kind VARCHAR(8) NOT NULL,
  comment     VARCHAR(1000),                    -- their edit summary
  versions    INT UNSIGNED NOT NULL,            -- accepted versions that repeated the statement
  source_text VARCHAR(600) NOT NULL,            -- the raw infobox field, as first written
  row_start   TIMESTAMP(6) GENERATED ALWAYS AS ROW START,   -- when Wikipedia started saying it (UTC)
  row_end     TIMESTAMP(6) GENERATED ALWAYS AS ROW END,     -- when it changed or disappeared
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  PERIOD FOR valid_time (valid_from, valid_to),
  {key},
  KEY office_valid (office, valid_from, valid_to)
) WITH SYSTEM VERSIONING
"""
KEY_PLAIN = "PRIMARY KEY (page_id, office, valid_from, valid_to)"
KEY_STRICT = "PRIMARY KEY (page_id, office, valid_time WITHOUT OVERLAPS)"

UNPARSED_DDL = """
CREATE TABLE office_unparsed (
  page_id   INT UNSIGNED NOT NULL,
  person    VARCHAR(255) NOT NULL,
  office    VARCHAR(64)  NOT NULL,
  raw_text  VARCHAR(200) NOT NULL,              -- the field after link and markup removal
  reason    VARCHAR(40)  NOT NULL,              -- why the parser refused it
  rev_id    INT UNSIGNED NOT NULL,
  editor    VARCHAR(255),
  comment   VARCHAR(1000),
  versions  INT UNSIGNED NOT NULL,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  KEY (page_id, office)
) WITH SYSTEM VERSIONING
"""

COLUMNS = ("page_id, person, office, valid_from, valid_to, open_ended, rev_id, seq, editor, editor_kind, comment, "
           "versions, source_text, row_start")
# A claim that is no longer made is inserted as a history row with both ends of its system period.
# A claim still made today is inserted with row_start only, so MariaDB itself marks it as the current row.
INSERT_HISTORY = "INSERT INTO {table} (" + COLUMNS + ", row_end) VALUES (" + ",".join(["%s"] * 15) + ")"
INSERT_CURRENT = "INSERT INTO {table} (" + COLUMNS + ") VALUES (" + ",".join(["%s"] * 14) + ")"

def insert(cur, table, row):
    if row[14] is None:
        cur.execute(INSERT_CURRENT.format(table=table), row[:14])
    else:
        cur.execute(INSERT_HISTORY.format(table=table), row)

def term_params(row, page_id, title):
    (office, start, end, open_ended), first, n, ended_by = row
    return (page_id, title, office, start, end, open_ended, first["rev_id"], first["seq"], first["user"],
            first["editor"], first["comment"], n, first["source"], first["saved_at"],
            ended_by["saved_at"] if ended_by else None)

def main():
    cache = json.loads((ROOT / "cache" / "infobox.json").read_text())
    parsed = {h: parse_box(b["fields"]) for h, b in cache["boxes"].items()}
    c = pymysql.connect(host="127.0.0.1", port=3310, user="root", password="wtt", autocommit=True)
    cur = c.cursor()
    cur.execute(f"CREATE DATABASE IF NOT EXISTS {DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci")
    cur.execute(f"USE {DB}")
    cur.execute("SET time_zone = '+00:00'")
    cur.execute("SET system_versioning_insert_history = 1")

    total = collections.Counter(); per_page = []; all_rows = []; all_bad = []
    rule_counts = collections.Counter()
    for pid, page in cache["pages"].items():
        pid = int(pid); versions = page["versions"]
        assert all(v["saved_at"] == v["edit_saved_at"] for v in versions), "revision.row_start <> edit.saved_at"
        naive, window = skipped_naive(versions), skipped_window(versions)
        rows, bad, stats = lifetimes(pid, page["title"], versions, window, parsed)
        for name, skip in (("none", set()), ("undone_by", naive), ("window_30d", window),
                           ("window_1d", skipped_window(versions, datetime.timedelta(days=1))),
                           ("window_365d", skipped_window(versions, datetime.timedelta(days=365)))):
            r, _, _ = lifetimes(pid, page["title"], versions, skip, parsed)
            rule_counts[name + ": versions skipped"] += len(skip)
            rule_counts[name + ": claim rows"] += len(r)
        total.update(stats); total["versions_read"] += len(versions)
        per_page.append({"page_id": pid, "person": page["title"], "versions_read": len(versions),
                         "skipped_by_undone_by": len(naive), "skipped_by_window_30d": len(window),
                         "accepted_with_office_infobox": stats["accepted_with_office_infobox"],
                         "accepted_with_unparsed_field": stats["accepted_with_unparsed_field"],
                         "claim_rows": len(rows), "unparsed_rows": len(bad)})
        all_rows += [term_params(r, pid, page["title"]) for r in rows]
        all_bad += [(pid, page["title"], k[0], k[1], k[2], first["rev_id"], first["user"], first["comment"], n,
                     first["saved_at"], ended["saved_at"] if ended else None) for k, first, n, ended in bad]
    all_rows.sort(key=lambda r: (r[13], r[0], r[2], r[3]))

    # -- trial 1: can the bitemporal table itself forbid overlapping terms inside one article?
    cur.execute("DROP TABLE IF EXISTS office_term_strict")
    cur.execute(DDL.replace("office_term", "office_term_strict", 1).format(key=KEY_STRICT))
    rejected = []
    for r in all_rows:
        try:
            insert(cur, "office_term_strict", r)
        except pymysql.err.IntegrityError as e:
            cur.execute("SELECT valid_from, valid_to, row_start, row_end FROM office_term_strict FOR SYSTEM_TIME ALL "
                        "WHERE page_id=%s AND office=%s AND valid_from < %s AND valid_to > %s", (r[0], r[2], r[4], r[3]))
            clashes = cur.fetchall()
            together = [x for x in clashes if (r[14] is None or str(x[2]) < r[14]) and str(x[3]) > r[13]]
            rejected.append({"person": r[1], "office": r[2], "valid_from": str(r[3]), "valid_to": str(r[4]),
                             "said_from": r[13], "said_until": r[14], "rev_id": r[6],
                             "error": e.args[1][:120],
                             "overlapping_rows_in_table": len(clashes),
                             "of_which_said_at_the_same_time": len(together),
                             "clashes_with": [{"valid_from": str(x[0]), "valid_to": str(x[1]), "said_from": str(x[2]),
                                               "said_until": str(x[3])} for x in clashes[:3]]})
    cur.execute("SELECT COUNT(*) FROM office_term_strict FOR SYSTEM_TIME ALL")
    strict_loaded = cur.fetchone()[0]

    # -- the table the lab uses: the strict key when the real data passes it, the plain key otherwise
    key = KEY_PLAIN if rejected else KEY_STRICT
    cur.execute("DROP TABLE IF EXISTS office_term_strict")
    cur.execute("DROP TABLE IF EXISTS office_term")
    cur.execute(DDL.format(key=key))
    t0 = time.perf_counter()
    for r in all_rows:
        insert(cur, "office_term", r)
    load_seconds = time.perf_counter() - t0
    cur.execute("DROP TABLE IF EXISTS office_unparsed")
    cur.execute(UNPARSED_DDL)
    for b in all_bad:
        cols = "page_id, person, office, raw_text, reason, rev_id, editor, comment, versions, row_start"
        if b[10] is None:
            cur.execute(f"INSERT INTO office_unparsed ({cols}) VALUES (" + ",".join(["%s"] * 10) + ")", b[:10])
        else:
            cur.execute(f"INSERT INTO office_unparsed ({cols}, row_end) VALUES (" + ",".join(["%s"] * 11) + ")", b)
    cur.execute("SET system_versioning_insert_history = 0")
    cur.execute("GRANT SELECT, EXECUTE ON lab_bitemporal_offices.* TO 'wtt'@'%'")

    cur.execute("SELECT COUNT(*) FROM office_term FOR SYSTEM_TIME ALL")
    n_all = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM office_term")
    n_current = cur.fetchone()[0]
    cur.execute("SELECT a.office, a.n, COALESCE(c.n, 0) FROM (SELECT office, COUNT(*) n FROM office_term FOR SYSTEM_TIME ALL "
                "GROUP BY office) a LEFT JOIN (SELECT office, COUNT(*) n FROM office_term GROUP BY office) c USING (office)")
    by_office = [{"office": o, "claim_rows": int(n), "current": int(k)} for o, n, k in cur.fetchall()]
    cur.execute("SHOW CREATE TABLE office_term")
    (ROOT / "sql" / "schema.sql").write_text(
        "-- lab_bitemporal_offices.office_term as MariaDB reports it after load.py (note row_end inside the key)\n"
        + cur.fetchone()[1] + ";\n")

    summary_rows = [
        {"measure": "articles read", "value": len(cache["pages"])},
        {"measure": "versions read", "value": total["versions_read"]},
        {"measure": "seconds to read them (extract.py)", "value": cache["read_seconds"]},
        {"measure": "distinct office infoboxes among them", "value": len(cache["boxes"])},
        {"measure": "versions skipped as reverted within 30 days", "value": total["versions_skipped"]},
        {"measure": "versions accepted", "value": total["versions_accepted"]},
        {"measure": "accepted versions without an office infobox", "value": total["accepted_without_office_infobox"]},
        {"measure": "accepted versions with an office infobox", "value": total["accepted_with_office_infobox"]},
        {"measure": "of those, every loaded office field parsed", "value": total["accepted_fully_parsed"]},
        {"measure": "of those, at least one field unparsed", "value": total["accepted_with_unparsed_field"]},
        {"measure": "stated terms read (version x term)", "value": total["term_fields_parsed"]},
        {"measure": "stated terms refused (version x field)", "value": total["term_fields_unparsed"]},
    ] + [{"measure": k, "value": v} for k, v in sorted(total.items()) if k.startswith("unparsed: ")] + [
        {"measure": "claim lifetime rows loaded (office_term, all system time)", "value": int(n_all)},
        {"measure": "of those, current statements", "value": int(n_current)},
        {"measure": "unparsed lifetime rows loaded (office_unparsed)", "value": len(all_bad)},
        {"measure": "seconds to insert the claim rows", "value": round(load_seconds, 3)},
    ] + [{"measure": k, "value": v} for k, v in sorted(rule_counts.items())]
    (DATA / "summary.json").write_text(json.dumps({
        "title": "Bitemporal office terms: what was read, parsed, skipped and loaded",
        "unit": "count (seconds where the measure says so)",
        "source": "wtt.revision FOR SYSTEM_TIME ALL and wtt.edit for 13 president articles; extract.py + load.py",
        "rows": summary_rows, "by_office": by_office, "by_article": per_page}, ensure_ascii=False, indent=2) + "\n")
    (DATA / "overlap-trials.json").write_text(json.dumps({
        "title": "Rows refused by PRIMARY KEY (page_id, office, valid_time WITHOUT OVERLAPS) on the system-versioned table",
        "unit": "claim lifetime rows",
        "source": "load.py, every claim lifetime row inserted one at a time in the order Wikipedia said them",
        "key_used_for_office_term": key,
        "offered": len(all_rows), "loaded": int(strict_loaded), "refused": len(rejected),
        "refused_with_a_clash_said_at_the_same_time": sum(r["of_which_said_at_the_same_time"] > 0 for r in rejected),
        "rows": rejected}, ensure_ascii=False, indent=2) + "\n")
    for r in summary_rows:
        print(f"{r['value']:>10}  {r['measure']}")
    print("key:", key)
    print("strict trial: offered", len(all_rows), "loaded", strict_loaded, "refused", len(rejected),
          "refused with a same-time clash", sum(r["of_which_said_at_the_same_time"] > 0 for r in rejected))
    for p in per_page:
        print(p)

if __name__ == "__main__":
    main()
