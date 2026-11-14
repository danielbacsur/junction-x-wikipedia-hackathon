# /// script
# dependencies = ["pymysql"]
# ///
from pathlib import Path
import json,time,pymysql
P=Path(__file__).parent;p=P/'data/retraction-index.json';obj=json.loads(p.read_text())
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',database='lab_paragraph_survival',cursorclass=pymysql.cursors.DictCursor)
with c.cursor() as q:
 items=' UNION ALL '.join(q.mogrify('SELECT %s page_id,UNHEX(%s) hash,CAST(%s AS DATETIME) removed_at',(r['page_id'],r['hash'],r['removed_at'])) for r in obj['rows'])
 s=f'''WITH candidates AS ({items}) SELECT c.page_id,HEX(c.hash) hash,
MAX(IF(r.a<=c.removed_at AND r.b>c.removed_at,1,0)) clean_text_present_at_removal,
MAX(IF(r.b>'2026-10-01 10:59:12',1,0)) clean_text_present_at_cutoff
FROM candidates c JOIN wtt.passage_text old ON old.hash=c.hash
JOIN raw r ON r.page_id=c.page_id AND ((r.a<=c.removed_at AND r.b>c.removed_at) OR r.b>'2026-10-01 10:59:12')
JOIN wtt.passage_text successor ON successor.hash=r.hash
WHERE LOCATE(BINARY old.text,BINARY successor.text)>0 GROUP BY c.page_id,c.hash'''
 (P/'sql/containment.sql').write_text(s+';\n');t=time.monotonic();q.execute(s);matches={(r['page_id'],r['hash']):r for r in q.fetchall()}
for r in obj['rows']:
 m=matches.get((r['page_id'],r['hash']),{})
 for k in ['clean_text_present_at_removal','clean_text_present_at_cutoff']:r[k]=int(m.get(k,0))
p.write_text(json.dumps(obj,ensure_ascii=False,indent=2))
summary=dict(candidates=len(obj['rows']),present_at_removal=sum(r['clean_text_present_at_removal'] for r in obj['rows']),present_at_cutoff=sum(r['clean_text_present_at_cutoff'] for r in obj['rows']),seconds=time.monotonic()-t)
(P/'data/containment.json').write_text(json.dumps(dict(title='Literal clean-text containment audit of the 30 slot-removal candidates',unit='counts',source='sql/containment.sql; binary case-sensitive substring, any successor block',rows=[summary]),indent=2));print(summary);c.close()
