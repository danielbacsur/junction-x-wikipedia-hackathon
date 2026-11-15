# /// script
# dependencies = ["pymysql"]
# ///
"""Store only lab summary counts in own database, never core tables."""
import json,pymysql
from run import ROOT
setup="CREATE DATABASE IF NOT EXISTS lab_numbers_that_moved"
grant="GRANT ALL PRIVILEGES ON lab_numbers_that_moved.* TO 'wtt'@'%'"
(ROOT/'sql/database.sql').write_text(setup+';\n'+grant+';\n')
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',autocommit=True)
with c.cursor() as q:q.execute(setup);q.execute(grant)
c.close()
c=pymysql.connect(host='127.0.0.1',port=3310,user='wtt',password='wtt',database='lab_numbers_that_moved',autocommit=True)
statements=['CREATE TABLE IF NOT EXISTS summary (metric VARCHAR(100) PRIMARY KEY, value BIGINT NOT NULL)','DELETE FROM summary','INSERT INTO summary (metric,value) VALUES (%s,%s)']
(ROOT/'sql/summary-store.sql').write_text(';\n'.join(statements)+';\n')
with c.cursor() as q:
 q.execute(statements[0]);q.execute(statements[1]);q.executemany(statements[2],[(r['metric'],r['value']) for r in json.loads((ROOT/'data/summary.json').read_text())['rows']])
c.close()
print('Stored summary in lab_numbers_that_moved.summary')
