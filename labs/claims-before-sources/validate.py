# /// script
# dependencies = []
# ///
import json,pathlib,math,collections
B=pathlib.Path(__file__).parent
load=lambda n:json.loads((B/('cache' if n.endswith('input') else 'data')/f'{n}.json').read_text())['rows']
def pct(a,p):
 a=sorted(a);i=(len(a)-1)*p;lo=math.floor(i);hi=math.ceil(i);return a[lo]+(a[hi]-a[lo])*(i-lo)
s=load('summary')[0];rs=load('reference-input');cs=load('candidates');facts=load('citation-facts-input');pub=load('publication-sql-summary')[0]
assert s['referenced_today']+s['no_reference_today']==s['current_paragraphs']
assert s['born_with_reference']+s['gained_reference']==len(rs)==s['referenced_today']
assert s['never_referenced']+s['reference_removed']==s['no_reference_today']
for x in load('wait-overall'):
 a=[r['wait_days'] for r in rs if x['population']=='all' or r['wait_days']>0]
 for p,k in [(.25,'p25'),(.5,'median'),(.75,'p75')]:assert abs(pct(a,p)-x[k])<.0002
assert len(facts)==pub['references_n'];assert sum(r['publication_year'] is not None for r in facts)==pub['parsed_n']
assert len(cs)==50 and len({(r['page_id'],r['slot']) for r in cs})==50
assert all(cs[i]['wait_days']>=cs[i+1]['wait_days'] for i in range(49))
gaps={(r['page_id'],r['slot']) for r in load('gap-input')}
for r in cs:
 assert min(r['before_similarity'],r['origin_similarity'],r['current_similarity'])>=.8
 assert int(r['written'][:4])<r['source']['publication_year']<=int(r['referenced'][:4])
 assert r['source_still_present'] and (r['page_id'],r['slot']) not in gaps
 assert all(r.get(k) for k in ['written_oldid','reference_oldid','before_text','after_text'])
for p in (B/'data').glob('*.json'):
 d=json.loads(p.read_text());assert all(k in d for k in ['title','unit','source','rows']),p
assert len(load('audit'))==15 and len(load('parser-audit'))==50
result=dict(title='Independent arithmetic and artifact verification',unit='checks',source='validate.py; Python quantiles independently compared to MariaDB',rows=[dict(coverage_reconciles=True,sql_quantiles_match=True,publication_denominators_match=True,top50_unique_ranked_and_pass_filters=True,all_json_envelopes_valid=True,manual_audits_present=True)])
(B/'data/validation.json').write_text(json.dumps(result,indent=2));print(result)
