# /// script
# dependencies = ["pymysql"]
# ///
"""Read before/after source text for the leading distinct removal revisions."""
from pathlib import Path
import json,datetime,difflib,time
import pymysql
P=Path(__file__).parent
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',database='wtt',cursorclass=pymysql.cursors.DictCursor)
r=json.loads((P/'data/retraction-index.json').read_text())['rows'];seen=set();out=[]
for x in r:
 if x['removing_rev'] in seen:continue
 if len(seen)>=8:break
 seen.add(x['removing_rev']);at=datetime.datetime.fromisoformat(x['removed_at']);texts=[];t=time.monotonic()
 for dt in [at-datetime.timedelta(microseconds=1),at]:
  s="SELECT title,text FROM revision FOR SYSTEM_TIME AS OF TIMESTAMP %s WHERE page_id=%s"
  with c.cursor() as q:
   exact=q.mogrify(s,(dt,x['page_id']));(P/'sql'/f"review-{x['removing_rev']}-{'before' if dt<at else 'after'}.sql").write_text(exact+';\n');q.execute(s,(dt,x['page_id']));v=q.fetchone();texts.append(v['text'] if v else '')
 diff='\n'.join(difflib.unified_diff(texts[0].splitlines(),texts[1].splitlines(),fromfile='before',tofile='after',n=2))
 out.append(dict(title=x['title'],removing_rev=x['removing_rev'],comment=x['removal_comment'],before_chars=len(texts[0]),after_chars=len(texts[1]),diff=diff,seconds=time.monotonic()-t))
 print(x['title'],len(diff),flush=True)
(P/'data/review-context.json').write_text(json.dumps(dict(title='Before/after diffs for leading distinct removal revisions',unit='wikitext',source='wtt.revision temporal snapshots; sql/review-*.sql',rows=out),ensure_ascii=False,indent=2));c.close()
