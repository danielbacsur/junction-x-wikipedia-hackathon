# /// script
# dependencies = ["pymysql"]
# ///
import pymysql
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt')
with c.cursor() as q:
 q.execute('SHOW FULL PROCESSLIST')
 for r in q.fetchall():print(str(r)[:1800])
