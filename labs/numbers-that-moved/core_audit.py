# /// script
# dependencies = ["pymysql"]
# ///
"""Reproduce the two manually read map-fragment classification failures."""
import pymysql
from run import ROOT,dump
c=pymysql.connect(host='127.0.0.1',port=3310,user='wtt',password='wtt',database='wtt')
sql="SELECT HEX(hash),kind,text,wikitext FROM passage_text WHERE hash=UNHEX(%s)"
# Hash manifest is frozen from the initial top ranking; no full-table text scan.
import json
manifest=ROOT/'core-audit-manifest.json'
if not manifest.exists():
 rows=json.loads((ROOT/'data/unsettled.json').read_text())['rows']
 es=[f['events'][0] for f in rows if f['article']=='Kyllikki Saaren murha'][:2]
 manifest.write_text(json.dumps(es,ensure_ascii=False,indent=2))
else:es=json.loads(manifest.read_text())
rows=[]
with c.cursor() as q:
 for e in es:
  for side in ['old','new']:
   q.execute(sql,(e[side+'_hash'],));h,k,t,w=q.fetchone()
   rows.append(dict(article=e['article'],rev_id=e['rev_id'],side=side,hash=h,core_kind=k,text=t,wikitext=w,interpretation='Map coordinate fragment, not narrative prose. Period decimal was split by the Finnish-number parser. Excluded by the final surrounding-letter gate.'))
c.close();(ROOT/'sql/core-audit.sql').write_text(sql+';\n')
dump('core-data-audit.json','Two manually read coordinate positions labelled prose','paragraph fragment',rows)
print(json.dumps(rows,ensure_ascii=False,indent=2))
