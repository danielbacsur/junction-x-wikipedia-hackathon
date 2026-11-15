# /// script
# dependencies = ["pymysql", "numpy"]
# ///
"""Write data/*.json and print every number the README quotes.

    uv run labs/three-wikipedias/report.py

Reads the lab database (through the SQL files), cache/history.json (history.py),
cache/audit-sample.json (audit.py write) and audit-labels.json (typed by hand)."""
import collections as C, gzip, json, pathlib, statistics
import numpy as np
from q import run

ROOT = pathlib.Path(__file__).resolve().parent
SOURCE = ('wtt.article, wtt.article_vector, wtt.passage (FOR SYSTEM_TIME ALL), wtt.edit; '
          'article text August 2025, Finnish history to 2026-10-01; labs/three-wikipedias')
SNAPSHOT_NOTE = 'Finnish, Swedish and English leads as of the August 2025 text snapshot'

def table(name):
    cols, rows = run(name)
    return [dict(zip(cols, [float(v) if hasattr(v, 'as_tuple') else v for v in r])) for r in rows]

def dump(name, title, unit, rows, **extra):
    body = dict(title=title, unit=unit, source=SOURCE, **extra, rows=rows)
    (ROOT / 'data' / name).write_text(json.dumps(body, ensure_ascii=False, indent=1, default=str) + '\n')

def merged(stays):
    """Stays for display: neighbours with the same value and the same reverted flag, less than a day apart, become one."""
    import datetime as D
    out = []
    for s in stays:
        row = dict(start=s['start'], end=s['end'], value=s['value'], revision=s['rev'], editor=s['editor'], reverted=s['reverted'])
        if out and out[-1]['value'] == row['value'] and out[-1]['reverted'] == row['reverted'] and \
                (D.datetime.fromisoformat(row['start'][:19]) - D.datetime.fromisoformat(out[-1]['end'][:19])).days < 1:
            out[-1]['end'] = row['end']
        else:
            out.append(row)
    return out

def leads():
    rows = json.load(gzip.open(ROOT / 'cache' / 'leads.json.gz', 'rt', encoding='utf8'))
    return {(r['qid'], r['lang']): r for r in rows}

def main():
    L = leads()
    url = lambda qid, lang: L[(qid, lang)]['url'] if (qid, lang) in L else None
    out = {}

    # 1. Lifespans ------------------------------------------------------------
    people = table('people-summary')[0]
    sizes = table('people-size')
    by_pair = table('people-by-pair')
    topics = table('topic-kinds')
    living = table('still-living')
    summary = [dict(metric=k, value=int(v)) for k, v in people.items()]
    summary += [dict(metric=f"topics_{t['kind']}_{t['langs'].replace(',', '_')}", value=int(t['topics'])) for t in topics]
    summary.append(dict(metric='still_living_rows', value=len(living)))
    summary.append(dict(metric='still_living_topics', value=len({r['qid'] for r in living})))
    dump('size-of-difference.json', 'How far apart the birth and death dates are when two languages disagree',
         'pair of languages stating the same field of the same topic', sizes, note=SNAPSHOT_NOTE)
    dump('by-language-pair.json', 'Birth and death dates compared and disagreeing, by pair of languages',
         'pair of languages stating the same field of the same topic', by_pair, note=SNAPSHOT_NOTE)
    shape = table('people-shape')
    dump('shape-of-difference.json', 'Full birth and death dates that disagree: which part differs',
         'pair of languages stating the same field of the same topic', shape, note=SNAPSHOT_NOTE)
    out['people'] = people; out['sizes'] = sizes; out['by_pair'] = by_pair; out['shape'] = shape

    # 2. Wider net ------------------------------------------------------------
    dates_sum, quant_sum = table('date-summary')[0], table('quantity-summary')[0]
    date_miss, quant_miss = table('date-near-miss'), table('quantity-near-miss')
    wider = [
        dict(kind='full dates in the opening paragraph', comparable_topics=int(dates_sum['comparable_topics']),
             comparable_pairs=int(dates_sum['comparable_pairs']), pairs_sharing_a_value=int(dates_sum['pairs_sharing_a_date']),
             near_miss_rows=len(date_miss), near_miss_topics=len({r['qid'] for r in date_miss}),
             near_miss_pairs=len({(r['qid'], r['lang_a'], r['lang_b']) for r in date_miss}),
             julian_gap_rows=sum(r['gap_days'] in (10, 11, 12, 13) for r in date_miss), one_day_rows=sum(r['gap_days'] == 1 for r in date_miss)),
        dict(kind='quantities of 100 or more in the opening paragraph', comparable_topics=int(quant_sum['comparable_topics']),
             comparable_pairs=int(quant_sum['comparable_pairs']), pairs_sharing_a_value=int(quant_sum['pairs_sharing_a_number']),
             near_miss_rows=len(quant_miss), near_miss_topics=len({r['qid'] for r in quant_miss}),
             near_miss_pairs=len({(r['qid'], r['lang_a'], r['lang_b']) for r in quant_miss})),
    ]
    dump('wider-net.json', 'Beyond lifespans: dates and quantities in the opening paragraph of other articles',
         'topic and pair of languages', wider,
         note='A near miss: each language gives a value the other lacks, within 31 days (dates) or 10 % (quantities).')
    dump('date-near-misses.json', 'Dates in the opening paragraph that two languages give differently, within 31 days',
         'pair of dates', [dict(r, url_a=url(r['qid'], r['lang_a']), url_b=url(r['qid'], r['lang_b'])) for r in date_miss])
    out['wider'] = wider

    # 3. Distance -------------------------------------------------------------
    dist_sum = table('distance-summary')
    allrows = table('distance-all')
    hist = []
    for pair in ('en-fi', 'en-sv', 'fi-sv'):
        ds = sorted(r['distance'] for r in allrows if f"{r['lang_a']}-{r['lang_b']}" == pair)
        q = lambda p: round(ds[int(p * (len(ds) - 1))], 4)
        bins = C.Counter(min(int(d / 0.05), 11) for d in ds)
        hist.append(dict(pair=pair, topics=len(ds), p10=q(.1), median=q(.5), p90=q(.9), p99=q(.99), largest=round(ds[-1], 4),
                         bins=[dict(from_=round(b * 0.05, 2), to=round(b * 0.05 + 0.05, 2), topics=bins.get(b, 0)) for b in range(12)]))
    # Length control: per pair of languages, distance ~ |ln(length ratio)| + ln(shorter length).
    resid = []
    fits = []
    for pair in ('en-fi', 'en-sv', 'fi-sv'):
        rs = [r for r in allrows if f"{r['lang_a']}-{r['lang_b']}" == pair]
        y = np.array([r['distance'] for r in rs])
        x1 = np.array([abs(np.log(r['chars_a'] / r['chars_b'])) for r in rs])
        x2 = np.array([np.log(min(r['chars_a'], r['chars_b'])) for r in rs])
        X = np.column_stack([np.ones(len(rs)), x1, x2])
        beta, *_ = np.linalg.lstsq(X, y, rcond=None)
        pred = X @ beta
        r2 = 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()
        fits.append(dict(pair=pair, intercept=round(float(beta[0]), 4), per_log_length_ratio=round(float(beta[1]), 4),
                         per_log_shorter_length=round(float(beta[2]), 4), r_squared=round(float(r2), 3),
                         correlation_with_log_length_ratio=round(float(np.corrcoef(x1, y)[0, 1]), 3)))
        for r, p in zip(rs, pred):
            resid.append(dict(r, pair=pair, expected=round(float(p), 4), residual=round(float(r['distance'] - p), 4)))
    told = [r for r in resid if min(r['chars_a'], r['chars_b']) >= 1500 and not r['truncated']]
    told.sort(key=lambda r: -r['residual'])
    top = [dict(qid=r['qid'], pair=r['pair'], fi_title=r['fi_title'], sv_title=r['sv_title'], en_title=r['en_title'], kind=r['kind'],
                distance=round(r['distance'], 4), expected_for_length=r['expected'], residual=r['residual'],
                chars_a=r['chars_a'], chars_b=r['chars_b'], url_a=url(r['qid'], r['lang_a']), url_b=url(r['qid'], r['lang_b']))
           for r in told[:30]]
    dump('distance-distribution.json', 'Cosine distance between the bge-m3 vectors of the same topic in two languages',
         'topic', hist, length_fit=fits,
         note='0 is the same direction. Computed in MariaDB with VEC_DISTANCE_COSINE on rows fetched by primary key.')
    dump('told-most-differently.json', 'Topics whose two articles are further apart than their lengths explain',
         'topic and pair of languages', top,
         note='Residual of distance after a linear fit on length ratio and shorter length, per pair of languages. '
              'Both articles at least 1,500 characters, neither cut before embedding.')
    df = table('distance-and-facts')
    assoc = []
    for pair in ('en-fi', 'en-sv', 'fi-sv', 'all'):
        rs = [r for r in df if pair == 'all' or f"{r['lang_a']}-{r['lang_b']}" == pair]
        ds = sorted(r['distance'] for r in rs)
        cuts = [ds[int(len(ds) * k / 4)] for k in (1, 2, 3)]
        quart = C.defaultdict(lambda: [0, 0])
        for r in rs:
            k = sum(r['distance'] >= c for c in cuts)
            quart[k][0] += 1; quart[k][1] += int(r['disagree'])
        agree = [r['distance'] for r in rs if not r['disagree']]; dis = [r['distance'] for r in rs if r['disagree']]
        assoc.append(dict(pair=pair, pairs=len(rs), disagreeing=len(dis),
                          median_distance_agreeing=round(statistics.median(agree), 4),
                          median_distance_disagreeing=round(statistics.median(dis), 4),
                          disagreeing_share_by_distance_quarter=[round(quart[k][1] / quart[k][0], 4) for k in range(4)],
                          disagreeing_count_by_distance_quarter=[quart[k][1] for k in range(4)]))
    dump('distance-and-facts.json', 'Does a large distance go with disagreeing birth or death dates?',
         'lifespan topic and pair of languages', assoc,
         note='Quarters are by distance within the pair of languages, nearest first.')
    out['distance'] = dict(summary=dist_sum, hist=[{k: v for k, v in h.items() if k != 'bins'} for h in hist], fits=fits, assoc=assoc)

    # 4. Time travel ----------------------------------------------------------
    H = json.load(open(ROOT / 'cache' / 'history.json'))
    ok = [h for h in H if h['history_matches_snapshot'] and h['since']]
    keyed = {}
    for h in ok:   # one row per topic and field: the Finnish value has one history, whatever it is compared with
        keyed.setdefault((h['qid'], h['field']), []).append(h)
    facts = list(keyed.values())
    def year_band(s):
        y = int(s[:4])
        return '2003 to 2009' if y <= 2009 else '2010 to 2014' if y <= 2014 else '2015 to 2019' if y <= 2019 else '2020 to 2022' if y <= 2022 else '2023 to 2026'
    def days(a, b):
        import datetime as D
        return (D.datetime.fromisoformat(b[:19]) - D.datetime.fromisoformat(a[:19])).days
    first_value = sum(g[0]['is_first_value'] for g in facts)
    within_30 = sum(days(g[0]['created'], g[0]['since']) <= 30 for g in facts)
    recent = sum(g[0]['since'] >= '2023-08-01' for g in facts)
    ever = sum(any(h['ever_agreed'] for h in g) for g in facts)
    ever_rev = sum(any(h['ever_agreed_counting_reverted'] for h in g) for g in facts)
    resolved = sum(any(h['agrees_at_cutoff'] for h in g) for g in facts)
    changed_since = sum(g[0]['fi_at_cutoff'] != g[0]['fi_value'] for g in facts)
    travel = [
        dict(metric='disagreeing pairs with Finnish on one side', value=len(H)),
        dict(metric='of those, Finnish history rebuilt and matching the snapshot', value=len(ok)),
        dict(metric='Finnish facts behind them (topic and field)', value=len(facts)),
        dict(metric='current value is the first value the lead ever stated', value=first_value),
        dict(metric='current value replaced an earlier one', value=len(facts) - first_value),
        dict(metric='of those, the earlier one was as precise (a change, not a refinement)',
             value=sum(bool(g[0]['before']) and len(g[0]['before']) == len(g[0]['fi_value']) for g in facts)),
        dict(metric='current value first stated within 30 days of the first version', value=within_30),
        dict(metric='current value standing only since 1 August 2023 or later', value=recent),
        dict(metric='Finnish lead once agreed with the other language (not counting reverted versions)', value=ever),
        dict(metric='the same, counting reverted versions', value=ever_rev),
        dict(metric='Finnish value changed between the snapshot and 1 October 2026', value=changed_since),
        dict(metric='Finnish agrees with the other language on 1 October 2026', value=resolved),
    ]
    bands = C.Counter(year_band(g[0]['since']) for g in facts)
    since_rows = [dict(standing_since=b, facts=bands.get(b, 0)) for b in ('2003 to 2009', '2010 to 2014', '2015 to 2019', '2020 to 2022', '2023 to 2026')]
    editors = C.Counter(g[0]['since_editor'] or 'unknown' for g in facts)
    dump('finnish-history.json', 'When the Finnish lead first said what it says, for every date it gives differently',
         'Finnish birth or death date that another language gives differently', travel,
         standing_since=since_rows, set_by=[dict(editor=k, facts=v) for k, v in editors.most_common()],
         note='From wtt.passage FOR SYSTEM_TIME ALL. Versions marked reverted_by are left out unless a row says otherwise.')
    out['travel'] = travel; out['since'] = since_rows; out['set_by'] = dict(editors)

    # 5. The editor's list ----------------------------------------------------
    labels = json.load(open(ROOT / 'audit-labels.json'))['labels']
    pairs = table('disagreements')
    by = C.defaultdict(list)
    for p in pairs:
        by[(p['qid'], p['field'])].append(p)
    fact = {(r['qid'], r['lang'], r['field']): r for r in table('facts')}
    hist_by = {(h['qid'], h['field']): h for h in H if h['history_matches_snapshot'] and h['since']}
    listing = []
    moves = C.Counter()
    for (qid, field), ps in by.items():
        langs = sorted({l for p in ps for l in (p['lang_a'], p['lang_b'])} | {l for l in ('en', 'fi', 'sv') if (qid, l, field) in fact})
        vals = {l: fact[(qid, l, field)] for l in langs}
        if any(v['approx'] or v['old_style'] for v in vals.values()) or any(p['calendar_shaped'] for p in ps):
            continue                                   # rule 1: no hedged dates, no calendar footprints
        if any(v['d'] is None for v in vals.values()):
            continue                                   # rule 2: every language gives a full date
        label = labels.get(f'lifespan:{qid}:{field}')
        if label and label[0] != 'real':
            continue                                   # rule 3: nothing the manual read threw out
        iso = {l: f"{v['y']:04d}-{v['m']:02d}-{v['d']:02d}" for l, v in vals.items()}
        groups = C.defaultdict(list)
        for l, v in iso.items():
            groups[v].append(l)
        odd = next((g[0] for g in groups.values() if len(g) == 1), None) if len(langs) == 3 and len(groups) == 2 else None
        h = hist_by.get((qid, field))
        score = (3 if odd else 0) + (2 if label else 0) + (1 if h and h['ever_agreed'] else 0)
        # Who moved: only where two languages agree against the third and the Finnish history is known.
        if odd and h:
            past = {s['value'] for s in h['timeline'] if not s['reverted'] and s['value'] and s['value'] != iso['fi']}
            if odd == 'fi':
                move = 'Finnish left the value the other two share' if iso['en'] in past else 'Finnish never had the value the other two share'
            else:
                move = f'Finnish used to have the {odd} value and left it' if iso[odd] in past else f'Finnish never had the {odd} value'
            moves[move] += 1
        listing.append(dict(
            qid=qid, field=field, score=score, read_by_hand=bool(label), reading=label[1] if label else None,
            values={l: dict(shown=' '.join(vals[l]['shown'].split()), iso=iso[l], title=L[(qid, l)]['title'], url=url(qid, l)) for l in langs},
            odd_one_out=odd, largest_gap_days=max(int(p['gap']) for p in ps),
            finnish=None if not h else dict(
                value=h['fi_value'], standing_since=h['since'], set_in_revision=h['since_rev'],
                revision_url=f"https://fi.wikipedia.org/?oldid={h['since_rev']}", set_by=h['since_editor'],
                said_before=h['before'], first_value_ever=h['is_first_value'], article_created=h['created'],
                once_agreed_with_other=any(x['ever_agreed'] for x in keyed[(qid, field)]),
                on_2026_10_01=h['fi_at_cutoff'], distinct_values=h['distinct_values'],
                timeline=merged(h['timeline'])[-40:])))
    listing.sort(key=lambda r: (-r['score'], -r['largest_gap_days'], r['qid']))
    dump('editors-list.json', 'Birth and death dates the three Wikipedias give differently, with the Finnish timeline',
         'topic and field', listing[:60], candidates=len(listing),
         odd_one_out={k or 'none (two languages, or three values)': v for k, v in C.Counter(r['odd_one_out'] for r in listing).items()},
         who_moved=[dict(reading=k, facts=v) for k, v in moves.most_common()],
         rule='Kept: every language gives a full date, none hedged, no old-style calendar in the lead, gap not the Julian offset, '
              'not thrown out by the manual read. Score: 3 if two languages agree against the third, 2 if read by hand, '
              '1 if Finnish once agreed with the other value. Ties by size of the gap.')
    out['list'] = dict(candidates=len(listing), odd=C.Counter(r['odd_one_out'] for r in listing), top=listing[:25])

    # 6. Manual audit ---------------------------------------------------------
    sample = {c['id']: c for c in json.load(open(ROOT / 'cache' / 'audit-sample.json'))}
    audit = []
    for cid, (label, note) in labels.items():
        set_ = cid.split(':')[0]
        c = sample.get(cid)
        qid = cid.split(':')[1]
        audit.append(dict(id=cid, set=set_, label=label, note=note, qid=qid,
                          values=c['values'] if c else None,
                          leads={l: dict(url=url(qid, l), opening=(c['leads'][l]['opening'][:300] if c and l in c['leads'] else None))
                                 for l in ('fi', 'sv', 'en') if (qid, l) in L}))
    counts = C.defaultdict(C.Counter)
    for a in audit:
        counts[a['set']][a['label']] += 1
    dump('manual-audit.json', 'Disagreements read by hand, three leads side by side', 'case read',
         audit, counts={k: dict(v) for k, v in counts.items()},
         sets=dict(lifespan='30 random lifespan disagreements (seed 2026)', date='10 random date near misses',
                   quantity='10 random quantity near misses', living='8 random "still living" cases',
                   recent='every "still living" case with a death from 2000 on'),
         note=json.load(open(ROOT / 'audit-labels.json'))['note'])
    out['audit'] = {k: dict(v) for k, v in counts.items()}
    both = {q for q, f in by if f == 'birth'} & {q for q, f in by if f == 'death'}
    summary += [dict(metric='pairs_compared', value=sum(int(r['compared']) for r in by_pair)),
                dict(metric='pairs_disagreeing', value=len(pairs)),
                dict(metric='facts_disagreeing', value=len(by)),
                dict(metric='topics_disagreeing_on_birth_and_death', value=len(both)),
                dict(metric='editors_list_candidates', value=len(listing))]
    dump('summary.json', 'Three Wikipedias on the history of Finland: what can be compared and what disagrees', 'count',
         summary, note=SNAPSHOT_NOTE)
    print('SUMMARY', {r['metric']: r['value'] for r in summary})

    print(json.dumps({k: v for k, v in out.items() if k != 'list'}, ensure_ascii=False, indent=1, default=str))
    print('LIST', out['list']['candidates'], dict(out['list']['odd']), dict(moves))
    for r in out['list']['top']:
        f = r['finnish']
        print(r['score'], r['field'], '|', ' / '.join(f"{l} {v['shown']}" for l, v in r['values'].items()), '|', r['values']['fi']['title'],
              '| odd:', r['odd_one_out'], '| fi since', f and f['standing_since'][:10], 'before', f and f['said_before'], 'agreed once', f and f['once_agreed_with_other'])

if __name__ == '__main__':
    main()
