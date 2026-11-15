# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
from build import *
p.configure();d=duckdb.connect(config={'threads':1,'memory_limit':'512MB'});q=d.execute(f"SELECT title,rev_id,text FROM '{ROOT}/data/m/versions-01.parquet'");n=0
while batch:=q.fetchmany(32):
 for title,rev,txt in batch:
  for name,raw,broken in p.boxes(txt or ''):
   if broken:
    print(title,rev,name,raw[:300],raw[-100:]);print('TOKENS',[(m.group()[:40],m.start()) for m in p.TOKEN.finditer(raw)][:40]);n+=1
    if n==3:raise SystemExit
