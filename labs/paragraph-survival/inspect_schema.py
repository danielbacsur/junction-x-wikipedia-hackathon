# /// script
# dependencies = ["pymysql"]
# ///
import pymysql,json
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',database='wtt',cursorclass=pymysql.cursors.DictCursor)
for s in ['SHOW CREATE TABLE edit','SHOW CREATE TABLE passage','SELECT MIN(row_start) first,MAX(row_start) last,COUNT(*) n FROM passage FOR SYSTEM_TIME ALL','SELECT kind,COUNT(*) n FROM passage_text GROUP BY kind']:
 with c.cursor() as q:
  q.execute(s);print(s);print(json.dumps(q.fetchall(),default=str),flush=True)
