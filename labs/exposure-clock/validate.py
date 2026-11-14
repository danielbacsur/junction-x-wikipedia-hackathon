# /// script
# dependencies = ["pymysql", "numpy"]
# ///
from pathlib import Path
import json,numpy as np,pymysql,time,datetime
P=Path(__file__).resolve().parent;D=P/'data'
def read(n):return json.loads((D/(n+'.json')).read_text())['rows']
def save(n,title,unit,rows): (D/(n+'.json')).write_text(json.dumps(dict(title=title,unit=unit,source='validate.py; SQL results from run.py',rows=rows),indent=2)+'\n')
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',cursorclass=pymysql.cursors.DictCursor)
s='SELECT page_id,saved_at,revert_at,YEAR(saved_at) year,exposure_seconds FROM lab_exposure_clock.fact ORDER BY page_id,saved_at,seq'
(P/'sql'/'quantile-crosscheck.sql').write_text(s+';\n')
started=time.perf_counter()
with c.cursor() as q:q.execute(s);raw=q.fetchall()
query_seconds=time.perf_counter()-started
c.close()
for row in read('exposure-by-year'):
 a=[x['exposure_seconds'] for x in raw if x['year']==row['year']]
 for p,k in [(.5,'median_seconds'),(.75,'p75_seconds'),(.9,'p90_seconds'),(.99,'p99_seconds')]:
  assert np.isclose(np.quantile(a,p),row[k],rtol=1e-12,atol=1e-5),(row['year'],k,np.quantile(a,p),row[k])
# Independent interval-union check, including calendar-year allocation.
merged=[];current=None
for r in raw:
 if current is None or current[0]!=r['page_id'] or r['saved_at']>current[2]:
  if current:merged.append(current)
  current=[r['page_id'],r['saved_at'],r['revert_at']]
 else:current[2]=max(current[2],r['revert_at'])
if current:merged.append(current)
by_year={}
for page,start,end in merged:
 for year in range(start.year,end.year+1):
  seconds=max(0,(min(end,datetime.datetime(year+1,1,1))-max(start,datetime.datetime(year,1,1))).total_seconds())
  by_year[year]=by_year.get(year,0)+seconds/3600
for r in read('exposure-union-by-year'):
 assert abs(by_year.get(r['year'],0)-r['article_hours'])<.001,(r,by_year.get(r['year']))
obs=read('comparison-observations');pages=sorted(set(r['page_id'] for r in obs));ix={p:i for i,p in enumerate(pages)}
counts=np.zeros((len(pages),2,2));lags=[[],[]];lagpages=[[],[]]
for r in obs:
 i=ix[r['page_id']];j=int(r['period']=='after');counts[i,j,0]+=1;counts[i,j,1]+=r['undone_7d']
 if r['lag_seconds'] is not None:lags[j].append(r['lag_seconds']);lagpages[j].append(i)
order=[np.argsort(a) for a in lags];lags=[np.array(lags[j])[order[j]] for j in range(2)];lagpages=[np.array(lagpages[j])[order[j]] for j in range(2)]
rng=np.random.default_rng(20261114);rate_diffs=[];median_diffs=[]
for _ in range(2000):
 w=rng.multinomial(len(pages),np.full(len(pages),1/len(pages)));tot=np.einsum('i,ijk->jk',w,counts)
 rate_diffs.append(100*(tot[1,1]/tot[1,0]-tot[0,1]/tot[0,0]))
 med=[]
 for j in range(2):
  weights=w[lagpages[j]];cum=np.cumsum(weights);n=int(cum[-1]);med.append((lags[j][np.searchsorted(cum,(n-1)//2+1)]+lags[j][np.searchsorted(cum,n//2+1)])/2)
 median_diffs.append(med[1]-med[0])
results=[dict(metric='seven_day_undo_share_difference_percentage_points',estimate=100*(counts[:,1,1].sum()/counts[:,1,0].sum()-counts[:,0,1].sum()/counts[:,0,0].sum()),lower=float(np.quantile(rate_diffs,.025)),upper=float(np.quantile(rate_diffs,.975)),articles=len(pages),replicates=2000,seed=20261114),dict(metric='conditional_median_difference_seconds',estimate=float(np.median(lags[1])-np.median(lags[0])),lower=float(np.quantile(median_diffs,.025)),upper=float(np.quantile(median_diffs,.975)),articles=len(pages),replicates=2000,seed=20261114)]
save('uncertainty','Article-cluster bootstrap 95% percentile intervals; descriptive, not causal','percentage points; seconds',results)
save('validation','Independent NumPy quantile cross-check','checks',[dict(years_checked=len(read('exposure-by-year')),percentiles_per_year=4,matched=True,union_years_checked=len(by_year),union_matched=True,sql_read_seconds=round(query_seconds,4))])
print(json.dumps(results,indent=2))
