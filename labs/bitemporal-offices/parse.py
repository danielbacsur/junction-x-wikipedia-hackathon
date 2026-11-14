"""Deterministic parser: an infobox office field -> stated terms. Anything it cannot read is returned as unparsed.

Finnish Wikipedia's {{Hallitsija}} (2006) and {{Valtionjohto}} (2007 on) pair `arvo`/`arvoN` (the office)
with `virassa`/`virassaN` (the term). The term was written in four ways over the years:
    [[1. maaliskuuta|1.3.]] [[1956]]–[[27. tammikuuta|27.1.]] [[1982]]     piped date links
    [[1. maaliskuuta]] [[1956]] – [[27. tammikuuta]] [[1982]]              plain date links
    1.3.1956–27.1.1982  /  1.3.1956 – 27.1.1982                            plain numbers
    1.3.2012 –  /  1.3.2012 alkaen                                         still in office
"""
import datetime, re

MONTHS = {m: i + 1 for i, m in enumerate(
    ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu",
     "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"])}
OPEN_END = datetime.date(9999, 12, 31)   # PERIOD columns cannot be NULL: "still in office" is stored as this day

ACTING = " (vt.)"                        # acting holder, as the infobox remark "(vt. presidentti ...)" states it
PRESIDENT, PRIME_MINISTER, REGENT = "Suomen tasavallan presidentti", "Suomen pääministeri", "Suomen valtionhoitaja"

_MONTH_NAME = re.compile(r"(\d{1,2})\.\s*(" + "|".join(MONTHS) + r")(?:ta|n)?\b\s*", re.I)
_DATE = r"(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})"
_DASH = r"\s*(?:–|—|−|‐|‒|-)+\s*"
_RANGE = re.compile(_DATE + r"(?:" + _DASH + r"(?:" + _DATE + r")?|\s+(?:alkaen|lähtien)\b)"
                    r"|(?<![\d.])(?P<d0>\d{1,2})\.\s*(?P<m0>\d{1,2})\." + _DASH +
                    r"(?P<d1>\d{1,2})\.\s*(?P<m1>\d{1,2})\.\s*(?P<y1>\d{4})")
_YEAR_RANGE = re.compile(r"(?<![\d.])(\d{4})" + _DASH + r"(\d{4})?(?![\d.])")

def strip_links(s):
    s = re.sub(r"\[\[(?:[^\[\]|]*\|)?([^\[\]|]*)\]\]", r"\1", s)
    return s

def normalize(value):
    """Wikitext of one field -> plain text with dates as D.M.YYYY. Purely textual, no interpretation."""
    s = re.sub(r"<!--.*?-->", " ", value, flags=re.S)
    s = re.sub(r"<ref[^>]*/>", " ", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", " ", s, flags=re.S)
    s = re.sub(r"<ref[^>]*>.*", " ", s, flags=re.S)          # an unclosed ref swallows the rest of the field
    s = s.replace("&nbsp;", " ").replace("&ndash;", "–").replace("&mdash;", "–").replace(" ", " ")
    s = strip_links(s)                                        # the label is what the reader saw
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\{\{|\}\}|\|", "\n", s)
    s = s.replace("'''", "").replace("''", "")
    s = _MONTH_NAME.sub(lambda m: f"{m.group(1)}.{MONTHS[m.group(2).lower()]}.", s)
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()

def office_of(arvo):
    """The three offices this lab loads; every other title returns None and is only counted."""
    t = strip_links(re.sub(r"<[^>]+>", " ", arvo)).lower()
    t = re.sub(r"\s+", " ", t)
    if re.search(r"\b(suomen|tasavallan)\s+(\d+\.\s*)?presidentti\b", t) and "oikeuden" not in t:
        return PRESIDENT          # also "Suomen valtionhoitaja<br>Suomen 6. presidentti": the main range is the presidency
    if "valtionhoitaja" in t:
        return REGENT
    if re.search(r"(?<![a-zåäö])pääministeri\b", t):
        return PRIME_MINISTER
    return None

def _date(d, m, y):
    try:
        return datetime.date(int(y), int(m), int(d))
    except ValueError:
        return None

def _paren_spans(text):
    return [(m.start(), m.end(), m.group(0)) for m in re.finditer(r"\([^()]*\)", text)]

def parse_terms(value):
    """-> (terms, unparsed): terms = [(valid_from, valid_to, open_ended, remark)], unparsed = [(text, reason)].
    The words in front of a range can say what it is: "vt." (acting holder) or "valtionhoitajana" (as regent).
    A range inside a parenthesis that says neither is a remark and is returned as unparsed."""
    text = normalize(value)
    terms, unparsed = [], []
    if not text:
        return terms, unparsed
    spans = _paren_spans(text)
    rest, last_end = text, 0
    for m in _RANGE.finditer(text):
        seg = m.group(0).strip()
        rest = rest.replace(seg, " ", 1)
        label = text[last_end:m.start()].lower()               # the words written in front of this range
        last_end = m.end()
        inside = [sp for sp in spans if sp[0] <= m.start() < sp[1]]
        remark = "regent" if "valtionhoitaja" in label else "acting" if re.search(r"\bvt\b", label) else None
        if inside and remark is None:
            unparsed.append((inside[0][2], "range inside a remark"))
            continue
        if m.group("d0"):                                      # "27.5. – 12.12.1918": the start borrows the end's year
            end, open_ended = _date(*m.group("d1", "m1", "y1")), False
            start = _date(m.group("d0"), m.group("m0"), m.group("y1"))
        elif m.group(4):
            start = _date(*m.group(1, 2, 3))
            end, open_ended = _date(*m.group(4, 5, 6)), False
        else:
            start = _date(*m.group(1, 2, 3))
            tail = re.sub(r"\([^()]*\)", " ", text[m.end():].split("\n", 1)[0])
            if re.search(r"\d", tail):                        # "1.3.1956 – tammikuu 1982": an end we cannot read
                unparsed.append(((seg + tail).strip(), "end date not understood"))
                continue
            end, open_ended = OPEN_END, True
        if start is None or end is None:
            unparsed.append((seg, "not a calendar date"))
        elif not (1800 <= start.year <= 2100) or (not open_ended and not (1800 <= end.year <= 2100)):
            unparsed.append((seg, "year out of range"))
        elif start >= end:
            unparsed.append((seg, "end not after start"))
        elif (start, end, open_ended, remark) not in terms:
            terms.append((start, end, open_ended, remark))
    for m in _YEAR_RANGE.finditer(re.sub(r"\([^()]*\)", " ", rest)):
        unparsed.append((m.group(0).strip(), "years only, no day"))
    if not terms and not unparsed and re.search(r"\d", text):
        unparsed.append((text[:200], "no date range found"))
    return terms, unparsed

def parse_box(fields):
    """One infobox -> (claims, unparsed, other_offices).
    claims = {(office, valid_from, valid_to, open_ended): source_text}; unparsed = {(office, text, reason)}."""
    claims, unparsed, other = {}, set(), set()
    for key, arvo in fields.items():
        if not key.startswith("arvo"):
            continue
        term_field = fields.get("virassa" + key[4:], "")
        office = office_of(arvo)
        if office is None:
            if arvo.strip():
                other.add(re.sub(r"\s+", " ", strip_links(arvo))[:80])
            continue
        terms, bad = parse_terms(term_field)
        for start, end, open_ended, remark in terms:
            stated = REGENT if remark == "regent" else office + ACTING if remark == "acting" else office
            claims.setdefault((stated, start, end, open_ended), term_field.strip()[:600])
        for text, reason in bad:
            unparsed.add((office, text[:200], reason))
        if not terms and not bad:
            unparsed.add((office, term_field.strip()[:200], "term field empty"))
    return claims, unparsed, other
