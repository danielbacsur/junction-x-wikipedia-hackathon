# /// script
# requires-python = ">=3.11,<3.15"
# dependencies = []
# ///
"""Turns data/raw/*.json into the small files a page can draw, and prints
the tables of the README as markdown.

  uv run report.py > data/raw/tables.md
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
DATA = ROOT / "data"
RAW = DATA / "raw"
SOURCE = "labs/history-at-scale: uv run bench.py, uv run build.py, uv run report.py"


def raw(name):
    path = RAW / f"{name}.json"
    return json.loads(path.read_text())["records"] if path.exists() else []


def save(name, title, unit, rows, note=None):
    document = {"title": title, "unit": unit, "source": SOURCE, "rows": rows}
    if note:
        document["note"] = note
    # one row per line keeps the files small and easy to diff
    head = json.dumps({key: value for key, value in document.items() if key != "rows"}, indent=1)
    body = ",\n".join("  " + json.dumps(row, separators=(",", ":")) for row in rows)
    (DATA / name).write_text(head[:-2] + ',\n "rows": [\n' + body + "\n ]\n}\n")


def slim(record, **extra):
    plan = record["plan"]
    passage = [row for row in plan if row["table"] in ("p", "passage")] or plan
    return {
        "layout": record["layout"], "statement": record["statement"],
        "page": record["page"], "as_of": record["as_of"],
        "rows_returned": record["rows"], "handler_reads": record["handler_reads"],
        "icp_attempts": record.get("icp_attempts"),
        "median_ms": record["median_ms"], "min_ms": record["min_ms"],
        "max_ms": record["max_ms"],
        "key": ",".join(sorted({str(row["key"]) for row in passage})),
        "partitions": passage[0].get("partitions"),
        **extra,
    }


def ms(value):
    return f"{value:.2f}" if value < 10 else f"{value:.1f}" if value < 100 else f"{value:.0f}"


def spread(record):
    return f"{ms(record['median_ms'])} ({ms(record['min_ms'])}–{ms(record['max_ms'])})"


def table(header, lines):
    print("| " + " | ".join(header) + " |")
    print("| " + " | ".join("---" for _ in header) + " |")
    for line in lines:
        print("| " + " | ".join(str(cell) for cell in line) + " |")
    print()


def by(records, *keys):
    return {tuple(record[key] for key in keys): record for record in records}


def partitions_read(record):
    passage = [row for row in record["plan"] if row["table"] in ("p", "passage")]
    names = (passage[0].get("partitions") or "") if passage else ""
    return len(names.split(",")) if names else 0


def main():
    layouts = raw("layouts")
    indexes = raw("indexes")
    globals_ = raw("global-indexes")
    growth = {scale: raw(f"growth-{scale}x") + raw(f"growth-{scale}x-other") for scale in (1, 2, 4)}

    # ---- the headline table: layouts run and index run side by side
    if layouts and indexes:
        a = by(layouts, "layout", "statement", "page", "as_of")
        b = by(indexes, "layout", "statement", "page", "as_of")
        print("### headline: blocks of one article as of a moment\n")
        lines = []
        for page in ("typical", "talvisota", "halonen", "largest"):
            for date in ("2006-12-31 23:59:59", "2019-12-31 23:59:59", "now"):
                flat = a[("flat", "blocks", page, date)]
                per = b[("idx_per", "blocks", page, date)]
                ps = b[("idx_ps", "blocks", page, date)]
                lines.append([
                    page, f"{flat['page_rows_all']:,}", date[:10], f"{flat['rows']:,}",
                    f"{flat['handler_reads']:,}", spread(flat),
                    spread(a[("hc", "blocks", page, date)]), spread(a[("year", "blocks", page, date)]),
                    spread(b[("flat", "blocks", page, date)]),
                    spread(ps), spread(per), f"{per['handler_reads']:,}",
                ])
        table(["article", "rows, all time", "as of", "rows returned", "rows read, flat",
               "A: flat", "A: two partitions", "A: yearly partitions",
               "B: flat", "B: flat + `ps`", "B: flat + `per`", "rows read, `per`"], lines)

    # ---- what one run does inside the server, from ANALYZE FORMAT=JSON
    def inside(record):
        analyzed = record.get("analyze") or {}
        passage = [t for t in analyzed.get("tables", []) if t["table"] in ("p", "passage")]
        if not passage:
            return None
        return {
            "layout": record["layout"], "statement": record["statement"], "page": record["page"],
            "as_of": record["as_of"], "rows_returned": record["rows"],
            "rows_read": record["handler_reads"],
            "index_entries_checked": record.get("icp_attempts", 0),
            "pages_accessed": sum(t["pages"] or 0 for t in passage),
            "server_ms": round(analyzed.get("r_total_time_ms") or 0, 2),
            "client_median_ms": record["median_ms"],
        }

    rows = []
    for label_set, records in ((("flat", "hc", "year"), layouts),
                               (("flat", "idx_ps", "idx_per", "idx_pe"), indexes),
                               (("hc_per", "hc_ps", "hc_auto"), raw("combined"))):
        for record in records:
            if record["statement"] == "blocks" and record["layout"] in label_set:
                row = inside(record)
                if row:
                    # the index run has its own flat baseline
                    if records is indexes and row["layout"] == "flat":
                        row["layout"] = "flat_run_b"
                    rows.append(row)
    if rows:
        save("inside-server.json",
             "What one as-of read of an article costs inside the server",
             "rows handed to the server, index entries checked by a pushed-down condition, "
             "InnoDB page accesses and milliseconds, all from one ANALYZE FORMAT=JSON run",
             rows,
             note="server_ms leaves out sending and decoding the rows; client_median_ms is the timed median of 7.")
        print("### inside the server (one ANALYZE run each)\n")
        index = by(rows, "layout", "page", "as_of")
        names = [n for n in ("flat", "hc", "year", "flat_run_b", "idx_ps", "idx_per", "hc_per") if any(r["layout"] == n for r in rows)]
        lines = []
        for page in ("talvisota", "halonen", "largest"):
            for date in ("2006-12-31 23:59:59", "2019-12-31 23:59:59", "now"):
                line = [page, date[:10], index[("flat", page, date)]["rows_returned"]]
                for name in names:
                    r = index.get((name, page, date))
                    line.append(f"{r['rows_read'] + r['index_entries_checked']:,} / {r['pages_accessed']:,} / {r['server_ms']}" if r else "")
                lines.append(line)
        table(["article", "as of", "rows returned"] + [f"{n}: rows + entries / pages / ms" for n in names], lines)

    years = RAW / "rows-by-end-year.out"
    if years.exists():
        rows = []
        for line in years.read_text().splitlines():
            cells = [cell.strip() for cell in line.strip("|").split("|")]
            if len(cells) == 2 and cells[0].isdigit():
                year = int(cells[0])
                rows.append({"ended": "still standing" if year > 2100 else year, "rows": int(cells[1])})
        save("rows-by-end-year.json",
             "Passage rows by the year their stretch ended",
             "rows of wtt.passage; a yearly history partition holds one of these bars",
             rows)

    # ---- timings by layout and statement
    if layouts:
        save("timings.json",
             "Hot statements by table layout (median of 7 runs after a warm-up)",
             "milliseconds of client wall time; handler_reads is the sum of the session's Handler_read_* counters for one run",
             [slim(record, page_rows_all=record["page_rows_all"]) for record in layouts],
             note="core is wtt.passage; flat, hc and year are copies in lab_history_at_scale. "
                  "Labels of one case were measured back to back on a shared, loaded machine: compare within a row.")
        index = by(layouts, "layout", "statement", "page", "as_of")
        names = [label for label in ("core", "flat", "hc", "year")
                 if any(record["layout"] == label for record in layouts)]

        print("### blocks: every block of one article as of a moment\n")
        lines = []
        for page in ("small", "typical", "p95", "p99", "talvisota", "halonen", "largest"):
            for date in ("2006-12-31 23:59:59", "2012-12-31 23:59:59", "2019-12-31 23:59:59",
                         "2026-09-30 23:59:59", "now"):
                first = index.get((names[0], "blocks", page, date))
                if not first:
                    continue
                flat = index.get(("flat", "blocks", page, date), first)
                line = [page, first["page_rows_all"], date[:10], first["rows"], flat["handler_reads"]]
                for label in names:
                    record = index[(label, "blocks", page, date)]
                    line.append(spread(record))
                year = index.get(("year", "blocks", page, date))
                if year:
                    line.append(year["handler_reads"])
                    line.append(partitions_read(year))
                lines.append(line)
        header = ["article", "rows all time", "as of", "rows returned", "rows read (flat)"]
        header += [f"{label} ms" for label in names]
        if "year" in names:
            header += ["rows read (year)", "partitions (year)"]
        table(header, lines)

        for statement in ("blocks_text", "diff"):
            print(f"### {statement}\n")
            lines = []
            for page in ("typical", "talvisota", "halonen", "largest"):
                for date in ("2006-12-31 23:59:59", "2019-12-31 23:59:59", "now"):
                    first = index.get((names[0], statement, page, date))
                    if not first:
                        continue
                    line = [page, date[:10], first["rows"]]
                    for label in names:
                        record = index[(label, statement, page, date)]
                        line.append(f"{spread(record)} / {record['handler_reads']}")
                    lines.append(line)
            table(["article", "as of", "rows returned"] + [f"{label} ms / reads" for label in names], lines)

        print("### wording, search, global\n")
        lines = []
        for record in layouts:
            if record["statement"] in ("wording", "search", "global") and record["layout"] == names[0]:
                line = [record["statement"], record["page"] or "", record["as_of"][:10], record["rows"]]
                for label in names:
                    other = index[(label, record["statement"], record["page"], record["as_of"])]
                    line.append(f"{spread(other)} / {other['handler_reads']}")
                lines.append(line)
        table(["statement", "article", "as of", "rows returned"] + [f"{label} ms / reads" for label in names], lines)

        # ---- rows read per row returned
        rows = []
        for record in layouts:
            if record["statement"] == "blocks" and record["layout"] in ("flat", "hc", "year"):
                rows.append({
                    "layout": record["layout"], "page": record["page"],
                    "page_rows_all": record["page_rows_all"], "as_of": record["as_of"],
                    "rows_returned": record["rows"], "handler_reads": record["handler_reads"],
                    "reads_per_row": round(record["handler_reads"] / record["rows"], 2) if record["rows"] else None,
                    "partitions_read": partitions_read(record),
                })
        save("rows-read.json",
             "Rows MariaDB reads for each row of an article it returns",
             "handler reads (sum of Handler_read_* for one run) and their ratio to rows returned",
             rows)

    # ---- indexes
    if indexes or globals_:
        save("indexes.json",
             "The same statements with a secondary index on the period columns",
             "milliseconds (median of 7), handler reads for one run",
             [slim(record, page_rows_all=record["page_rows_all"]) for record in indexes + globals_],
             note="flat has the product's indexes. idx adds pe (page_id, row_end), ps (page_id, row_start), "
                  "se (row_start, row_end), es (row_end, row_start) and lets the optimizer choose; "
                  "idx_pe, idx_ps, idx_se and idx_es force one of them.")
        index = by(indexes, "layout", "statement", "page", "as_of")
        names = []
        for record in indexes:
            if record["layout"] not in names:
                names.append(record["layout"])
        print("### indexes on the period columns: blocks\n")
        lines = []
        for page in ("typical", "p99", "talvisota", "halonen", "largest"):
            for date in ("2006-12-31 23:59:59", "2012-12-31 23:59:59", "2019-12-31 23:59:59",
                         "2026-09-30 23:59:59", "now"):
                if (names[0], "blocks", page, date) not in index:
                    continue
                first = index[(names[0], "blocks", page, date)]
                line = [page, date[:10], first["rows"]]
                for label in names:
                    record = index[(label, "blocks", page, date)]
                    key = slim(record)["key"]
                    checked = record["handler_reads"] + record.get("icp_attempts", 0)
                    line.append(f"{spread(record)} / {checked}" + (f" `{key}`" if label == "idx" else ""))
                lines.append(line)
        table(["article", "as of", "rows returned"] + [f"{label} ms / rows + index entries" for label in names], lines)

        index = by(globals_, "layout", "statement", "page", "as_of")
        names = []
        for record in globals_:
            if record["layout"] not in names:
                names.append(record["layout"])
        if names:
            print("### indexes on the period columns: the global count\n")
            lines = []
            for date in ("2006-12-31 23:59:59", "2010-12-31 23:59:59", "2019-12-31 23:59:59", "now"):
                if (names[0], "global", None, date) not in index:
                    continue
                first = index[(names[0], "global", None, date)]
                line = [date[:10], first["rows"]]
                for label in names:
                    record = index[(label, "global", None, date)]
                    line.append(f"{spread(record)} / {record['handler_reads']} `{slim(record)['key']}`")
                lines.append(line)
            table(["as of", "rows"] + [f"{label} ms / reads / key" for label in names], lines)

    # ---- two partitions plus the two indexes
    combined = raw("combined") + raw("combined-other")
    if combined:
        save("combined.json",
             "Two partitions (history, current) plus KEY (page_id, row_start) and KEY (page_id, row_end, row_start)",
             "milliseconds (median of 7), handler reads and pushed-down index checks for one run",
             [slim(record, page_rows_all=record["page_rows_all"]) for record in combined],
             note="core is wtt.passage measured in the same run. hc_auto lets the optimizer choose; "
                  "hc_per and hc_ps force one index.")
        index = by(combined, "layout", "statement", "page", "as_of")
        print("### two partitions plus two indexes\n")
        lines = []
        for statement in ("blocks", "diff"):
            for page in ("typical", "talvisota", "halonen", "largest"):
                for date in ("2006-12-31 23:59:59", "2019-12-31 23:59:59", "now"):
                    if ("core", statement, page, date) not in index:
                        continue
                    line = [statement, page, date[:10], index[("core", statement, page, date)]["rows"]]
                    for label in ("core", "hc_auto", "hc_ps", "hc_per"):
                        record = index[(label, statement, page, date)]
                        checked = record["handler_reads"] + record.get("icp_attempts", 0)
                        line.append(f"{spread(record)} / {checked:,}" + (f" `{slim(record)['key']}`" if label == "hc_auto" else ""))
                    lines.append(line)
        table(["statement", "article", "as of", "rows returned", "core ms / rows + entries",
               "two partitions, optimizer's choice", "forced `ps`", "forced `per`"], lines)

    # ---- sizes and load times
    build = RAW / "build.jsonl"
    if build.exists():
        steps = [json.loads(line) for line in build.read_text().splitlines()]
        rows = []
        for step in steps:
            if step["step"] in ("load", "grow") and step.get("sizes"):
                size = step["sizes"][0]
                rows.append({
                    "table": step["table"], "copy": step["copy"], "rows_inserted": step["rows"],
                    "load_seconds": step["seconds"],
                    "rows_per_second": round(step["rows"] / step["seconds"]),
                    "data_bytes": size["data_bytes"], "index_bytes": size["index_bytes"],
                    "file_bytes": size["file_bytes"], "files": size["files"],
                })
        save("sizes.json",
             "Load time and size of each copy of passage",
             "seconds to insert with system_versioning_insert_history, bytes from information_schema",
             rows,
             note="copy 0 is the real table; copies 1 to 3 repeat it under shifted page ids. "
                  "Sizes are read right after each load, so a row of copy n holds the table with n + 1 copies.")
        print("### load time and size\n")
        table(["table", "copy", "rows inserted", "seconds", "rows/s", "data MiB", "index MiB", "files MiB", "files"],
              [[r["table"], r["copy"], f"{r['rows_inserted']:,}", r["load_seconds"], f"{r['rows_per_second']:,}",
                round(r["data_bytes"] / 2**20), round(r["index_bytes"] / 2**20),
                round(r["file_bytes"] / 2**20), r["files"]] for r in rows])

    # ---- growth
    if any(growth.values()):
        rows = []
        for scale, records in growth.items():
            for record in records:
                rows.append(slim(record, scale=scale, table_rows=2972662 * scale))
        save("growth.json",
             "The hot statements as the table grows to two and four times its rows",
             "milliseconds (median of 7), handler reads for one run",
             rows,
             note="One table, p_idx, grown by repeating the real rows under shifted page ids. "
                  "The statements ask for the same original articles at every size.")
        print("### growth\n")
        labels = []
        for records in growth.values():
            for record in records:
                if record["layout"] not in labels:
                    labels.append(record["layout"])
        seen = []
        for records in growth.values():
            for record in records:
                case = (record["statement"], record["page"], record["as_of"])
                if case not in seen:
                    seen.append(case)
        indexed = {scale: by(records, "layout", "statement", "page", "as_of") for scale, records in growth.items()}
        lines = []
        shown = [(statement, page, date) for statement, page, date in seen
                 if (statement in ("blocks", "diff") and page in ("typical", "talvisota", "halonen", "largest")
                     and date[:4] in ("2006", "now"))
                 or (statement == "wording" and page in ("talvisota", "halonen"))
                 or (statement == "search" and date[:4] in ("2006", "now"))
                 or statement == "global"]
        for statement, page, date in shown:
            for label in labels:
                cells = []
                for scale in (1, 2, 4):
                    record = indexed[scale].get((label, statement, page, date))
                    cells.append(f"{spread(record)} / {record['handler_reads'] + record.get('icp_attempts', 0)}" if record else "")
                if any(cells):
                    lines.append([statement, page or "", date[:10], label] + cells)
        table(["statement", "article", "as of", "plan", "1x ms / rows + index entries", "2x", "4x"], lines)


if __name__ == "__main__":
    main()
