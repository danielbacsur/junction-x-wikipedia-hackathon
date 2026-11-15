# /// script
# dependencies = ["pymysql"]
# ///
"""Prepare, print and export a fixed manual audit. Labels live in audit-labels.json."""
import json,re,pymysql
from run import ROOT,dump
src=ROOT/'cache/audit-input.json'
if not src.exists():
 rows=json.loads((ROOT/'data/unsettled.json').read_text())['rows'][:20]
 conn=pymysql.connect(host='127.0.0.1',port=3310,user='wtt',password='wtt',database='wtt',charset='utf8mb4')
 out=[]
 sql='SELECT wikitext FROM passage_text WHERE hash=UNHEX(%s)'
 (ROOT/'sql/audit.sql').write_text(sql+';\n')
 with conn.cursor() as q:
  for rank,f in enumerate(rows,1):
   e=dict(f['events'][0]);e['rank']=rank
   for side in ['old','new']:
    q.execute(sql,(e[side+'_hash'],));wiki=q.fetchone()[0];e[side+'_wikitext']=wiki
   out.append(e)
 conn.close();src.write_text(json.dumps(out,ensure_ascii=False,indent=2))
rows=json.loads(src.read_text())
labels=ROOT/'audit-labels.json'
if labels.exists():
 notes=json.loads(labels.read_text())
 for r in rows:r.update(notes[str(r['rank'])])
 dump('manual-audit.json','Research-agent close reading of earliest strict change in top 20 figures','audited figure',rows)
for r in rows:
 print('\nRANK',r['rank'],r['article'],r['old'],'→',r['new'],'rev',r['rev_id'])
 print('BEFORE:',r['before']);print('AFTER:',r['after']);print('OLD SUMMARY:',r['old_comment']);print('NEW SUMMARY:',r['comment'])
 print('OLD WIKI:',r['old_wikitext']);print('NEW WIKI:',r['new_wikitext'])
 if 'classification' in r:print('CLASS:',r['classification'],r['reason'])
