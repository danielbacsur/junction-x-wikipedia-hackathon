# /// script
# dependencies = ["pymysql"]
# ///
"""Draw the samples that were read by hand and print the leads side by side.

    uv run labs/three-wikipedias/audit.py            # prints every sampled case
    uv run labs/three-wikipedias/audit.py write      # also writes cache/audit-sample.json

Samples are seeded: 30 lifespan disagreements (topic and field), 10 date near
misses, 10 quantity near misses, 8 "still living" cases. The labels typed after
reading are in audit-labels.json."""
import collections as C, gzip, json, pathlib, random, sys
from facts import opening
from q import run

ROOT = pathlib.Path(__file__).resolve().parent

def leads():
    rows = json.load(gzip.open(ROOT / 'cache' / 'leads.json.gz', 'rt', encoding='utf8'))
    out = C.defaultdict(dict)
    for r in rows:
        out[r['qid']][r['lang']] = dict(title=r['title'], url=r['url'], opening=opening(r['head'])[:420])
    return out

def sample():
    rnd = random.Random(2026)
    L = leads()
    cases = []
    cols, rows = run('disagreements')
    by = C.defaultdict(list)
    for r in rows:
        r = dict(zip(cols, r)); by[(r['qid'], r['field'])].append(r)
    for key in rnd.sample(sorted(by), 30):
        ps = by[key]
        cases.append(dict(id=f'lifespan:{key[0]}:{key[1]}', set='lifespan', qid=key[0], field=key[1],
                          values={l: v for p in ps for l, v in ((p['lang_a'], p['shown_a']), (p['lang_b'], p['shown_b']))},
                          size=sorted({p['size'] for p in ps}), leads=L[key[0]]))
    for name, label, n in (('date-near-miss', 'date', 10), ('quantity-near-miss', 'quantity', 10)):
        cols, rows = run(name)
        by = C.defaultdict(list)
        for r in rows:
            r = dict(zip(cols, r)); by[r['qid']].append(r)
        for qid in rnd.sample(sorted(by), n):
            cases.append(dict(id=f'{label}:{qid}', set=label, qid=qid,
                              values=[f"{p['lang_a']} {p['shown_a']} / {p['lang_b']} {p['shown_b']}" for p in by[qid]], leads=L[qid]))
    cols, rows = run('still-living')
    by = C.defaultdict(list)
    for r in rows:
        r = dict(zip(cols, r)); by[r['qid']].append(r)
    for qid in rnd.sample(sorted(by), 8):
        cases.append(dict(id=f'living:{qid}', set='living', qid=qid,
                          values=[f"{p['says_died']} died {p['death']} / {p['birth_only']} born {p['birth']} only" for p in by[qid]], leads=L[qid]))
    return cases

if __name__ == '__main__':
    cases = sample()
    if len(sys.argv) > 1 and sys.argv[1] == 'write':
        (ROOT / 'cache' / 'audit-sample.json').write_text(json.dumps(cases, ensure_ascii=False, indent=1))
    only = sys.argv[2] if len(sys.argv) > 2 else None
    for c in cases:
        if only and c['set'] != only:
            continue
        print('=' * 8, c['id'], c['values'], c.get('size', ''))
        for lang in ('fi', 'sv', 'en'):
            if lang in c['leads']:
                l = c['leads'][lang]
                print(f"  [{lang}] {l['url']}\n       {l['opening'][:300]}")
