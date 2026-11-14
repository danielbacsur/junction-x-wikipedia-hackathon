# /// script
# dependencies = ["pymysql"]
# ///
import pymysql,json
c=pymysql.connect(host='127.0.0.1',port=3310,user='wtt',password='wtt',database='wtt',cursorclass=pymysql.cursors.DictCursor)
with c.cursor() as q:
 for s in ['SHOW CREATE TABLE edit','SHOW CREATE TABLE article',"SELECT COUNT(*) n,COUNT(DISTINCT page_id) pages,MIN(saved_at) first,MAX(saved_at) last,SUM(restores IS NOT NULL) reverts,SUM(undone_by IS NOT NULL) undone FROM edit","SELECT editor,COUNT(*) n,MIN(saved_at) first,MAX(saved_at) last FROM edit GROUP BY editor"]:
  q.execute(s);print(s);print(json.dumps(q.fetchall(),default=str))
