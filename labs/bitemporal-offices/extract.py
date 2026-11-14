# /// script
# dependencies = ["pymysql"]
# ///
"""Step 1. Read every saved version of the president articles once and keep only the office infobox.

Reads wtt.revision (FOR SYSTEM_TIME ALL) and wtt.edit, one page at a time on one connection,
and writes cache/infobox.json: per page the list of versions (edit metadata + a pointer to the
infobox fields), with identical infoboxes stored once. Nothing is written to the database.

    uv run extract.py
"""
import hashlib, json, re, time
from pathlib import Path
import pymysql
from wikitext import top_templates, split_params

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "cache"; CACHE.mkdir(exist_ok=True)

# The thirteen presidents of Finland, by page id in wtt.revision (titles are read from the table).
PAGES = [7650, 11443, 11444, 11445, 11398, 6021, 11446, 1275, 752, 5901, 1187, 1137, 11396]
OFFICE_FIELD = re.compile(r"\|\s*virassa\d*\s*=")
KEEP = re.compile(r"^(arvo|virassa|edeltäjä|seuraaja)\d*$")

def main():
    c = pymysql.connect(host="127.0.0.1", port=3310, user="wtt", password="wtt", database="wtt")
    boxes, pages, t0 = {}, {}, time.perf_counter()
    for pid in PAGES:
        with c.cursor(pymysql.cursors.DictCursor) as cur:
            cur.execute("SELECT title FROM revision WHERE page_id=%s", (pid,))
            title = cur.fetchone()["title"]
            cur.execute("SELECT seq, rev_id, saved_at, ended_at, user, editor, comment, bytes, restores, undone_by "
                        "FROM edit WHERE page_id=%s ORDER BY seq", (pid,))
            meta = {r["rev_id"]: r for r in cur.fetchall()}
        versions, t1, nbytes = [], time.perf_counter(), 0
        with c.cursor(pymysql.cursors.SSCursor) as cur:
            cur.execute("SELECT rev_id, row_start, row_end, text FROM revision FOR SYSTEM_TIME ALL "
                        "WHERE page_id=%s ORDER BY row_start", (pid,))
            for rev_id, row_start, row_end, text in cur:
                nbytes += len(text)
                m = meta[rev_id]
                found = [(n, b) for n, b in top_templates(text) if OFFICE_FIELD.search(b)]
                box = None
                if found:
                    name, body = found[0]
                    fields = {k: v for k, v in split_params(body).items() if KEEP.match(k)}
                    blob = json.dumps([name, fields], ensure_ascii=False, sort_keys=True)
                    box = hashlib.sha1(blob.encode()).hexdigest()[:16]
                    boxes.setdefault(box, {"template": name, "fields": fields})
                versions.append({
                    "seq": m["seq"], "rev_id": rev_id,
                    "saved_at": row_start.strftime("%Y-%m-%d %H:%M:%S.%f"),
                    "ended_at": None if row_end.year > 2037 else row_end.strftime("%Y-%m-%d %H:%M:%S.%f"),
                    "edit_saved_at": m["saved_at"].strftime("%Y-%m-%d %H:%M:%S.%f"),
                    "user": m["user"], "editor": m["editor"], "comment": m["comment"], "bytes": m["bytes"],
                    "restores": m["restores"], "undone_by": m["undone_by"],
                    "box": box, "boxes_in_text": len(found),
                })
        versions.sort(key=lambda v: v["seq"])
        pages[pid] = {"title": title, "versions": versions}
        print(f"{pid:>7} {title:<32} versions={len(versions):>5} text={nbytes/1e6:7.1f} MB "
              f"with_box={sum(v['box'] is not None for v in versions):>5} {time.perf_counter()-t1:6.1f}s", flush=True)
    out = {"read_seconds": round(time.perf_counter() - t0, 1), "pages": pages, "boxes": boxes}
    (CACHE / "infobox.json").write_text(json.dumps(out, ensure_ascii=False))
    print("versions", sum(len(p["versions"]) for p in pages.values()), "distinct infoboxes", len(boxes),
          "seconds", out["read_seconds"])

if __name__ == "__main__":
    main()
