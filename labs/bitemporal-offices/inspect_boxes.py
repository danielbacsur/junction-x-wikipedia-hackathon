"""Exploration: what the parser makes of every distinct infobox in the cache. uv run inspect_boxes.py"""
import json, collections
from pathlib import Path
from parse import parse_box, office_of, normalize
d = json.loads((Path(__file__).parent / "cache/infobox.json").read_text())
tpl = collections.Counter(); unp = collections.Counter(); offices = collections.Counter(); other = collections.Counter()
norm_terms = collections.Counter()
for h, b in d["boxes"].items():
    tpl[b["template"]] += 1
    claims, unparsed, oth = parse_box(b["fields"])
    for c in claims: offices[c[0]] += 1
    for u in unparsed: unp[u] += 1
    for o in oth: other[o] += 1
    for k, v in b["fields"].items():
        if k.startswith("arvo") and office_of(v) == "Suomen tasavallan presidentti":
            norm_terms[normalize(b["fields"].get("virassa" + k[4:], ""))[:120]] += 1
print(tpl); print(offices)
print("UNPARSED", len(unp))
for u, n in unp.most_common(60): print(n, u)
print("OTHER OFFICES", len(other))
for o, n in other.most_common(25): print(n, o)
print("PRESIDENT TERM FIELDS (normalized)", len(norm_terms))
for t, n in norm_terms.most_common(80): print(n, repr(t))
