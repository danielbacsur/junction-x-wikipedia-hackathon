"""Dates, lifespans and quantities from the opening of an article, in Finnish,
Swedish and English. No language understanding: month names, a few markers
("s.", "född", "born") and the shape of numbers."""
import datetime as D, re

MONTHS = {
    'fi': 'tammi helmi maalis huhti touko kesä heinä elo syys loka marras joulu'.split(),
    'sv': 'januari februari mars april maj juni juli augusti september oktober november december'.split(),
    'en': 'January February March April May June July August September October November December'.split(),
}
FI_M = '(' + '|'.join(m + 'kuu' for m in MONTHS['fi']) + ')(?:ta|ssa|n|hun)?'
SV_M = '(' + '|'.join(MONTHS['sv']) + ')'
EN_M = '(' + '|'.join(MONTHS['en']) + ')'
YEAR = r'(\d{3,4})(?![\d])(?!\s*[-–]\s*(?:luv|tal))(?!s\b)(?!\s*(?:eaa|eKr|f\.\s*Kr|BC\b|BCE\b))'
# Each pattern: (regex, order of the groups as day, month, year; None when absent)
PATTERNS = {
    'fi': [
        (re.compile(r'(?<![\d.])(\d{1,2})\.\s*' + FI_M + r'\s+' + YEAR, re.I), (1, 2, 3)),
        (re.compile(r'(?<![\d.])(\d{1,2})\.\s?(\d{1,2})\.\s?' + YEAR), (1, 2, 3)),
        (re.compile(r'(?<![\d.]\s)(?<!\d\.)\b' + FI_M + r'\s+' + YEAR, re.I), (None, 1, 2)),
    ],
    'sv': [
        (re.compile(r'(?<![\d.])(\d{1,2})(?::[ae])?\s+' + SV_M + r'\s+' + YEAR, re.I), (1, 2, 3)),
        (re.compile(r'(?<!\d\s)\b' + SV_M + r'\s+' + YEAR, re.I), (None, 1, 2)),
    ],
    'en': [
        (re.compile(r'(?<![\d.])(\d{1,2})(?:st|nd|rd|th)?\s+' + EN_M + r',?\s+' + YEAR), (1, 2, 3)),
        (re.compile(r'\b' + EN_M + r'\s+(\d{1,2})(?:st|nd|rd|th)?,\s*' + YEAR), (2, 1, 3)),
        (re.compile(r'\b' + EN_M + r'\s+(\d{1,2})(?:st|nd|rd|th)?\s+' + YEAR), (2, 1, 3)),
        (re.compile(r'(?<!\d\s)\b' + EN_M + r',?\s+' + YEAR), (None, 1, 2)),
    ],
}
BARE_YEAR = re.compile(r'(?<![\d.,:/])(?<!\d[  ])' + YEAR + r'(?![.,]\d)(?![  ]\d{3}\b)')
APPROX = re.compile(r"(?:\bnoin|\bn\.|\bc\.|\bca\.?|\bcirca|\bomkring|\bomkr\.?|\babout|\baround|\btroligen|\bprobably|"
                    r"\bluultavasti|\btodennäköisesti|\barviolta|\bmahdollisesti|\bpossibly|\bmöjligen|\beller|\bor|\btai|"
                    r"\bviimeistään|\bsenast|\bbefore|\bafter|\bennen|\bjälkeen|\bföre|\befter|\bfl\.|~|\?)\s*$", re.I)
OLD_STYLE = re.compile(r'O\.\s?S\.|N\.\s?S\.|\bJ:|\bjul\.|juliaani|julian|vanhaa lukua|vanhan luvun|\bg\.\s?s\.|\bn\.\s?s\.|gamla stilen|Old Style', re.I)
HATNOTE = re.compile(r'^(?:För andra betydelser|Den här artikeln|Denna artikel handlar|Ej att förväxla|Inte att förväxla|Uppslagsordet|'
                     r'This article is about|For other uses|For the |For other |Not to be confused|"[^"]+" redirects|Tämä artikkeli|'
                     r'Hakusana|Tämä on artikkeli|See also|Main article|Se även|Katso myös|För\s.{0,120},\s*se\s|For\s.{0,120},\s*see\s)', re.I)

def month_number(lang, name):
    name = name.lower()
    for i, m in enumerate(MONTHS[lang]):
        if name.startswith(m.lower()):
            return i + 1
    raise ValueError(name)

def valid(y, m, d):
    if not 1 <= y <= 2030:
        return False
    if m is None:
        return True
    if d is None:
        return 1 <= m <= 12
    try:
        D.date(max(y, 1), m, d)
        return True
    except ValueError:
        return False

def dates(lang, text, three_digit_years=False):
    """Date tokens in reading order: dicts with s, e, y, m, d, approx, text.
    A full date wins over a month and year, which wins over a bare year."""
    taken, out = [], []
    def free(a, b):
        return all(b <= s or a >= e for s, e in taken)
    for rx, (gd, gm, gy) in PATTERNS[lang]:
        for mt in rx.finditer(text):
            if not free(mt.start(), mt.end()):
                continue
            y = int(mt.group(gy)); raw_m = mt.group(gm)
            m = int(raw_m) if raw_m.isdigit() else month_number(lang, raw_m)
            d = int(mt.group(gd)) if gd else None
            if len(mt.group(gy)) == 3 and not three_digit_years:
                continue
            if not valid(y, m, d):
                continue
            taken.append((mt.start(), mt.end()))
            out.append(dict(s=mt.start(), e=mt.end(), y=y, m=m, d=d, text=mt.group()))
    for mt in BARE_YEAR.finditer(text):
        if not free(mt.start(), mt.end()):
            continue
        y = int(mt.group(1))
        if len(mt.group(1)) == 3 and not three_digit_years:
            continue
        if not (three_digit_years and 100 <= y or 1000 <= y) or y > 2030:
            continue
        taken.append((mt.start(), mt.end()))
        out.append(dict(s=mt.start(), e=mt.end(), y=y, m=None, d=None, text=mt.group()))
    out.sort(key=lambda t: t['s'])
    for t in out:
        t['approx'] = bool(APPROX.search(text[max(0, t['s'] - 16):t['s']]))
    return out

def lead_paragraphs(text):
    """Paragraphs between the title line and the first section heading."""
    out = []
    for i, line in enumerate(text.split('\n')):
        line = line.strip()
        if i == 0 and line.startswith('# '):
            continue
        if line.startswith('## '):
            break
        if not line or line.startswith('#') or HATNOTE.match(line):
            continue
        out.append(line)
    return out

def opening(text):
    """The first real paragraph of the lead (at least 40 characters), or ''."""
    for p in lead_paragraphs(text):
        if len(p) >= 40:
            return p
    return ''

def strip_nested(text):
    """Blank out square brackets and parentheses nested inside parentheses,
    keeping every character position: '4 June [O.S. 23 May] 1867' reads as one date."""
    out, depth, square = [], 0, 0
    for ch in text:
        if ch == '[':
            square += 1; out.append(' '); continue
        if ch == ']':
            square = max(0, square - 1); out.append(' '); continue
        if ch == '(':
            depth += 1
            out.append('(' if depth == 1 and not square else ' '); continue
        if ch == ')':
            out.append(')' if depth == 1 and not square else ' ')
            depth = max(0, depth - 1); continue
        out.append(' ' if square or depth >= 2 else ch)
    return ''.join(out)

BETWEEN = {l: re.compile(r'(?<=' + ('kuuta' if l == 'fi' else '[a-z]') + r')\s*\([^()]{0,90}\)(?=\s*\d{3,4}\b)') for l in MONTHS}
ABBR = r'\s*(?=(?:noin\s+|n\.\s*|c\.\s*|ca\.?\s*|omkr\.?\s*|omkring\s+|circa\s+)?\d)'
BIRTH = {'fi': r'(?<![.\w])s\.' + ABBR + r'|\bsyntynyt\b|\bsyntyi\b',
         'sv': r'\bfödd\b|\bföddes\b|(?<![.\w])f\.' + ABBR,
         'en': r'\bborn\b|(?<![.\w])[bs]\.' + ABBR}
DEATH = {'fi': r'(?<![.\w])k\.' + ABBR + r'|\bkuollut\b|\bkuoli\b',
         'sv': r'\bdöd\b|\bavled\b|\bavliden\b|\bdog\b|(?<![.\w])d\.' + ABBR,
         'en': r'\bdied\b|(?<![.\w])d\.' + ABBR}
DASH = re.compile(r'[–—−]|\s-\s|^\s*-\s*$|\bto\b|\btill\b')
SENTENCE_END = re.compile(r'[.!?]\s+[A-ZÅÄÖ]')

def lifespan(lang, text):
    """Birth and death as stated at the start of a paragraph.
    Returns dict(birth=token|None, death=token|None, how=..., old_style=bool) or None.
    Two readings are tried and the one that starts first in the text wins:
    the first parentheses that hold a date ("(4 June 1867 – 27 January 1951)", "(s. 1948)"),
    and markers in running text ("född 4 juni 1867 ..., död 27 januari 1951")."""
    head = text[:420]
    # "30 oktober (18 oktober enligt julianska kalendern) 1848": read through the aside.
    flat = BETWEEN[lang].sub(lambda m: ' ' * len(m.group()), head)
    flat = strip_nested(flat)
    toks = dates(lang, flat, three_digit_years=True)
    if not toks:
        return None
    either = BIRTH[lang] + '|' + DEATH[lang]
    def after_marker(rx, a, b):
        for mt in re.finditer(rx, flat[:b], re.I):
            if mt.start() < a:
                continue
            for t in toks:
                if t['s'] >= mt.end() and t['e'] <= b and t['s'] - mt.end() <= 45:
                    gap = flat[mt.end():t['s']]
                    if SENTENCE_END.search(gap) or re.search(either, gap, re.I) or ')' in gap or '(' in gap:
                        break
                    return t
        return None
    readings = []
    for mt in re.finditer(r'\(([^()]*)\)', flat):
        a, b = mt.start(1), mt.end(1)
        if a > 260:
            break
        inside = [t for t in toks if a <= t['s'] and t['e'] <= b]
        if not inside:
            continue
        birth, death = after_marker(BIRTH[lang], a, b), after_marker(DEATH[lang], a, b)
        if birth or death:
            readings.append((birth, death, 'marker in parentheses'))
            break
        pairs = [(t1, t2) for t1, t2 in zip(inside, inside[1:])
                 if DASH.search(flat[t1['e']:t2['s']]) and 5 <= t2['y'] - t1['y'] <= 125]
        if pairs:
            # "(1945–1950 Kuusinen-Leino, 14. helmikuuta 1904 Luhanka – 18. maaliskuuta 1974 Moskova)":
            # a pair with a full date is the lifespan, a pair of bare years before it is a name in use.
            birth, death = next((p for p in pairs if p[0]['d'] or p[1]['d']), pairs[0])
            readings.append((birth, death, 'dash in parentheses'))
            break
    birth, death = after_marker(BIRTH[lang], 0, 300), after_marker(DEATH[lang], 0, 300)
    if birth or death:
        readings.append((birth, death, 'marker in text'))
    if not readings:
        return None
    birth, death, how = min(readings, key=lambda r: min(t['s'] for t in r[:2] if t))
    if birth and death and (death is birth or not 5 <= death['y'] - birth['y'] <= 125):
        death = None
    return dict(birth=birth, death=death, how=how, old_style=bool(OLD_STYLE.search(head)))

# Quantities -----------------------------------------------------------------
NUMBER = {
    'fi': re.compile(r'(?<![\d.,])(\d{1,3}(?:[   .]\d{3})+|\d+)(?:,(\d+))?(?![\d])'),
    'sv': re.compile(r'(?<![\d.,])(\d{1,3}(?:[   .]\d{3})+|\d+)(?:,(\d+))?(?![\d])'),
    'en': re.compile(r'(?<![\d.,])(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?![\d])'),
}
SCALE = re.compile(r'^[  ]?(miljoonaa?|milj\.|miljon(?:er)?|million|mn\b|miljardia?|miljard(?:er)?|billion)', re.I)

def quantities(lang, text):
    """Numbers of 100 or more that are not part of a date and do not look like a year.
    Returns dicts with value, text, s, e."""
    spans = [(t['s'], t['e']) for t in dates(lang, text)]
    out = []
    for mt in NUMBER[lang].finditer(text):
        if any(mt.start() < e and mt.end() > s for s, e in spans):
            continue
        whole = re.sub(r'\D', '', mt.group(1))
        value = float(whole + ('.' + mt.group(2) if mt.group(2) else ''))
        sc = SCALE.match(text[mt.end():mt.end() + 12])
        if sc:
            value *= 1e9 if sc.group(1).lower().startswith(('miljard', 'billion')) else 1e6
        if value < 100:
            continue
        grouped = len(mt.group(1)) != len(whole)
        if not grouped and not sc and not mt.group(2) and 1000 <= value <= 2030:
            continue  # year-shaped
        out.append(dict(value=value, text=mt.group() + (sc.group() if sc else ''), s=mt.start(), e=mt.end()))
    return out

# Date ranges that state the year once: "25. kesäkuuta – 9. heinäkuuta 1944",
# "25 juni-9 juli 1944", "June 25 to July 9, 1944", "15 and 29 January 2006".
JOIN = r'\s*(?:[–—−-]|ja|tai|och|eller|till|and|or|to)\s*$'
BEFORE = {
    'fi': re.compile(r'(?<![\d.])(\d{1,2})\.\s*(?:' + FI_M + r')?' + JOIN, re.I),
    'sv': re.compile(r'(?<![\d.])(\d{1,2})(?::[ae])?\s*(?:' + SV_M + r')?' + JOIN, re.I),
    'en': re.compile(r'(?<![\d.])(\d{1,2})(?:st|nd|rd|th)?\s*(?:' + EN_M + r')?' + JOIN + r'|\b' + EN_M + r'\s+(\d{1,2})(?:st|nd|rd|th)?' + JOIN),
}

def full_dates(lang, text):
    """Every full date in the text as (ordinal day, shown text), ranges with one year included."""
    out = {}
    for t in dates(lang, text):
        if t['d'] is None or t['y'] < 1000:
            continue
        out.setdefault(D.date(t['y'], t['m'], t['d']).toordinal(), t['text'])
        mt = BEFORE[lang].search(text[max(0, t['s'] - 30):t['s']])
        if mt:
            g = mt.groups()
            if lang == 'en' and g[2]:
                day, mon = int(g[3]), month_number(lang, g[2])
            else:
                day, mon = int(g[0]), month_number(lang, g[1]) if g[1] else t['m']
            y = t['y'] - 1 if mon > t['m'] else t['y']
            if valid(y, mon, day):
                out.setdefault(D.date(y, mon, day).toordinal(), mt.group().strip() + ' … ' + str(t['y']))
    return sorted(out.items())

def iso(t):
    if t is None:
        return None
    return f"{t['y']:04d}" + (f"-{t['m']:02d}" if t['m'] else '') + (f"-{t['d']:02d}" if t['d'] else '')

if __name__ == '__main__':
    tests = [
        ('fi', 'Carl Gustaf Emil Mannerheim (4. kesäkuuta 1867 Askainen – 27. tammikuuta 1951 Lausanne, Sveitsi) oli vapaaherra', ('1867-06-04', '1951-01-27')),
        ('en', 'Baron Carl Gustaf Emil Mannerheim (Finland Swedish: [kɑːrl] ⓘ, 4 June 1867 – 27 January 1951) was a Finnish', ('1867-06-04', '1951-01-27')),
        ('sv', 'Carl Gustaf Emil Mannerheim ([kɑːɭ]), född 4 juni 1867 på Villnäs slott i Egentliga Finland, död 27 januari 1951 i Lausanne', ('1867-06-04', '1951-01-27')),
        ('en', 'Kaarlo Juho Ståhlberg (January 28, 1865 – September 22, 1952) was', ('1865-01-28', '1952-09-22')),
        ('fi', 'Sauli Väinämö Niinistö (s. 24. elokuuta 1948 Salo) on suomalainen', ('1948-08-24', None)),
        ('en', 'Vladimir Lenin (22 April [O.S. 10 April] 1870 – 21 January 1924) was', ('1870-04-22', '1924-01-21')),
        ('fi', 'Nikolai II (18. toukokuuta (J: 6. toukokuuta) 1868 Tsarskoje Selo – 17. heinäkuuta 1918 Jekaterinburg) oli', ('1868-05-18', '1918-07-17')),
        ('sv', 'Mikael Agricola, född omkring 1510 i Pernå, död 9 april 1557 i Nykyrka, var', ('1510', '1557-04-09')),
        ('fi', 'Birger-jaarli (n. 1210 – 21. lokakuuta 1266) oli', ('1210', '1266-10-21')),
        ('en', 'Tarja Halonen (born 24 December 1943) is', ('1943-12-24', None)),
        ('sv', 'Per Brahe den yngre (1602–1680) var', ('1602', '1680')),
        ('fi', 'Kaari Marjatta Utrio (oik. Utrio-Linnilä, vuosina 1965–1973 Virkajärvi; s. 28. heinäkuuta 1942 Helsinki) on suomalainen', ('1942-07-28', None)),
        ('fi', 'Hertta Elina Kuusinen (1945–1950 Kuusinen-Leino, 14. helmikuuta 1904 Luhanka – 18. maaliskuuta 1974 Moskova) oli', ('1904-02-14', '1974-03-18')),
        ('fi', 'Aale Maria Tynni-Haavio (o.s. Tynni, vuosina 1940–1960 Tynni-Pirinen; 3. lokakuuta 1913 Kolppana, Inkerinmaa, Venäjä – 21. lokakuuta 1997 Helsinki) oli', ('1913-10-03', '1997-10-21')),
        ('sv', 'Karl-August Fagerholm, född 31 december 1901 i Sjundeå, Finland, död 22 maj 1984 i Helsingfors, var en politiker. Statsminister (1948–50, 1956–57 och 1958–59), samt socialminister (1937–43, 1944)', ('1901-12-31', '1984-05-22')),
        ('sv', 'Fredrik Saltzman, född 19 oktober 1839 i Helsingfors, död där 4 maj 1914, var en finländsk kirurg. Han var far till Fredrik Saltzman (1881–1972).', ('1839-10-19', '1914-05-04')),
        ('fi', 'Mikko Tapio Alatalo (s. 1. toukokuuta 1951 Kuivaniemi) on suomalainen muusikko, entinen keskustan kansanedustaja (2003–2019)', ('1951-05-01', None)),
        ('fi', 'Jakob Duwall (s. n. 1589 - k. 1634) oli ruotsalainen', ('1589', '1634')),
        ('sv', 'Mooses Putro, ursprungligen Putronen, född 30 oktober (18 oktober enligt julianska kalendern) 1848 i Tuutari i Ingermanland, försvunnen 24 november 1919 i Petrograd, var', ('1848-10-30', None)),
    ]
    for lang, text, want in tests:
        got = lifespan(lang, text)
        res = (iso(got['birth']), iso(got['death'])) if got else None
        print('ok ' if res == want else 'BAD', lang, res, want)
    for lang, text in [('fi', 'käytiin 25. kesäkuuta – 9. heinäkuuta 1944 ja 26.–28. kesäkuuta 1944'), ('sv', 'slutskede, 25 juni-9 juli 1944'),
                       ('en', '(June 25 to July 9, 1944) and on 15 and 29 January 2006'), ('fi', '30. marraskuuta 1939 – 13. maaliskuuta 1940')]:
        print(lang, [(D.date.fromordinal(o).isoformat(), s) for o, s in full_dates(lang, text)])
    print(dates('fi', 'Talvisota oli 30. marraskuuta 1939 – 13. maaliskuuta 1940 käyty sota, 105 päivää, 73 001 asukasta 1. tammikuuta 2022'))
    print(quantities('fi', 'Viipurissa oli 73 001 asukasta 1. tammikuuta 2022. Piirin 193 863 asukkaan, 2,5 miljoonaa, vuonna 1940'))
    print(quantities('en', 'population of Vyborg is 72,530 (2021 Census), 130 km (81 miles), 2.5 million, in 1940'))
    print(quantities('sv', 'I staden bodde 72 530 invånare 2021. De finska styrkorna (50 000 till antalet) cirka 150 000 man'))
