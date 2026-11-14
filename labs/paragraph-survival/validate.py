# /// script
# dependencies = ["pymysql", "numpy"]
# ///
from pathlib import Path
import pymysql,numpy as np,json,time
P=Path(__file__).parent
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',database='lab_paragraph_survival',cursorclass=pymysql.cursors.DictCursor)
results=[]
def q(name,s):
 (P/'sql'/f'validate-{name}.sql').write_text(s+';\n');t=time.monotonic()
 with c.cursor() as cur:cur.execute(s);r=cur.fetchall()
 results.append(dict(check=name,seconds=time.monotonic()-t));return r
for ep in ['wording','wording_raw','slot']:
 r=q('km-'+ep,f"SELECT duration,exits,deaths,survival FROM km WHERE endpoint='{ep}' AND dimension='overall' ORDER BY duration")
 exits=np.array([x['exits'] for x in r],float);deaths=np.array([x['deaths'] for x in r],float)
 risk=np.cumsum(exits[::-1])[::-1];expected=np.cumprod(1-deaths/risk)
 error=float(np.max(np.abs(expected-np.array([x['survival'] for x in r],float))))
 assert error<1e-10,error
 results[-1].update(max_absolute_error=error,n=int(sum(exits)))
r=q('duration-conservation',"SELECT (SELECT SUM(TIMESTAMPDIFF(MICROSECOND,a,b)) FROM raw WHERE b>a) raw_us,(SELECT SUM(TIMESTAMPDIFF(MICROSECOND,a,b)) FROM stays) stay_us")[0]
assert r['raw_us']==r['stay_us'];results[-1]['equal']=True
r=q('overlap',"SELECT COUNT(*) n FROM (SELECT a,LAG(b) OVER(PARTITION BY page_id,hash,dup ORDER BY a,b) prev_b FROM stays) z WHERE prev_b>=a")[0]
assert r['n']==0;results[-1]['violations']=r['n']
# Independent interval merging on a deterministic sample of keys.
r=q('merge-sample',"SELECT r.page_id,HEX(r.hash) h,r.dup,r.a,r.b FROM raw r JOIN (SELECT page_id,hash,dup FROM stays GROUP BY page_id,hash,dup ORDER BY page_id,hash,dup LIMIT 200) k USING(page_id,hash,dup) WHERE r.b>r.a ORDER BY page_id,hash,dup,a,b")
merged=[]
for x in r:
 key=(x['page_id'],x['h'],x['dup'])
 if merged and merged[-1][:3]==key and merged[-1][4]==x['a']:merged[-1]=(*key,merged[-1][3],x['b'])
 else:merged.append((*key,x['a'],x['b']))
s=q('merge-expected',"SELECT s.page_id,HEX(s.hash) h,s.dup,s.a,s.b FROM stays s JOIN (SELECT page_id,hash,dup FROM stays GROUP BY page_id,hash,dup ORDER BY page_id,hash,dup LIMIT 200) k USING(page_id,hash,dup) ORDER BY page_id,hash,dup,a,b")
assert merged==[(x['page_id'],x['h'],x['dup'],x['a'],x['b']) for x in s]
results[-1].update(keys=200,merged_stays=len(merged),equal=True)
for p in (P/'data').glob('*.json'):
 obj=json.loads(p.read_text());assert all(k in obj for k in ['title','unit','source','rows']),p
(P/'data/validation.json').write_text(json.dumps(dict(title='Independent numerical and interval checks',unit='checks',source='validate.py and sql/validate-*.sql',rows=results),indent=2));print(json.dumps(results,indent=2));c.close()
