# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
from build import *
import statistics
c=connect('lab_infobox_time_machine');q=c.cursor();results=[];outputs={}
for file in sorted((BASE/'sql').glob('[a-e]-*.sql')):
    sql=file.read_text();times=[]
    for i in range(7):
        start=time.perf_counter();q.execute(sql);rows=q.fetchall();times.append((time.perf_counter()-start)*1000)
    results.append(dict(query=file.name,median_ms=statistics.median(times),runs_ms=times,result_rows=len(rows)))
    outputs[file.name]=[dict(zip([x[0] for x in q.description],r)) for r in rows[:10]]
    print(results[-1],flush=True)
    q.execute('EXPLAIN '+sql);outputs[file.name+'_explain']=[dict(zip([x[0] for x in q.description],r)) for r in q.fetchall()]
dump('query-timings.json','Seven sequential runs per showcase query','milliseconds',results,'uv run benchmark.py; client wall time including fetching results, shared server, no cache flush')
dump('query-samples.json','Showcase query samples and plans','rows',outputs,'uv run benchmark.py')
# Same article-as-of query, force index versus full scan without changing schema.
sql=(BASE/'sql/a-asof.sql').read_text();trials=[]
for hint in ('FORCE INDEX (article_asof)','IGNORE INDEX (article_asof)'):
    trial=sql.replace("WHERE page_id",hint+' WHERE page_id');times=[]
    for i in range(7):
        start=time.perf_counter();q.execute(trial);q.fetchall();times.append((time.perf_counter()-start)*1000)
    q.execute('EXPLAIN '+trial);plan=[dict(zip([x[0] for x in q.description],r)) for r in q.fetchall()]
    trials.append(dict(hint=hint,median_ms=statistics.median(times),runs_ms=times,explain=plan))
dump('index-experiment.json','Article as-of index versus full scan','milliseconds',trials,'uv run benchmark.py; identical SQL except FORCE/IGNORE INDEX; seven runs each')
c.close()
