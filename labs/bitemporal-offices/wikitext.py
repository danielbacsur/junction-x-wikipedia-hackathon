"""Small deterministic wikitext helpers: top-level templates and their parameters. No guessing."""
import re

_BRACES = re.compile(r"\{\{|\}\}")

def top_templates(text):
    """Return (name, body) for every top-level {{...}} template, by brace matching."""
    out, depth, start = [], 0, -1
    for m in _BRACES.finditer(text):
        if m.group() == "{{":
            if depth == 0:
                start = m.start()
            depth += 1
        elif depth > 0:
            depth -= 1
            if depth == 0:
                inner = text[start + 2:m.start()]
                name = re.split(r"[|\n]", inner, maxsplit=1)[0].strip()
                out.append((name[:1].upper() + name[1:], inner))
    return out

def split_params(inner):
    """Split a template body on top-level pipes; return {name: value} for named parameters."""
    parts, depth_t, depth_l, cur, i = [], 0, 0, [], 0
    while i < len(inner):
        two = inner[i:i + 2]
        if two == "{{": depth_t += 1; cur.append(two); i += 2; continue
        if two == "}}": depth_t -= 1; cur.append(two); i += 2; continue
        if two == "[[": depth_l += 1; cur.append(two); i += 2; continue
        if two == "]]": depth_l -= 1; cur.append(two); i += 2; continue
        ch = inner[i]
        if ch == "|" and depth_t <= 0 and depth_l <= 0:
            parts.append("".join(cur)); cur = []
        else:
            cur.append(ch)
        i += 1
    parts.append("".join(cur))
    params = {}
    for p in parts[1:]:
        if "=" in p:
            k, v = p.split("=", 1)
            k = k.strip().lower()
            if k and k not in params:
                params[k] = v.strip()
    return params
