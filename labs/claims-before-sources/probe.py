# /// script
# dependencies = ["pymysql"]
# ///
import pymysql
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',database='wtt',cursorclass=pymysql.cursors.DictCursor)
with c.cursor() as q:
 for sql in ['SHOW CREATE TABLE passage','SHOW CREATE TABLE passage_text','SHOW CREATE TABLE edit','SELECT hash,wikitext FROM passage_text WHERE kind="prose" AND chars>=80 LIMIT 15']:
  q.execute(sql)
  print(sql, q.fetchall())
