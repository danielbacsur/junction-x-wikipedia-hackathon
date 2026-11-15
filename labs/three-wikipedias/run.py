# /// script
# dependencies = ["pymysql"]
# ///
"""Extract the facts from the cached leads, load them into lab_three_wikipedias
and let MariaDB compute the cosine distances. One connection at a time.

    uv run labs/three-wikipedias/run.py            # everything
    uv run labs/three-wikipedias/run.py facts      # extraction and load only
    uv run labs/three-wikipedias/run.py distance   # distances only
"""
import collections as C, datetime as D, gzip, json, pathlib, sys
import pymysql
from facts import lifespan, opening, lead_paragraphs, full_dates, quantities, iso

ROOT = pathlib.Path(__file__).resolve().parent
LANGS = ('en', 'fi', 'sv')

def connect(user='wtt'):
    return pymysql.connect(host='127.0.0.1', port=3310, user=user, password='wtt', charset='utf8mb4', autocommit=True)

def statements(name):
    text = '\n'.join(l for l in (ROOT / 'sql' / name).read_text().split('\n') if not l.startswith('--'))
    return [s.strip() for s in text.split(';') if s.strip()]

def load_topics():
    rows = json.load(gzip.open(ROOT / 'cache' / 'leads.json.gz', 'rt', encoding='utf8'))
    topics = C.defaultdict(dict)
    for r in rows:
        topics[r['qid']][r['lang']] = r
    return topics

def extract(topics):
    """Returns the rows of topic, lead_fact, lead_date and lead_quantity."""
    topic_rows, facts, dates_, quants = [], [], [], []
    for qid, t in sorted(topics.items()):
        spans = {}
        for lang, r in t.items():
            r['opening'] = opening(r['head'])
            span = lifespan(lang, r['opening']) if r['opening'] else None
            if span:
                spans[lang] = span
        kind = 'lifespan' if 'fi' in spans and len(spans) >= 2 else 'other'
        fi = t['fi']
        topic_rows.append((qid, kind, ','.join(sorted(t)), fi['page_id'], fi['title'],
                           t.get('sv', {}).get('title'), t.get('en', {}).get('title'),
                           fi['chars'], t.get('sv', {}).get('chars'), t.get('en', {}).get('chars')))
        if kind == 'lifespan':
            for lang, span in spans.items():
                for field in ('birth', 'death'):
                    tok = span[field]
                    if not tok:
                        continue
                    day = D.date(tok['y'], tok['m'], tok['d']).toordinal() if tok['d'] else None
                    facts.append((qid, lang, field, tok['y'], tok['m'], tok['d'], day, int(tok['approx']),
                                  int(span['old_style']), span['how'], tok['text'][:80]))
        else:
            for lang, r in t.items():
                text = r['opening'][:1500]
                for day, shown in full_dates(lang, text):
                    dates_.append((qid, lang, day, shown[:80]))
                seen = set()
                for q in quantities(lang, text):
                    if q['value'] not in seen:
                        seen.add(q['value'])
                        quants.append((qid, lang, q['value'], q['text'][:80]))
    return topic_rows, facts, dates_, quants

def insert(q, table, rows):
    if not rows:
        return
    marks = ','.join(['%s'] * len(rows[0]))
    for i in range(0, len(rows), 1000):
        q.executemany(f'INSERT INTO lab_three_wikipedias.{table} VALUES ({marks})', rows[i:i + 1000])

def facts_step():
    root = connect('root')
    with root.cursor() as q:
        for s in statements('database.sql'):
            q.execute(s)
    root.close()
    topics = load_topics()
    topic_rows, facts, dates_, quants = extract(topics)
    conn = connect()
    with conn.cursor() as q:
        for s in statements('schema.sql'):
            q.execute(s)
        insert(q, 'topic', topic_rows)
        insert(q, 'lead_fact', facts)
        insert(q, 'lead_date', dates_)
        insert(q, 'lead_quantity', quants)
    conn.close()
    print('topics', len(topic_rows), 'lifespan facts', len(facts), 'full dates', len(dates_), 'quantities', len(quants))

def distance_step():
    conn = connect()
    sql = statements('distance.sql')[0]
    with conn.cursor() as q:
        q.execute('DELETE FROM lab_three_wikipedias.topic_distance')
        q.execute('SELECT qid FROM lab_three_wikipedias.topic ORDER BY qid')
        ids = [r[0] for r in q.fetchall()]
        for i in range(0, len(ids), 500):
            chunk = ids[i:i + 500]
            q.execute(sql, (chunk[0], chunk[-1]))
            print('distance', i + len(chunk), len(ids), flush=True)
        q.execute('SELECT COUNT(*) FROM lab_three_wikipedias.topic_distance')
        print('pairs', q.fetchone()[0])
    conn.close()

if __name__ == '__main__':
    step = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if step in ('all', 'facts'):
        facts_step()
    if step in ('all', 'distance'):
        distance_step()
