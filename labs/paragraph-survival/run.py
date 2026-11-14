# /// script
# dependencies = ["pymysql", "numpy"]
# ///
"""Sequential MariaDB analysis. Rebuilds only lab_paragraph_survival."""
from pathlib import Path
import json,time,datetime,decimal,sys
import pymysql
P=Path(__file__).parent; (P/'sql').mkdir(exist_ok=True);(P/'data').mkdir(exist_ok=True)
C=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',autocommit=True,cursorclass=pymysql.cursors.DictCursor)
resume=sys.argv[1] if len(sys.argv)>1 else None
if resume:
 C.select_db("lab_paragraph_survival")
 with C.cursor() as q:q.execute("SET time_zone = '+00:00'")
timings=json.loads((P/"data/timings.json").read_text())["rows"] if resume else []
def default(v):
 if isinstance(v,decimal.Decimal):return float(v)
 if isinstance(v,(datetime.datetime,datetime.date)):return v.isoformat(sep=' ') if isinstance(v,datetime.datetime) else v.isoformat()
 raise TypeError(type(v).__name__)
def sql(name,s):
 global resume
 if resume and name!=resume:return []
 if name==resume:resume=None
 (P/'sql'/f'{name}.sql').write_text(s+';\n');t=time.monotonic()
 with C.cursor() as q:q.execute(s);r=q.fetchall()
 timings.append(dict(query=name,seconds=round(time.monotonic()-t,4),rows=len(r)))
 print(timings[-1],flush=True);(P/'data'/'timings.json').write_text(json.dumps(dict(title='Sequential SQL timings',unit='seconds',source='run.py wall clock',rows=timings),indent=2));return r
def out(name,title,unit,rows,source=None):
 (P/'data'/f'{name}.json').write_text(json.dumps(dict(title=title,unit=unit,source=source or f'MariaDB wtt; sql/{name}.sql; cutoff 2026-10-01 10:59:12 UTC',rows=rows),default=default,ensure_ascii=False,indent=2))
for n,s in [('create-db','CREATE DATABASE IF NOT EXISTS lab_paragraph_survival'),('use-db','USE lab_paragraph_survival'),('timezone',"SET time_zone = '+00:00'")]:sql(n,s)
cut="'2026-10-01 10:59:12'"
def table(name,select,index=''):
 sql('drop-'+name,f'DROP TABLE IF EXISTS {name}');sql('build-'+name,f'CREATE TABLE {name} AS {select}')
 if index:sql('index-'+name,f'ALTER TABLE {name} {index}')
table('raw',f'''SELECT p.page_id,p.hash,p.dup,p.born_rev,p.slot,p.row_start a,p.row_end b,t.kind,t.chars
FROM wtt.passage FOR SYSTEM_TIME ALL p JOIN wtt.passage_text t ON t.hash=p.hash
WHERE p.row_start <= {cut}''','ADD KEY k(page_id,hash,dup,a), ADD KEY sl(page_id,slot,a)')
table('islands','''SELECT r.*,SUM(new_stay) OVER(PARTITION BY page_id,hash,dup ORDER BY a,b ROWS UNBOUNDED PRECEDING) island FROM
(SELECT raw.*,IF(LAG(b) OVER(PARTITION BY page_id,hash,dup ORDER BY a,b)=a,0,1) new_stay FROM raw WHERE b>a) r''')
table('stays','''SELECT page_id,hash,dup,island,MIN(a) a,MAX(b) b,MIN(born_rev) born_rev,MIN(slot) slot,MAX(slot) max_slot,MIN(kind) kind,MIN(chars) chars,COUNT(*) source_rows FROM islands GROUP BY page_id,hash,dup,island''','ADD KEY k(page_id,hash,dup,a), ADD KEY sl(page_id,slot,a), ADD KEY born(born_rev)')
# Same timestamp revisions cannot be joined multiply; last seq describes final state.
table('end_edit','''SELECT e.* FROM wtt.edit e JOIN (SELECT page_id,saved_at,MAX(seq) seq FROM wtt.edit GROUP BY page_id,saved_at) z ON z.page_id=e.page_id AND z.seq=e.seq''','ADD UNIQUE KEY k(page_id,saved_at)')
table('facts',f'''SELECT s.*,e.user author,e.editor,e.saved_at birth_edit_at,YEAR(s.a) cohort,
CASE WHEN e.editor='named' THEN 'named' WHEN e.editor IN ('ip','temp') THEN 'anonymous' ELSE 'hidden_or_missing' END editor_group,
CASE WHEN s.chars<200 THEN '80-199' WHEN s.chars<500 THEN '200-499' WHEN s.chars<1000 THEN '500-999' ELSE '1000+' END length_bucket,
TIMESTAMPDIFF(MICROSECOND,s.a,LEAST(s.b,{cut}))/1000000 duration,
s.b>{cut} standing,IF(s.b<={cut} AND d.rev_id IS NOT NULL AND d.undone_by IS NULL,1,0) event,
IF(s.b<={cut},1,0) raw_event,d.rev_id removing_rev,d.user remover,d.comment removal_comment,d.undone_by removal_undone_by
FROM stays s LEFT JOIN wtt.edit e ON e.rev_id=s.born_rev LEFT JOIN end_edit d ON d.page_id=s.page_id AND d.saved_at=s.b
WHERE s.kind IN ('prose','list') AND s.chars>=80''','ADD KEY k(page_id,hash,dup,a), ADD KEY sl(page_id,slot), ADD KEY endpoint(event,kind,duration)')
# All kinds and lengths participate in slot follow-up, preventing a shorter successor from becoming a false death.
table('slots','''SELECT page_id,slot,MIN(a) a,MAX(b) b FROM raw WHERE slot>0 GROUP BY page_id,slot''','ADD PRIMARY KEY(page_id,slot)')
table('slot_origin','''SELECT * FROM (SELECT r.*,ROW_NUMBER() OVER(PARTITION BY page_id,slot ORDER BY a,born_rev,hash,dup) rn FROM raw r WHERE slot>0) z WHERE rn=1''','ADD PRIMARY KEY(page_id,slot)')
table('slot_facts',f'''SELECT s.page_id,s.slot,s.a,s.b,o.kind,o.chars,YEAR(s.a) cohort,
CASE WHEN e.editor='named' THEN 'named' WHEN e.editor IN ('ip','temp') THEN 'anonymous' ELSE 'hidden_or_missing' END editor_group,
CASE WHEN o.chars<200 THEN '80-199' WHEN o.chars<500 THEN '200-499' WHEN o.chars<1000 THEN '500-999' ELSE '1000+' END length_bucket,
TIMESTAMPDIFF(MICROSECOND,s.a,LEAST(s.b,{cut}))/1000000 duration,
IF(s.b<={cut} AND d.rev_id IS NOT NULL AND d.undone_by IS NULL,1,0) event,s.b>{cut} standing
FROM slots s JOIN slot_origin o USING(page_id,slot) LEFT JOIN wtt.edit e ON e.rev_id=o.born_rev
LEFT JOIN end_edit d ON d.page_id=s.page_id AND d.saved_at=s.b WHERE o.kind IN ('prose','list') AND o.chars>=80''')
# Compact event tables: ties include deaths before censors in the risk set.
parts=[]
for table_,endpoint,event in [('facts','wording','event'),('facts','wording_raw','raw_event'),('slot_facts','slot','event')]:
 for dimension,group,where in [('overall',"'all'","kind='prose'"),('cohort','CAST(cohort AS CHAR)',"kind='prose' AND cohort BETWEEN 2004 AND 2024"),('editor','editor_group',"kind='prose'"),('length','length_bucket',"kind='prose'"),('kind','kind','1=1')]:
  if endpoint=='wording_raw' and dimension!='overall':continue
  parts.append(f"SELECT '{endpoint}' endpoint,'{dimension}' dimension,{group} grp,duration,COUNT(*) exits,SUM({event}) deaths FROM {table_} WHERE {where} GROUP BY {group},duration")
table('event_counts',' UNION ALL '.join(parts))
table('risk','''SELECT *,SUM(exits) OVER(PARTITION BY endpoint,dimension,grp ORDER BY duration DESC ROWS UNBOUNDED PRECEDING) at_risk FROM event_counts''')
table('km','''SELECT *,IF(SUM(deaths=at_risk) OVER w>0,0,EXP(SUM(IF(deaths<at_risk,LN(1-deaths*1e0/at_risk),0)) OVER w)) survival FROM risk WINDOW w AS (PARTITION BY endpoint,dimension,grp ORDER BY duration ROWS UNBOUNDED PRECEDING)''','ADD KEY k(endpoint,dimension,grp,duration)')
med=sql('medians', '''SELECT endpoint,dimension,grp,SUM(exits) n,SUM(deaths) deaths,MIN(IF(survival<=0.5,duration,NULL))/86400 median_days,MAX(duration)/86400 max_followup_days FROM km GROUP BY endpoint,dimension,grp''');out('medians','Kaplan–Meier medians (null = not reached)','days',med)
# Fixed chart ages; no extrapolation beyond observed support.
ages=[0,3600,86400,7*86400,30*86400,90*86400,180*86400]+[round(y*365.25*86400) for y in range(1,21)]
table('ages',' UNION ALL '.join(f'SELECT {a} age_seconds' for a in ages))
table('curve_groups',"SELECT endpoint,dimension,grp,MAX(duration) max_duration,SUM(exits) n FROM km GROUP BY endpoint,dimension,grp")
curves=sql('survival-curves','''SELECT g.endpoint,g.dimension,g.grp,a.age_seconds,
IF(a.age_seconds>g.max_duration,NULL,COALESCE((SELECT k.survival FROM km k WHERE k.endpoint=g.endpoint AND k.dimension=g.dimension AND k.grp=g.grp AND k.duration<=a.age_seconds ORDER BY k.duration DESC LIMIT 1),1)) survival,
COALESCE((SELECT k.at_risk FROM km k WHERE k.endpoint=g.endpoint AND k.dimension=g.dimension AND k.grp=g.grp AND k.duration>=a.age_seconds ORDER BY k.duration LIMIT 1),0) at_risk,g.n
FROM curve_groups g CROSS JOIN ages a ORDER BY g.endpoint,g.dimension,g.grp,a.age_seconds''')
for dim,name in [('overall','overall'),('cohort','by-cohort'),('editor','by-editor'),('length','by-length'),('kind','by-kind')]:out('survival-'+name,'Kaplan–Meier survival: '+dim,'probability', [r for r in curves if r['dimension']==dim], 'sql/survival-curves.sql; sql/build-km.sql; censor undone removals; wording_raw sensitivity; null beyond observed follow-up')
# Hazard = events / observed at-risk person-time within disjoint age bands.
bounds=[0,3600,86400,7*86400,30*86400,90*86400,365.25*86400,5*365.25*86400,10*365.25*86400,20*365.25*86400,100*365.25*86400]
table('bands',' UNION ALL '.join(f'SELECT {int(a)} lo,{int(b)} hi' for a,b in zip(bounds,bounds[1:])))
h=sql('hazard-by-age','''SELECT lo/86400 from_days,hi/86400 to_days,COUNT(*) entering,SUM(event AND duration<hi) deaths,SUM(LEAST(duration,hi)-lo)/86400 at_risk_days,SUM(event AND duration<hi)/NULLIF(SUM(LEAST(duration,hi)-lo)/86400,0)*1000 deaths_per_1000_days FROM facts JOIN bands ON duration>=lo WHERE kind='prose' GROUP BY lo,hi ORDER BY lo''');out('hazard-by-age','Exact wording age-specific hazard','deaths per 1000 wording-days',h)
old=sql('oldest-standing',f'''SELECT r.title,f.page_id,HEX(f.hash) hash,f.dup,t.text,f.a written_at,f.birth_edit_at,f.author,f.born_rev,f.duration/86400 days,f.source_rows,CONCAT('https://fi.wikipedia.org/?oldid=',f.born_rev) url FROM facts f JOIN wtt.passage_text t ON t.hash=f.hash JOIN wtt.revision r ON r.page_id=f.page_id WHERE f.kind='prose' AND f.standing=1 ORDER BY f.a,f.page_id,f.hash LIMIT 25''');out('oldest-standing','25 oldest uninterrupted standing prose wordings','days',old)
ret=sql('retraction-index',f'''SELECT r.title,f.page_id,HEX(f.hash) hash,f.slot,t.text,f.a written_at,f.b removed_at,f.duration/86400 days,f.author,f.remover,f.removal_comment,f.removing_rev,CONCAT('https://fi.wikipedia.org/?oldid=',f.removing_rev) url FROM facts f JOIN slots s ON s.page_id=f.page_id AND s.slot=f.slot JOIN wtt.passage_text t ON t.hash=f.hash JOIN wtt.revision r ON r.page_id=f.page_id WHERE f.kind='prose' AND f.event=1 AND f.slot>0 AND s.b=f.b AND NOT EXISTS(SELECT 1 FROM stays later WHERE later.page_id=f.page_id AND later.hash=f.hash AND later.a>=f.b) ORDER BY f.duration DESC,f.page_id,f.hash LIMIT 30''');out('retraction-index','30 longest uninterrupted wordings finally removed from their slot','days',ret)
a=sql('authors',"""SELECT author,COUNT(*) wording_stays,SUM(duration)/86400 wording_days,SUM(standing) still_standing FROM facts WHERE kind='prose' AND editor='named' GROUP BY BINARY author ORDER BY wording_days DESC LIMIT 100""");out('authors','Named authors by observed prose wording-days (overlapping wordings count separately)','wording-days',a)
s=sql('summary',f'''SELECT COUNT(*) prose_stays,SUM(event) wording_deaths,SUM(standing) standing,SUM(raw_event-event) censored_removals,SUM(slot=0) slot_zero,SUM(slot<>max_slot) slot_changes_within_stay,SUM(author IS NULL) missing_author,SUM(duration=0) zero_duration,SUM(standing AND a<'2010-01-01')/SUM(standing)*100 before_2010_pct,SUM(standing AND a<'2015-01-01')/SUM(standing)*100 before_2015_pct,SUM(standing AND a<'2020-01-01')/SUM(standing)*100 before_2020_pct FROM facts WHERE kind='prose' ''')
s+=sql('integrity', '''SELECT (SELECT COUNT(*) FROM raw) raw_rows,(SELECT COUNT(*) FROM stays) merged_stays,(SELECT COUNT(*) FROM raw WHERE b<=a) zero_or_negative_rows,(SELECT COUNT(*) FROM facts WHERE raw_event=1 AND removing_rev IS NULL) missing_removers,(SELECT COUNT(*) FROM facts WHERE duration<0) negative_durations,(SELECT COUNT(*) FROM stays WHERE island>1) return_stays,(SELECT COUNT(*) FROM wtt.edit)-(SELECT COUNT(*) FROM end_edit) duplicate_timestamp_edits,(SELECT COUNT(DISTINCT page_id) FROM raw) pages''')
out('summary','Headline counts and audit','counts, percentages',s+med, 'sql/summary.sql; sql/integrity.sql; sql/medians.sql')
C.close()
