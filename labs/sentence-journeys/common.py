# /// script
# dependencies = ["pymysql"]
# ///
import pymysql,json,time,datetime,decimal,pathlib,re,sys
P=pathlib.Path(__file__).parent
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',charset='utf8mb4',autocommit=True,cursorclass=pymysql.cursors.DictCursor)
timings=json.loads((P/'data/timings.json').read_text())['rows'] if (P/'data/timings.json').exists() else []
def default(x):
 if isinstance(x,(datetime.datetime,datetime.date)):return x.isoformat()
 if isinstance(x,decimal.Decimal):return float(x)
 if isinstance(x,bytes):return x.hex()
 raise TypeError(type(x))
def save(name,title,unit,rows,source=None):
 (P/'data'/f'{name}.json').write_text(json.dumps(dict(title=title,unit=unit,source=source or f'sql/{name}.sql',rows=rows),default=default,ensure_ascii=False,indent=2)+'\n')
def sql(name,s):
 (P/'sql'/f'{name}.sql').write_text(s.strip()+';\n')
 t=time.monotonic()
 with c.cursor() as q:q.execute(s); r=q.fetchall() if q.description else []
 timings.append(dict(query=name,seconds=round(time.monotonic()-t,4),rows=len(r)))
 save('timings','Sequential SQL wall times','seconds',timings,'run.py')
 print(name,timings[-1],flush=True)
 return r
def out(name,s,title=None,unit='wordings'):
 r=sql(name,s);save(name,title or name,unit,r);return r
