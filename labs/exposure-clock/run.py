# /// script
# dependencies = ["pymysql"]
# ///
"""Metadata-only analysis; sequential SQL on one connection. Rebuilds lab-owned tables."""
from pathlib import Path
import json,time,datetime,decimal
from zoneinfo import ZoneInfo
import pymysql
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'data';OUT.mkdir(exist_ok=True)
SQL=ROOT/'sql';SQL.mkdir(exist_ok=True)
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',autocommit=True,cursorclass=pymysql.cursors.DictCursor)
timings=[]
def default(x):
 if isinstance(x,decimal.Decimal): return float(x)
 return str(x)
def query(name,s,title=None,unit=None):
 (SQL/(name+'.sql')).write_text(s.strip()+';\n')
 start=time.perf_counter()
 with c.cursor() as cur:
  for statement in s.strip().split(';'):
   if statement.strip():cur.execute(statement)
  rows=cur.fetchall() if cur.description else []
 timings.append(dict(query=name,seconds=round(time.perf_counter()-start,4),rows=len(rows)))
 if title:
  (OUT/(name+'.json')).write_text(json.dumps(dict(title=title,unit=unit,source='wtt.edit; '+str(Path('sql')/(name+'.sql')),rows=rows),default=default,ensure_ascii=False,indent=2)+'\n')
 print(name,timings[-1],flush=True)
 return rows
query('setup', '''CREATE DATABASE IF NOT EXISTS lab_exposure_clock;
DROP TABLE IF EXISTS lab_exposure_clock.fact;
CREATE TABLE lab_exposure_clock.fact AS
SELECT e.page_id,e.seq,e.rev_id,e.saved_at,e.ended_at,e.user,e.editor,e.comment,e.delta,
 r.seq revert_seq,r.rev_id revert_rev_id,r.saved_at revert_at,r.user reverter,r.editor reverter_editor,r.comment revert_comment,r.restores,
 t.saved_at restored_at,r.sha1 IS NOT NULL identity_valid,r.bytes revert_bytes,
 TIMESTAMPDIFF(SECOND,e.saved_at,r.saved_at) exposure_seconds,
 TIMESTAMPDIFF(SECOND,e.saved_at,COALESCE(e.ended_at,r.saved_at)) live_seconds,
 CAST(r.seq AS SIGNED)-CAST(r.restores AS SIGNED)-1 span_edits,
 TIMESTAMPDIFF(SECOND,t.saved_at,r.saved_at) target_age_seconds,
 CASE WHEN e.user IS NOT NULL AND e.editor<>'hidden' AND r.editor<>'hidden' AND BINARY e.user=BINARY r.user THEN 1 ELSE 0 END self_revert,
 CASE WHEN TIMESTAMPDIFF(SECOND,t.saved_at,r.saved_at)>31536000 OR r.seq-r.restores-1>50 THEN 'long_range'
 WHEN TIMESTAMPDIFF(SECOND,t.saved_at,r.saved_at)<=604800 AND r.seq-r.restores-1<=5 THEN 'short_local'
 ELSE 'intermediate' END population
FROM wtt.edit e JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by
JOIN wtt.edit t ON t.page_id=r.page_id AND t.seq=r.restores;
ALTER TABLE lab_exposure_clock.fact ADD PRIMARY KEY(page_id,seq),ADD INDEX(saved_at),ADD INDEX(revert_at)''')
# Derive a tiny UTC offset interval table from the standard IANA Europe/Helsinki zone.
zone=ZoneInfo('Europe/Helsinki'); start=datetime.datetime(2003,1,1,tzinfo=datetime.timezone.utc); stop=datetime.datetime(2027,1,1,tzinfo=datetime.timezone.utc)
periods=[];prev=start;offset=int(start.astimezone(zone).utcoffset().total_seconds());d=start
while d<=stop:
 off=int(d.astimezone(zone).utcoffset().total_seconds())
 if off!=offset or d==stop:
  periods.append((prev.replace(tzinfo=None),d.replace(tzinfo=None),offset));prev=d;offset=off
 d+=datetime.timedelta(hours=1)
values=',\n'.join("('%s','%s',%d)"%p for p in periods)
query('timezone',"DROP TABLE IF EXISTS lab_exposure_clock.timezone_period;CREATE TABLE lab_exposure_clock.timezone_period(start_at DATETIME,end_at DATETIME,offset_seconds INT);INSERT INTO lab_exposure_clock.timezone_period VALUES "+values)
summary=query('summary', '''SELECT (SELECT COUNT(*) FROM wtt.edit) edits,(SELECT COUNT(DISTINCT page_id) FROM wtt.edit) pages,
(SELECT MIN(saved_at) FROM wtt.edit) first_edit,(SELECT MAX(saved_at) FROM wtt.edit) last_edit,
(SELECT MIN(saved_at) FROM wtt.edit WHERE editor='temp') first_temp,
(SELECT SUM(restores IS NOT NULL) FROM wtt.edit) revert_events,
COUNT(*) undone_versions,SUM(self_revert) self_reverts,SUM(exposure_seconds<0) negative_durations,
SUM(exposure_seconds>31536000) over_one_year,
SUM(exposure_seconds)/3600 version_hours,SUM(live_seconds)/3600 exact_version_hours,
MAX(exposure_seconds)/86400 longest_days FROM lab_exposure_clock.fact''','Dataset and exposure audit','counts; hours; days')
def stats(name,group,where='1=1',title='',unit='seconds; fractions; version-hours',extra=''):
 # MariaDB ordered-set window percentiles, then reduce identical partition results.
 dims=','.join(group)
 s=f'''WITH base AS (SELECT *, {extra if extra else 'YEAR(saved_at) AS year'} FROM lab_exposure_clock.fact WHERE {where}),
 ranked AS (SELECT *,
 PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exposure_seconds) OVER(PARTITION BY {dims}) p50,
 PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY exposure_seconds) OVER(PARTITION BY {dims}) p75,
 PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY exposure_seconds) OVER(PARTITION BY {dims}) p90,
 PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY exposure_seconds) OVER(PARTITION BY {dims}) p99
 FROM base)
 SELECT {dims},COUNT(*) n,MIN(p50) median_seconds,MIN(p75) p75_seconds,MIN(p90) p90_seconds,MIN(p99) p99_seconds,
 AVG(exposure_seconds<=60) within_minute,AVG(exposure_seconds<=3600) within_hour,
 AVG(exposure_seconds<=86400) within_day,AVG(exposure_seconds<=604800) within_week,
 SUM(exposure_seconds)/3600 version_hours,SUM(live_seconds)/3600 exact_version_hours
 FROM ranked GROUP BY {dims} ORDER BY {dims}'''
 return query(name,s,title,unit)
stats('exposure-by-year',['year'],title='Time from undone edit to its recorded identity revert, by edit year')
stats('exposure-by-editor',['editor','reverter_group','self_revert','population'],title='Exposure by editor, reverter, self-correction and restore range',extra="CASE WHEN reverter_editor IN ('ip','temp') THEN 'anonymous' ELSE reverter_editor END reverter_group")
stats('exposure-by-population',['population','self_revert'],title='Short local restores, intermediate restores and long-range restores')
stats('exposure-year-population',['year','population','self_revert'],title='Yearly exposure separated by restore range and self-correction')
query('integrity', '''SELECT
 (SELECT COUNT(*) FROM wtt.edit WHERE undone_by IS NOT NULL) source_undone,
 COUNT(*) joined_undone,SUM(revert_seq<=seq) nonforward_reverts,SUM(restores>=seq) outside_restore_span,
 SUM(ended_at>revert_at) ends_after_revert,SUM(ended_at<revert_at) replaced_before_revert,
 SUM(exposure_seconds=0) zero_duration,
 (SELECT COUNT(*) FROM wtt.edit e JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by WHERE r.restores IS NULL) missing_restore
 FROM lab_exposure_clock.fact''','Integrity checks','versions')
query('exposure-union-by-year', '''WITH ordered AS (
 SELECT page_id,seq,saved_at,revert_at,MAX(revert_at) OVER(PARTITION BY page_id ORDER BY saved_at,seq ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) previous_end
 FROM lab_exposure_clock.fact),
 marked AS (SELECT *,CASE WHEN previous_end IS NULL OR saved_at>previous_end THEN 1 ELSE 0 END new_group FROM ordered),
 grouped AS (SELECT *,SUM(new_group) OVER(PARTITION BY page_id ORDER BY saved_at,seq ROWS UNBOUNDED PRECEDING) island FROM marked),
 intervals AS (SELECT page_id,island,MIN(saved_at) start_at,MAX(revert_at) end_at FROM grouped GROUP BY page_id,island),
 years AS (SELECT DISTINCT YEAR(saved_at) year FROM wtt.edit)
 SELECT y.year,SUM(TIMESTAMPDIFF(SECOND,GREATEST(i.start_at,MAKEDATE(y.year,1)),LEAST(i.end_at,MAKEDATE(y.year+1,1))))/3600 article_hours
 FROM years y JOIN intervals i ON i.start_at<MAKEDATE(y.year+1,1) AND i.end_at>MAKEDATE(y.year,1)
 GROUP BY y.year ORDER BY y.year''','Union of undone-to-revert intervals, allocated to calendar year','article-hours')
query('temp-accounts', '''WITH horizon AS (SELECT MAX(saved_at) cutoff FROM wtt.edit),
 eligible AS (SELECT e.*,DATE_FORMAT(e.saved_at,'%Y-%m') month,r.saved_at revert_at,r.sha1 IS NOT NULL identity_valid,
 TIMESTAMPDIFF(SECOND,e.saved_at,r.saved_at) lag_seconds,
 CASE WHEN e.user IS NOT NULL AND BINARY e.user=BINARY r.user THEN 1 ELSE 0 END self_revert
 FROM wtt.edit e CROSS JOIN horizon h LEFT JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by
 WHERE e.saved_at>='2024-01-01' AND e.saved_at<=h.cutoff-INTERVAL 7 DAY),
 pct AS (SELECT month,editor,
 PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY lag_seconds) OVER(PARTITION BY month,editor) median_7d_seconds
 FROM eligible WHERE lag_seconds<=604800 AND self_revert=0),
 med AS (SELECT month,editor,MIN(median_7d_seconds) median_7d_seconds FROM pct GROUP BY month,editor)
 SELECT e.month,e.editor,COUNT(*) edits,SUM(revert_at IS NOT NULL) observed_undone,
 SUM(revert_at IS NOT NULL AND self_revert=1) observed_self_undone,
 SUM(lag_seconds<=604800 AND self_revert=0) other_undone_7d,
 AVG(COALESCE(lag_seconds<=604800 AND self_revert=0,0)) other_undone_7d_share,
 SUM(COALESCE(lag_seconds<=604800 AND self_revert=0 AND identity_valid,0)) valid_other_undone_7d,MAX(m.median_7d_seconds) median_7d_seconds
 FROM eligible e LEFT JOIN med m ON m.month=e.month AND m.editor=e.editor
 GROUP BY e.month,e.editor ORDER BY e.month,e.editor''','Monthly edit volume and seven-day nonself identity-undo outcomes; September 2026 partial','edits; fractions; seconds')
query('temp-comparison', '''WITH horizon AS (SELECT MAX(saved_at) cutoff FROM wtt.edit),
 eligible AS (SELECT e.*,CASE WHEN e.saved_at>='2025-03-01' AND e.saved_at<'2025-09-01' THEN 'before'
 WHEN e.saved_at>='2025-10-01' AND e.saved_at<'2026-04-01' THEN 'after' ELSE 'seasonal_baseline' END period,
 CASE WHEN e.editor IN ('ip','temp') THEN 'anonymous' ELSE e.editor END editor_group,
 r.saved_at revert_at,r.sha1 IS NOT NULL identity_valid,TIMESTAMPDIFF(SECOND,e.saved_at,r.saved_at) lag_seconds,
 CASE WHEN e.user IS NOT NULL AND BINARY e.user=BINARY r.user THEN 1 ELSE 0 END self_revert
 FROM wtt.edit e CROSS JOIN horizon h LEFT JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by
 WHERE ((e.saved_at>='2025-03-01' AND e.saved_at<'2025-09-01') OR (e.saved_at>='2025-10-01' AND e.saved_at<'2026-04-01') OR (e.saved_at>='2024-10-01' AND e.saved_at<'2025-04-01')) AND e.saved_at<=h.cutoff-INTERVAL 7 DAY),
 p AS (SELECT period,editor_group,PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY lag_seconds) OVER(PARTITION BY period,editor_group) median_seconds,
 PERCENTILE_CONT(0.9) WITHIN GROUP(ORDER BY lag_seconds) OVER(PARTITION BY period,editor_group) p90_seconds
 FROM eligible WHERE lag_seconds<=604800 AND self_revert=0),
 med AS (SELECT period,editor_group,MIN(median_seconds) median_7d_seconds,MIN(p90_seconds) p90_7d_seconds FROM p GROUP BY period,editor_group)
 SELECT e.period,e.editor_group,COUNT(*) edits,SUM(revert_at IS NOT NULL) observed_undone,
 SUM(COALESCE(lag_seconds<=604800 AND self_revert=0,0)) other_undone_7d,
 AVG(COALESCE(lag_seconds<=604800 AND self_revert=0,0)) other_undone_7d_share,
 SUM(COALESCE(lag_seconds<=604800 AND self_revert=0 AND identity_valid,0)) valid_other_undone_7d,MAX(m.median_7d_seconds) median_7d_seconds,MAX(m.p90_7d_seconds) p90_7d_seconds
 FROM eligible e LEFT JOIN med m ON m.period=e.period AND m.editor_group=e.editor_group
 GROUP BY e.period,e.editor_group ORDER BY e.period,e.editor_group''','Six-month before/after comparison with prior-year seasonal reference','edits; fractions; seconds')
# Attach timezone only through metadata table, no database timezone installation required.
query('local-time-setup', '''DROP TABLE IF EXISTS lab_exposure_clock.local_fact;
 CREATE TABLE lab_exposure_clock.local_fact AS SELECT f.*,TIMESTAMPADD(SECOND,z.offset_seconds,f.saved_at) local_at
 FROM lab_exposure_clock.fact f JOIN lab_exposure_clock.timezone_period z ON f.saved_at>=z.start_at AND f.saved_at<z.end_at''')
# Reuse stats helper against local fact by writing explicit SQL.
for dimension,expr in [('hour','HOUR(local_at)'),('weekday','WEEKDAY(local_at)')]:
 s=f'''WITH base AS (SELECT *,{expr} local_{dimension} FROM lab_exposure_clock.local_fact WHERE editor IN ('ip','temp') AND self_revert=0 AND population='short_local' AND identity_valid=1),
 p AS (SELECT *,PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY exposure_seconds) OVER(PARTITION BY local_{dimension}) median_seconds,
 PERCENTILE_CONT(0.9) WITHIN GROUP(ORDER BY exposure_seconds) OVER(PARTITION BY local_{dimension}) p90_seconds FROM base)
 SELECT local_{dimension},COUNT(*) n,MIN(median_seconds) median_seconds,MIN(p90_seconds) p90_seconds,AVG(exposure_seconds<=3600) within_hour
 FROM p GROUP BY local_{dimension} ORDER BY local_{dimension}'''
 query('exposure-by-'+dimension,s,'Anonymous nonself short-local undo exposure by Finnish local '+dimension,'seconds; fractions; weekday 0=Monday')
query('longest-lived', '''SELECT f.page_id,a.title,f.seq,f.rev_id,f.saved_at,f.editor,f.user,f.comment,
 f.revert_rev_id,f.revert_at,f.reverter,f.reverter_editor,f.revert_comment,f.restores,f.restored_at,
 f.span_edits,f.target_age_seconds,f.exposure_seconds/86400 exposure_days,f.live_seconds/86400 exact_version_days,f.self_revert,f.population
 FROM lab_exposure_clock.fact f LEFT JOIN wtt.article a ON a.lang='fi' AND a.page_id=f.page_id
 WHERE f.exposure_seconds>31536000 ORDER BY f.exposure_seconds DESC,f.rev_id LIMIT 20''','Twenty longest recorded undo durations over one year','days')
query('event-edges-setup', '''DROP TABLE IF EXISTS lab_exposure_clock.event_edges;
CREATE TABLE lab_exposure_clock.event_edges AS
SELECT r.page_id,r.rev_id revert_rev_id,r.saved_at revert_at,r.user reverter,e.user,r.sha1 IS NOT NULL identity_valid,COUNT(*) undone_versions
FROM wtt.edit r JOIN wtt.seq_1_to_10000 s ON s.seq<r.seq-r.restores
JOIN wtt.edit e ON e.page_id=r.page_id AND e.seq=r.restores+s.seq
WHERE r.restores IS NOT NULL AND r.editor='named' AND e.editor='named' AND BINARY r.user<>BINARY e.user
GROUP BY r.page_id,r.rev_id,r.saved_at,r.user,e.user''')
query('revert-clusters', '''WITH edges AS (
 SELECT page_id,DATE_FORMAT(revert_at,'%Y-%m') month,revert_rev_id,reverter,user,SUM(undone_versions) undone_versions
 FROM lab_exposure_clock.event_edges WHERE identity_valid=1
 GROUP BY page_id,month,revert_rev_id,reverter,user),
 clusters AS (SELECT page_id,month,COUNT(DISTINCT revert_rev_id) revert_events,COUNT(*) event_user_edges,SUM(undone_versions) undone_versions
 FROM edges GROUP BY page_id,month),
 top_clusters AS (SELECT * FROM clusters ORDER BY revert_events DESC,page_id,month LIMIT 20),
 pairs AS (SELECT e.page_id,e.month,e.reverter,e.user,COUNT(*) revert_events,SUM(e.undone_versions) undone_versions
 FROM edges e JOIN top_clusters t ON t.page_id=e.page_id AND t.month=e.month GROUP BY e.page_id,e.month,e.reverter,e.user)
 SELECT t.*,a.title,p.reverter,p.user reverted_user,p.revert_events pair_revert_events,p.undone_versions pair_undone_versions
 FROM top_clusters t LEFT JOIN wtt.article a ON a.lang='fi' AND a.page_id=t.page_id
 JOIN pairs p ON p.page_id=t.page_id AND p.month=t.month
 ORDER BY t.revert_events DESC,t.page_id,t.month,p.revert_events DESC,p.reverter,p.user''','Top twenty named-versus-named article-month revert clusters; one row per directed user pair','events and undone versions; cluster totals repeat across pairs')
query('cluster-summary', '''SELECT COUNT(DISTINCT page_id,revert_rev_id) named_nonself_revert_events,SUM(undone_versions) named_nonself_undo_associations,
 COUNT(DISTINCT page_id,DATE_FORMAT(revert_at,'%Y-%m')) article_months FROM lab_exposure_clock.event_edges WHERE identity_valid=1''','Named nonself revert totals','counts')
query('source-audit', """SELECT MAX(seq-restores-1) max_restore_span,SUM(seq-restores-1>5000) spans_beyond_ingest_cap,
 SUM(restores IS NOT NULL AND sha1 IS NULL) null_sha_reverts,SUM(restores IS NOT NULL AND bytes=0) empty_text_reverts,
 SUM(sha1 IS NULL) missing_hash_edits FROM wtt.edit""",'Source identity-revert limitations','counts')
stats('overall',['all_edits'],title='Overall observed undo exposure',extra="'all' all_edits")
stats('editor-summary',['editor','self_revert'],title='Editor exposure summary')
stats('patrol-year',['year'],where="editor IN ('ip','temp') AND self_revert=0 AND population='short_local' AND identity_valid=1",title='Anonymous short-local nonself exposure by year')
query('long-range-events', """SELECT f.page_id,a.title,f.revert_rev_id,MIN(f.revert_at) revert_at,MIN(f.revert_comment) revert_comment,
 MIN(f.span_edits) span_edits,COUNT(*) undone_versions,SUM(f.exposure_seconds)/3600 version_hours
 FROM lab_exposure_clock.fact f LEFT JOIN wtt.article a ON a.lang='fi' AND a.page_id=f.page_id
 GROUP BY f.page_id,a.title,f.revert_rev_id ORDER BY version_hours DESC LIMIT 20""",'Events contributing most version-hours','version-hours; counts')
query('comparison-observations', """SELECT e.page_id,e.rev_id,CASE WHEN e.saved_at<'2025-09-01' THEN 'before' ELSE 'after' END period,
 CASE WHEN e.editor IN ('ip','temp') THEN 'anonymous' ELSE e.editor END editor_group,
 CASE WHEN r.saved_at<=e.saved_at+INTERVAL 7 DAY AND BINARY e.user<>BINARY r.user THEN 1 ELSE 0 END undone_7d,
 CASE WHEN r.saved_at<=e.saved_at+INTERVAL 7 DAY AND BINARY e.user<>BINARY r.user THEN TIMESTAMPDIFF(SECOND,e.saved_at,r.saved_at) END lag_seconds
 FROM wtt.edit e LEFT JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by
 WHERE ((e.saved_at>='2025-03-01' AND e.saved_at<'2025-09-01') OR (e.saved_at>='2025-10-01' AND e.saved_at<'2026-04-01')) AND e.editor IN ('ip','temp')""",'Anonymous before/after observations for article-cluster uncertainty','edits; seconds')
stats('identity-sensitivity',['identity_valid'],title='Supplied undo labels split by known restore hash')
query('blank-restore-audit', """SELECT r.page_id,r.rev_id,r.saved_at,r.bytes,r.sha1,r.comment,t.rev_id target_rev_id,t.bytes target_bytes,t.sha1 target_sha,t.saved_at target_at
 FROM wtt.edit r JOIN wtt.edit t ON t.page_id=r.page_id AND t.seq=r.restores WHERE r.seq-r.restores-1=1106""",'The longest undo spans arise from repeating an empty page','revision metadata')
query('cluster-validity', """SELECT COUNT(DISTINCT x.page_id,x.revert_rev_id) invalid_hash_named_revert_events
 FROM lab_exposure_clock.event_edges x JOIN wtt.edit r ON r.rev_id=x.revert_rev_id WHERE r.sha1 IS NULL""",'Named cluster events with missing restore hashes','events')
stats('valid-exposure-by-year',['year'],where='identity_valid=1',title='Known-hash identity undo exposure by edit year')
stats('valid-exposure-by-editor',['editor','reverter_group','self_revert','population'],where='identity_valid=1',title='Known-hash exposure by editor and reverter',extra="CASE WHEN reverter_editor IN ('ip','temp') THEN 'anonymous' ELSE reverter_editor END reverter_group")
(OUT/'timings.json').write_text(json.dumps(dict(title='Sequential SQL wall-clock timings',unit='seconds',source='run.py; local MariaDB',rows=timings),indent=2)+'\n')
c.close()
