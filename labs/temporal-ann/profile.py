# /// script
# dependencies = ["pymysql", "numpy"]
# ///
import pymysql,numpy as np
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt')
q=c.cursor(); q.execute("SELECT e.page_id,COUNT(*) n FROM wtt.edit e JOIN wtt.article_vector v ON v.page_id=e.page_id AND v.lang='fi' GROUP BY e.page_id ORDER BY n DESC,e.page_id")
r=q.fetchall(); print('pages',len(r),'total',sum(x[1] for x in r)); print('top30',sum(x[1] for x in r[:30]));
for cap in [50,100,150,200]:
 a=[x for x in r[30:] if x[1]<=cap]; print(cap,len(a),sum(x[1] for x in a), 'top4000',sum(x[1] for x in a[:4000]))
