# /// script
# dependencies = ["pymysql", "numpy"]
# ///
import pymysql
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',autocommit=True)
with c.cursor() as q:
 for sql in ['SELECT VERSION()', 'SHOW CREATE TABLE wtt.article_vector', 'SHOW CREATE TABLE wtt.edit', "SELECT COUNT(*),COUNT(DISTINCT page_id) FROM wtt.article_vector WHERE lang='fi'", "SELECT e.page_id,COUNT(*) n,MIN(saved_at),MAX(saved_at) FROM wtt.edit e JOIN wtt.article_vector v ON v.page_id=e.page_id AND v.lang='fi' GROUP BY e.page_id ORDER BY n DESC LIMIT 30"]:
  q.execute(sql); print(sql, q.fetchall(),flush=True)
