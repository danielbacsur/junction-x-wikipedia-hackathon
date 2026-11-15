# /// script
# dependencies = ["pymysql"]
# ///
"""Time travel: for every lifespan disagreement that involves Finnish, read the
whole history of the Finnish article's paragraphs from the system-versioned
passage table and rebuild what the lead said about the birth or death, when.

    uv run labs/three-wikipedias/history.py

One connection, one query per article. Writes cache/history.json."""
import collections as C, datetime as D, json, pathlib, re
import pymysql
from facts import lifespan, iso

ROOT = pathlib.Path(__file__).resolve().parent
CUTOFF = D.datetime(2026, 10, 1, 10, 59, 12)

def sql(name):
    return '\n'.join(l for l in (ROOT / 'sql' / name).read_text().split('\n') if not l.startswith('--'))

def same(a, b, n=None):
    """Two ISO values (year, year-month or full date) agree on their first n characters.
    Without n: at the coarser of the two precisions."""
    if a is None or b is None:
        return False
    if n is None:
        n = min(len(a), len(b))
    return len(a) >= n and len(b) >= n and a[:n] == b[:n]

TEMPLATE = re.compile(r'\{\{([^{}]*)\}\}')

def expand(mt):
    """Finnish date templates to plain dates: {{Syntymä- ja kuolinaika|2|1|1893|Vaasa|26|3|1918|Messukylä}}
    reads "2.1.1893 Vaasa – 26.3.1918 Messukylä". Every other template is dropped."""
    parts = [p.strip() for p in mt.group(1).split('|')]
    name = parts[0].lower()
    if 'aika' not in name and 'ikä' not in name:
        return ''
    out, i, args = [], 0, parts[1:]
    while i < len(args):
        if i + 2 < len(args) and all(re.fullmatch(r'\d{1,4}', a) for a in args[i:i + 3]) and len(args[i + 2]) >= 3:
            out.append(('date', f'{int(args[i])}.{int(args[i + 1])}.{args[i + 2]}')); i += 3
        elif i + 2 < len(args) and re.fullmatch(r'\d{1,2}', args[i]) and re.fullmatch(r'\d{1,2}', args[i + 1]) and re.match(r'\d{3,4}\b', args[i + 2]):
            year, rest = re.match(r'(\d{3,4})\b(.*)', args[i + 2]).groups()
            out.append(('date', f'{int(args[i])}.{int(args[i + 1])}.{year}')); out.append(('text', rest.strip())); i += 3
        else:
            if '=' not in args[i]:
                out.append(('text', args[i]))
            i += 1
    text, seen = '', 0
    for kind, value in out:
        if kind == 'date':
            seen += 1
            text += (' – ' if seen == 2 and 'kuolin' in name and 'syntym' in name else ' ') + value
        elif value:
            text += ' ' + value
    if 'syntym' in name and 'kuolin' not in name:
        text = ' s.' + text
    return text.strip()

def wiki_plain(wikitext):
    """Enough of a wikitext cleaner to read the opening of a lead."""
    s = re.sub(r'<ref[^>]*/>|<ref[^>]*>.*?</ref>|<!--.*?-->', '', wikitext, flags=re.S)
    for _ in range(3):
        s = TEMPLATE.sub(expand, s)
    s = re.sub(r'\[\[(?:Tiedosto|Kuva|File|Image):[^\]]*\]\]', '', s)
    s = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', s)
    s = re.sub(r"'{2,}|<[^>]+>", '', s)
    return re.sub(r'[ \t]+', ' ', s).strip()

def timeline(rows, field):
    """The value the lead stated over time, as stays: [start, end, value, rev, user, editor, reverted].
    The lead at a moment is the first or second prose paragraph alive at that moment that opens with a lifespan."""
    prose = [(r[0], r[2], r[3]) for r in rows if r[4] >= 40]  # ord, start, end of every real paragraph
    cands = []
    for ord_, rev, start, end, chars, head, wikihead, user, editor, reverted_by in rows:
        if end <= start:
            continue
        span = lifespan('fi', wiki_plain(wikihead)) or lifespan('fi', head)
        if not span:
            continue
        first = min(t['s'] for t in (span['birth'], span['death']) if t)
        if first > 200:
            continue
        above = sum(1 for o, s, e in prose if o < ord_ and s <= start < e)
        if above > 1:
            continue
        cands.append(dict(ord=ord_, rev=rev, start=start, end=min(end, CUTOFF), value=iso(span[field]),
                          user=user, editor=editor, reverted=reverted_by is not None))
    points = sorted({c['start'] for c in cands} | {c['end'] for c in cands})
    stays = []
    for a, b in zip(points, points[1:]):
        alive = [c for c in cands if c['start'] <= a < c['end']]
        if not alive:
            continue
        c = min(alive, key=lambda c: c['ord'])
        if stays and stays[-1]['value'] == c['value'] and stays[-1]['reverted'] == c['reverted'] and stays[-1]['end'] == a:
            stays[-1]['end'] = b
        else:
            stays.append(dict(start=a, end=b, value=c['value'], rev=c['rev'], user=c['user'], editor=c['editor'], reverted=c['reverted']))
    return stays

def clean_runs(stays):
    """Stays that were not reverted, neighbours with the same value merged across reverted or empty stretches."""
    runs = []
    for s in stays:
        if s['reverted']:
            continue
        if runs and runs[-1]['value'] == s['value']:
            runs[-1]['end'] = s['end']
        else:
            runs.append(dict(s))
    return runs

def main():
    conn = pymysql.connect(host='127.0.0.1', port=3310, user='wtt', password='wtt', charset='utf8mb4', autocommit=True)
    out = []
    with conn.cursor() as q:
        q.execute("SET time_zone = '+00:00'")
        q.execute(sql('disagreements.sql'))
        cols = [d[0] for d in q.description]
        pairs = [dict(zip(cols, r)) for r in q.fetchall()]
        q.execute("SELECT qid, lang, field, y, m, d FROM lab_three_wikipedias.lead_fact")
        fact = {(r[0], r[1], r[2]): f"{r[3]:04d}" + (f"-{r[4]:02d}" if r[4] else '') + (f"-{r[5]:02d}" if r[5] else '') for r in q.fetchall()}
        todo = C.defaultdict(list)
        for p in pairs:
            if 'fi' in (p['lang_a'], p['lang_b']):
                todo[p['fi_page_id']].append(p)
        print('pairs', len(pairs), 'with Finnish', sum(len(v) for v in todo.values()), 'Finnish articles', len(todo), flush=True)
        for n, (page_id, ps) in enumerate(sorted(todo.items())):
            q.execute(sql('lead-history.sql'), (page_id,))
            rows = q.fetchall()
            q.execute("SELECT MIN(saved_at), COUNT(*) FROM wtt.edit WHERE page_id = %s", (page_id,))
            created, versions = q.fetchone()
            q.execute("SELECT date_modified FROM wtt.article WHERE lang = 'fi' AND page_id = %s", (page_id,))
            snapshot = q.fetchone()[0]
            for field in sorted({p['field'] for p in ps}):
                stays = timeline(rows, field)
                runs = clean_runs(stays)
                fi_value = fact[(ps[0]['qid'], 'fi', field)]
                at_snapshot = next((s['value'] for s in stays if s['start'] <= snapshot < s['end']), None)
                at_cutoff = next((s['value'] for s in reversed(stays) if s['end'] >= CUTOFF), None)
                holding = [i for i, r in enumerate(runs) if r['value'] == fi_value]
                last = holding[-1] if holding else None
                for p in ps:
                    if p['field'] != field:
                        continue
                    other = p['lang_b'] if p['lang_a'] == 'fi' else p['lang_a']
                    other_value = fact[(p['qid'], other, field)]
                    # An earlier Finnish "1885" does not count as agreeing with "17 June 1885"
                    # when today's quarrel is about the day: compare at the precision of the disagreement.
                    grain = min(len(fi_value), len(other_value))
                    out.append(dict(
                        qid=p['qid'], field=field, fi_page_id=page_id, fi_title=p['fi_title'], other=other,
                        fi_value=fi_value, other_value=other_value, size=p['size'], gap=int(p['gap']), grain=p['grain'],
                        created=created, versions=versions, snapshot=snapshot,
                        history_matches_snapshot=at_snapshot == fi_value,
                        fi_at_cutoff=at_cutoff, agrees_at_cutoff=same(at_cutoff, other_value),
                        first_stated=runs[holding[0]]['start'] if holding else None,
                        since=runs[last]['start'] if last is not None else None,
                        since_rev=runs[last]['rev'] if last is not None else None,
                        since_user=runs[last]['user'] if last is not None else None,
                        since_editor=runs[last]['editor'] if last is not None else None,
                        before=runs[last - 1]['value'] if last else None,
                        is_first_value=last == 0,
                        ever_agreed=any(same(r['value'], other_value, grain) for r in runs),
                        ever_agreed_counting_reverted=any(same(s['value'], other_value, grain) for s in stays),
                        distinct_values=len({r['value'] for r in runs if r['value']}),
                        timeline=[dict(start=s['start'], end=s['end'], value=s['value'], rev=s['rev'], user=s['user'],
                                       editor=s['editor'], reverted=s['reverted']) for s in stays],
                    ))
            if n % 25 == 0:
                print(n, len(todo), flush=True)
    conn.close()
    (ROOT / 'cache' / 'history.json').write_text(json.dumps(out, ensure_ascii=False, default=lambda x: x.isoformat(sep=' ')))
    print('rows', len(out))

if __name__ == '__main__':
    main()
