# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
from build import *
def memory_gate():
    s=subprocess.check_output(['docker','stats','--no-stream','--format','{{.MemUsage}}','wikipedia-through-time-mariadb-1'],text=True).strip()
    print('MariaDB memory:',s,flush=True)
    m=re.match(r'([\d.]+)(\w+)',s)
    gib=float(m[1])*({'GiB':1,'MiB':1/1024,'GB':1e9/2**30,'MB':1e6/2**30}.get(m[2],1))
    if gib>6.5:raise SystemExit('Memory above 6.5 GiB: wait and rerun. No load started.')
memory_gate()
c=connect(user='root');q=c.cursor();q.execute('CREATE DATABASE IF NOT EXISTS lab_infobox_time_machine');q.execute("GRANT ALL ON lab_infobox_time_machine.* TO 'wtt'@'%'");c.close()
c=connect('lab_infobox_time_machine');q=c.cursor();q.execute('DROP TABLE IF EXISTS statement');q.execute((BASE/'sql/schema.sql').read_text());q.execute('SET SESSION system_versioning_insert_history=1')
start=time.monotonic();batches={True:[],False:[]};count=0
cols='id,page_id,title,template,slot,field,raw_value,value,unresolved,fact_date,fact_number,precision,rev_id,editor,editor_kind,comment,versions,row_start'.split(',')
def flush():
    for historical,rows in batches.items():
        if rows:
            cs=cols+(['row_end'] if historical else [])
            q.executemany('INSERT INTO statement ('+','.join('`'+s+'`' for s in cs)+') VALUES ('+','.join(['%s']*len(cs))+')',rows);rows.clear()
    c.commit()
for line in gzip.open(BASE/'cache/statements.jsonl.gz','rt'):
    r=json.loads(line);historical=r['row_end'] is not None;batches[historical].append([r[k] for k in cols]+([r['row_end']] if historical else []));count+=1
    if count%500==0:flush()
    if count%25000==0:print(count,round(time.monotonic()-start,2),flush=True)
flush();seconds=time.monotonic()-start
q.execute('ANALYZE TABLE statement');q.fetchall()
q.execute("SELECT table_rows,data_length,index_length FROM information_schema.tables WHERE table_schema='lab_infobox_time_machine' AND table_name='statement'");estimate=q.fetchone()
q.execute('SELECT count(*) FROM statement FOR SYSTEM_TIME ALL');allrows=q.fetchone()[0];q.execute('SELECT count(*) FROM statement');current=q.fetchone()[0]
dump('load.json','MariaDB historical load','rows, bytes, seconds',[dict(rows=allrows,current_rows=current,load_seconds=seconds,estimated_rows=estimate[0],data_bytes=estimate[1],index_bytes=estimate[2])],'uv run load.py; information_schema.tables after ANALYZE')
q.execute('SHOW CREATE TABLE statement');(BASE/'cache/show-create.sql').write_text(q.fetchone()[1]);c.close();print('done',allrows,seconds,estimate,flush=True)
