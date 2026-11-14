# /// script
# requires-python = ">=3.11,<3.15"
# dependencies = ["pymysql==1.1.2", "numpy>=2.2"]
# ///
from bench import *
c=connect();q=c.cursor();q.execute('USE lab_temporal_ann');q.execute("SET time_zone='+00:00'");out={}
for name,sql in {
 'a_rows':'SELECT COUNT(*) FROM a FOR SYSTEM_TIME ALL',
 'b_rows':'SELECT COUNT(*) FROM b',
 'life_rows':'SELECT COUNT(*) FROM life FOR SYSTEM_TIME ALL',
 'lifetime_mismatch':"SELECT COUNT(*) FROM life FOR SYSTEM_TIME ALL l JOIN wtt.edit e ON e.page_id=l.page_id AND e.seq=l.seq WHERE l.row_start<>e.saved_at OR (e.ended_at IS NOT NULL AND l.row_end<>e.ended_at)",
 'vector_mismatch':'SELECT COUNT(*) FROM a FOR SYSTEM_TIME ALL a JOIN b ON b.id=a.id WHERE a.embedding<>b.embedding',
 'version':'SELECT VERSION()',
 'settings':"SHOW VARIABLES WHERE Variable_name IN ('innodb_buffer_pool_size','mhnsw_ef_search','mhnsw_max_cache_size','mhnsw_default_m','version_compile_machine')",
}.items():
 q.execute(sql);out[name]=q.fetchall();print(name,out[name],flush=True)
raw=np.load(DATA/'queries.npz')['vectors'][0].tobytes();out['exact_checks']=[]
for date in [DATES[0],DATES[3],DATES[-1]]:
 sql,args=sqls(date,raw)['C'];q.execute(sql,args);ref=q.fetchall()
 q.execute('SELECT id,VEC_DISTANCE_COSINE(embedding,%s) d FROM a FOR SYSTEM_TIME AS OF TIMESTAMP %s IGNORE INDEX(embedding) ORDER BY d LIMIT 10',(raw,date));direct=q.fetchall()
 out['exact_checks'].append({'date':date,'same_ids':set(r[0] for r in ref)==set(r[0] for r in direct),'ids':[r[0] for r in ref]})
save('validation.json',out)
