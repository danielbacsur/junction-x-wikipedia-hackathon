# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
import duckdb,pymysql,json
from pathlib import Path
p=Path(__file__).resolve().parent
d=duckdb.connect(config={'threads':2,'memory_limit':'512MB','temp_directory':str(p/'cache/tmp')})
print(d.execute("DESCRIBE SELECT * FROM 'data/m/*.parquet'").fetchall())
print(d.execute("SELECT count(*), count(distinct page_id), min(timestamp),max(timestamp) FROM 'data/m/*.parquet'").fetchall())
c=pymysql.connect(host='127.0.0.1',port=3310,user='wtt',password='wtt',database='wtt'); q=c.cursor();q.execute('SHOW CREATE TABLE edit');print(q.fetchall());q.execute('SELECT COUNT(*),COUNT(DISTINCT page_id),SUM(reverted_by IS NOT NULL) FROM edit');print(q.fetchall());c.close()
from collections import Counter
import re
counts=Counter()
for f in sorted(Path('data/m').glob('*.parquet')):
    cur=d.execute(f"SELECT text FROM '{f}'")
    while batch:=cur.fetchmany(64):
        for (txt,) in batch:
            counts.update(n.strip().lower() for n in re.findall(r'\{\{\s*([^{}|\n]+)\s*[|]',txt or ''))
    print(f.name,flush=True)
r=counts.most_common()
(p/'cache/template-census.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print(r[:200])
