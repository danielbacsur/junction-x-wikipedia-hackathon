# /// script
# requires-python = ">=3.11,<3.15"
# dependencies = ["pymysql==1.1.2", "numpy>=2.2"]
# ///
from bench import *
c=connect();q=c.cursor();q.execute('USE lab_temporal_ann');q.execute("SET time_zone='+00:00'")
runs=[json.loads(s) for s in (DATA/'runs.jsonl').read_text().splitlines()];truth={(r['date'],r['query']):r for r in runs if r['method']=='C'}
z=np.load(DATA/'queries.npz')['vectors'];rows=[];plans={}
for qi in range(10):
 raw=z[qi].tobytes();start=time.perf_counter()
 q.execute('SELECT id,VEC_DISTANCE_COSINE(embedding,%s) d FROM b IGNORE INDEX(embedding) ORDER BY d LIMIT 1000',(raw,));cand=[r[0] for r in q.fetchall()];ms=1000*(time.perf_counter()-start)
 for date in DATES:
  q.execute('SELECT id FROM life FOR SYSTEM_TIME AS OF TIMESTAMP %s',(date,));alive={r[0] for r in q.fetchall()};t=set(truth[date,qi]['ids'])
  for k in [50,200,1000]:
   ids=[i for i in cand[:k] if i in alive][:10];rows.append({'query':qi,'date':date,'K':k,'recall':len(set(ids)&t)/10,'underfilled':len(ids)<10,'full_but_wrong':len(ids)==10 and set(ids)!=t,'ids':ids,'global_exact_ms':ms})
 print('oracle',qi,flush=True)
# Clean JSON plans using a session variable instead of an escaped binary literal.
q.execute('SET @query_vector=%s',(z[0].tobytes(),))
for date in [DATES[0],DATES[3],DATES[-1]]:
 for ef in [20,80,200,1000]:
  q.execute(f'SET mhnsw_ef_search={ef}')
  for m,(sql,args) in sqls(date,z[0].tobytes()).items():
   sql=sql.replace('%s','@query_vector',1)
   q.execute('EXPLAIN FORMAT=JSON '+sql,(date,));ex=plan_json(q.fetchone()[0]);q.execute('ANALYZE FORMAT=JSON '+sql,(date,));an=plan_json(q.fetchone()[0]);plans[f'{date}/{m}/{ef}']={'explain':ex,'analyze':an}
save('clean_plans.json',plans)
save('oracle_candidates.json',{'title':'Exact global candidates followed by lifetime filtering','unit':'fraction','source':'uv run labs/temporal-ann/controls.py; first 10 held-out queries × 20 dates','rows':rows})
# Concrete silent failure with nearest missing neighbour.
r=next(r for r in runs if r['method']=='B1000' and r['ef']==80 and len(r['ids'])==10 and set(r['ids'])!=set(truth[r['date'],r['query']]['ids']))
t=truth[r['date'],r['query']];miss=[{'id':i,'distance':d} for i,d in zip(t['ids'],t['distances']) if i not in r['ids']]
save('silent_failure.json',{'approximate':r,'exact':t,'missing':miss})
