# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
from build import *
c=connect('lab_infobox_time_machine');q=c.cursor();checks={}
queries={
 'lifetimes':'SELECT COUNT(*) FROM statement FOR SYSTEM_TIME ALL',
 'observations':'SELECT SUM(versions) FROM statement FOR SYSTEM_TIME ALL',
 'bad_periods':'SELECT COUNT(*) FROM statement FOR SYSTEM_TIME ALL WHERE row_start>=row_end',
 'reverted_or_missing_origin':'''SELECT COUNT(*) FROM statement FOR SYSTEM_TIME ALL s LEFT JOIN wtt.edit e ON e.rev_id=s.rev_id WHERE e.rev_id IS NULL OR e.reverted_by IS NOT NULL''',
 'wrong_origin_page_or_time':'''SELECT COUNT(*) FROM statement FOR SYSTEM_TIME ALL s JOIN wtt.edit e ON e.rev_id=s.rev_id WHERE s.page_id<>e.page_id OR s.row_start<>e.saved_at''',
 'overlapping_field_periods':'''WITH h AS (SELECT page_id,template,slot,field,row_start,LAG(row_end) OVER (PARTITION BY page_id,template,slot,field ORDER BY row_start) previous_end FROM statement FOR SYSTEM_TIME ALL) SELECT COUNT(*) FROM h WHERE previous_end>row_start''',
 'rows_at_cutoff':"SELECT COUNT(*) FROM statement FOR SYSTEM_TIME AS OF TIMESTAMP '2026-10-01 23:59:59'",
 'current_rows':'SELECT COUNT(*) FROM statement',
}
for k,sql in queries.items():q.execute(sql);checks[k]=int(q.fetchone()[0]);print(k,checks[k],flush=True)
coverage=json.loads((BASE/'data/coverage.json').read_text())['rows'][0]
assert checks['lifetimes']==coverage['statement_lifetimes']
assert checks['observations']==coverage['nonempty_field_observations']
assert checks['bad_periods']==checks['reverted_or_missing_origin']==checks['wrong_origin_page_or_time']==checks['overlapping_field_periods']==0
q.execute('SELECT id,fact_date,fact_number FROM statement FOR SYSTEM_TIME ALL WHERE fact_date IS NOT NULL OR fact_number IS NOT NULL')
actual={r[0]:(str(r[1]) if r[1] is not None else None,r[2]) for r in q.fetchall()}
expected={}
for line in gzip.open(BASE/'cache/statements.jsonl.gz','rt'):
    r=json.loads(line)
    if r['fact_date'] is not None or r['fact_number'] is not None:expected[r['id']]=(r['fact_date'],r['fact_number'])
checks['typed_value_mismatches']=sum(actual.get(k)!=v for k,v in expected.items())+len(set(actual)-set(expected))
assert checks['typed_value_mismatches']==0
q.execute('SELECT VERSION()');checks['server_version']=q.fetchone()[0]
q.execute('SELECT MIN(row_end),MAX(row_end) FROM statement');checks['current_end_sentinel']=list(q.fetchone())
dump('validation.json','History integrity checks','counts',[checks],'uv run verify.py; queries in verify.py; core edit is read only')
c.close()
