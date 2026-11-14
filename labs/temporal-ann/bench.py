# /// script
# requires-python = ">=3.11,<3.15"
# dependencies = ["pymysql==1.1.2", "numpy>=2.2"]
# ///
"""One connection, sequential queries. Run build, benchmark, summarize separately."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import argparse, datetime as dt, json, time, pathlib, random
import numpy as np
import pymysql
ROOT=pathlib.Path(__file__).resolve().parent
DATA=ROOT/'data'; DATA.mkdir(exist_ok=True)
DATES=[f'{y}-06-01 00:00:00' for y in list(range(2006,2025))+[2026]]
def connect():
 return pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',autocommit=True, binary_prefix=True,read_timeout=1800)
def save(name,x): (DATA/name).write_text(json.dumps(x,indent=2,default=str)+'\n')
def build():
 if (DATA/'runs.jsonl').exists():raise RuntimeError('Archive data/ before rebuilding; recorded runs belong to the previous corpus.')
 c=connect(); q=c.cursor(); q.execute('CREATE DATABASE IF NOT EXISTS lab_temporal_ann');q.execute('USE lab_temporal_ann')
 q.execute("SELECT e.page_id,COUNT(*) n FROM wtt.edit e JOIN wtt.article_vector v ON v.page_id=e.page_id AND v.lang='fi' GROUP BY e.page_id ORDER BY n DESC,e.page_id")
 counts=q.fetchall(); pages=[p for p,n in counts[:30]]+[p for p,n in counts[30:] if n<=100][:4000]; selected=set(pages)
 q.execute("SELECT page_id,embedding FROM wtt.article_vector WHERE lang='fi' ORDER BY page_id"); vectors=dict(q.fetchall())
 rng=np.random.default_rng(78231)
 held=rng.choice(sorted(set(vectors)-selected),50,replace=False).tolist()
 queries=np.stack([np.frombuffer(vectors[p],dtype='<f4') for p in held]);queries+=rng.normal(0,.001,queries.shape).astype('f4');queries/=np.linalg.norm(queries,axis=1,keepdims=True)
 np.savez(DATA/'queries.npz',vectors=queries,pages=held)
 for t in ['a','b','life']: q.execute(f'DROP TABLE IF EXISTS {t}')
 period='row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START, row_end TIMESTAMP(6) GENERATED ALWAYS AS ROW END, PERIOD FOR SYSTEM_TIME(row_start,row_end)'
 q.execute(f'CREATE TABLE a (id INT PRIMARY KEY,page_id INT,seq INT,embedding VECTOR(1024) NOT NULL,{period}) WITH SYSTEM VERSIONING')
 q.execute('CREATE TABLE b (id INT PRIMARY KEY,page_id INT,seq INT,embedding VECTOR(1024) NOT NULL)')
 q.execute(f'CREATE TABLE life (id INT PRIMARY KEY,page_id INT,seq INT,{period},KEY alive(row_end,row_start)) WITH SYSTEM VERSIONING')
 q.execute('SET system_versioning_insert_history=1');q.execute("SET time_zone='+00:00'")
 start=time.perf_counter(); ident=0; undone=0; manifest=[]
 for ix,p in enumerate(pages):
  q.execute('SELECT seq,saved_at,ended_at,undone_by FROM wtt.edit WHERE page_id=%s ORDER BY seq DESC',(p,)); edits=q.fetchall()
  v=np.frombuffer(vectors[p],dtype='<f4').copy();v/=np.linalg.norm(v)
  ah=[];ac=[];bh=[];lh=[];lc=[]
  for j,(seq,s,e,u) in enumerate(edits):
   if j: v+=rng.normal(0,.0006,1024).astype('f4');v/=np.linalg.norm(v)
   ident+=1; raw=v.astype('<f4').tobytes(); bh.append((ident,p,seq,raw)); undone+=u is not None
   if e is None: ac.append((ident,p,seq,raw,s));lc.append((ident,p,seq,s))
   else: ah.append((ident,p,seq,raw,s,e));lh.append((ident,p,seq,s,e))
  for sql,rows in [('INSERT INTO a(id,page_id,seq,embedding,row_start,row_end) VALUES(%s,%s,%s,%s,%s,%s)',ah),('INSERT INTO a(id,page_id,seq,embedding,row_start) VALUES(%s,%s,%s,%s,%s)',ac),('INSERT INTO b VALUES(%s,%s,%s,%s)',bh),('INSERT INTO life(id,page_id,seq,row_start,row_end) VALUES(%s,%s,%s,%s,%s)',lh),('INSERT INTO life(id,page_id,seq,row_start) VALUES(%s,%s,%s,%s)',lc)]:
   if rows:q.executemany(sql,rows)
  manifest.append({'page_id':p,'versions':len(edits)})
  if ix%100==0:print('insert',ix,ident,round(time.perf_counter()-start,1),flush=True)
 meta={'seed':78231,'rows':ident,'pages':len(pages),'heldout_queries':50,'undone_versions_retained':undone,'insert_seconds':time.perf_counter()-start,'dates':DATES,'manifest':manifest,'build_seconds':{}}
 save('corpus.json',meta)
 for t in ['a','b']:
  s=time.perf_counter();print('index start',t,flush=True);q.execute(f'ALTER TABLE {t} ADD VECTOR INDEX embedding(embedding) M=16 DISTANCE=cosine');meta['build_seconds'][t]=time.perf_counter()-s;save('corpus.json',meta);print('index done',t,meta['build_seconds'][t],flush=True)
 q.execute('ANALYZE TABLE a,b,life');print(q.fetchall(),flush=True)
 q.execute("SELECT TABLE_NAME,TABLE_ROWS,DATA_LENGTH,INDEX_LENGTH,DATA_FREE FROM information_schema.TABLES WHERE TABLE_SCHEMA='lab_temporal_ann'");meta['sizes']=[dict(zip(['table','estimated_rows','data_bytes','index_bytes','free_bytes'],r)) for r in q.fetchall()]
 q.execute("SELECT NAME,FILE_SIZE,ALLOCATED_SIZE FROM information_schema.INNODB_SYS_TABLESPACES WHERE NAME LIKE 'lab_temporal_ann/%'");meta['tablespaces']=[dict(zip(['name','file_bytes','allocated_bytes'],r)) for r in q.fetchall()]
 save('corpus.json',meta)

def sqls(date,raw):
 return {
 'A':('SELECT id,VEC_DISTANCE_COSINE(embedding,%s) d FROM a FOR SYSTEM_TIME AS OF TIMESTAMP %s ORDER BY d LIMIT 10',(raw,date)),
 'C':('SELECT b.id,VEC_DISTANCE_COSINE(b.embedding,%s) d FROM life FOR SYSTEM_TIME AS OF TIMESTAMP %s AS l STRAIGHT_JOIN b IGNORE INDEX(embedding) ON b.id=l.id ORDER BY d LIMIT 10',(raw,date)),
 **{f'B{k}':(f'SELECT cand.id,cand.d FROM (SELECT id,VEC_DISTANCE_COSINE(embedding,%s) d FROM b ORDER BY d LIMIT {k}) AS cand JOIN life FOR SYSTEM_TIME AS OF TIMESTAMP %s AS l ON l.id=cand.id ORDER BY cand.d LIMIT 10',(raw,date)) for k in [50,200,1000]}}
def status(q):
 q.execute("SHOW SESSION STATUS LIKE 'Handler_read%'");return {k:int(v) for k,v in q.fetchall()}
def plan_json(s):
 try:return json.loads(s)
 except json.JSONDecodeError:return {"raw_mariadb_output":s}
def benchmark():
 c=connect();q=c.cursor();q.execute('USE lab_temporal_ann');q.execute("SET time_zone='+00:00'")
 z=np.load(DATA/'queries.npz'); queries=z['vectors'];out=DATA/'runs.jsonl'
 done=set()
 if out.exists():
  for line in out.read_text().splitlines():
   r=json.loads(line);done.add((r['date'],r['query'],r['method'],r['ef']))
 plans=json.loads((DATA/'plans.json').read_text()) if (DATA/'plans.json').exists() else {};rng=random.Random(91)
 with out.open('a') as f:
  for date in DATES:
   q.execute('SELECT COUNT(*) FROM life FOR SYSTEM_TIME AS OF TIMESTAMP %s',(date,));alive=q.fetchone()[0]
   for qi,v in enumerate(queries):
    stmts=sqls(date,v.astype('<f4').tobytes())
    jobs=[('C',80)]+[(m,e) for e in [20,80,200,1000] for m in ['A','B50','B200','B1000']];rng.shuffle(jobs)
    for method,ef in jobs:
     if (date,qi,method,ef) in done:continue
     q.execute(f'SET mhnsw_ef_search={ef}')
     sql,params=stmts[method];before=status(q);start=time.perf_counter();q.execute(sql,params);res=q.fetchall();ms=(time.perf_counter()-start)*1000;after=status(q)
     r={'date':date,'query':qi,'method':method,'ef':ef,'alive':alive,'ms':ms,'ids':[x[0] for x in res],'distances':[x[1] for x in res],'handler':{k:after[k]-before[k] for k in before}}
     f.write(json.dumps(r)+'\n');f.flush()
     if qi==0 and date in [DATES[0],DATES[3],DATES[-1]]:
      key=f'{date}/{method}/{ef}';q.execute('EXPLAIN FORMAT=JSON '+sql,params);ex=plan_json(q.fetchone()[0]);q.execute('ANALYZE FORMAT=JSON '+sql,params);an=plan_json(q.fetchone()[0]);plans[key]={'explain':ex,'analyze':an};save('plans.json',plans)
    if qi%10==0:print('bench',date,qi,flush=True)
   print('date complete',date,flush=True)
 summarize()
def summarize():
 runs=[json.loads(s) for s in (DATA/'runs.jsonl').read_text().splitlines()];truth={(r['date'],r['query']):set(r['ids']) for r in runs if r['method']=='C'}
 groups={}
 for r in runs:
  t=truth.get((r['date'],r['query']))
  if not t:continue
  r['recall']=len(set(r['ids'])&t)/len(t);r['under']=len(r['ids'])<len(t);r['wrong_full']=not r['under'] and set(r['ids'])!=t
  for d in [r['date'],'overall']:
   groups.setdefault((d,r['method'],r['ef']),[]).append(r)
 recall=[];latency=[]
 for (d,m,e),rs in sorted(groups.items()):
  base={'date':d,'method':m,'ef_search':e,'queries':len(rs)}
  recall.append({**base,'recall_at_10':float(np.mean([r['recall'] for r in rs])),'underfilled_share':float(np.mean([r['under'] for r in rs])),'full_but_wrong_share':float(np.mean([r['wrong_full'] for r in rs])),'alive':rs[0]['alive'] if d!='overall' else None})
  latency.append({**base,'median_ms':float(np.median([r['ms'] for r in rs])),'p95_ms':float(np.percentile([r['ms'] for r in rs],95)),'median_handler_reads':float(np.median([sum(r['handler'].values()) for r in rs])),'handler_medians':{k:float(np.median([r['handler'][k] for r in rs])) for k in rs[0]['handler']}})
 for name,rows,unit in [('recall',recall,'fraction'),('latency',latency,'milliseconds; handler operations')]:save(name+'.json',{'title':'Temporal ANN '+name,'unit':unit,'source':'uv run labs/temporal-ann/bench.py benchmark; data/runs.jsonl','rows':rows})
 print(json.dumps([r for r in recall if r['date']=='overall'],indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('action',choices=['build','benchmark','summarize']);a=p.parse_args();globals()[a.action]()
