# /// script
# requires-python = ">=3.11,<3.15"
# dependencies = ["pymysql==1.1.2", "numpy>=2.2"]
# ///
from bench import *
c=connect();q=c.cursor();q.execute('USE lab_temporal_ann');z=np.load(DATA/'queries.npz')['vectors'];rows=[]
for qi in range(10):
 raw=z[qi].tobytes();q.execute('SELECT id FROM b IGNORE INDEX(embedding) ORDER BY VEC_DISTANCE_COSINE(embedding,%s) LIMIT 10',(raw,));truth={r[0] for r in q.fetchall()}
 for ef in [20,80,200,1000]:
  q.execute(f'SET mhnsw_ef_search={ef}')
  for table in ['a FOR SYSTEM_TIME ALL','b']:
   q.execute(f'SELECT id FROM {table} ORDER BY VEC_DISTANCE_COSINE(embedding,%s) LIMIT 10',(raw,));ids=[r[0] for r in q.fetchall()];rows.append({'query':qi,'table':table,'ef_search':ef,'recall':len(set(ids)&truth)/10,'count':len(ids)})
 print(qi,flush=True)
save('unfiltered.json',{'title':'Unfiltered ANN recall control','unit':'fraction','source':'uv run labs/temporal-ann/unfiltered.py; first 10 held-out queries','rows':rows})
