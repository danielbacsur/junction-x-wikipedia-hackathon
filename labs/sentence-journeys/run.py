# /// script
# dependencies = ["pymysql"]
# ///
import pymysql,json,time,datetime,decimal,pathlib,re,sys
P=pathlib.Path(__file__).parent
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',charset='utf8mb4',autocommit=True,cursorclass=pymysql.cursors.DictCursor)
timings=json.loads((P/'data/timings.json').read_text())['rows'] if '--reports' in sys.argv else []
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
sql('database','CREATE DATABASE IF NOT EXISTS lab_sentence_journeys')
sql('use','USE lab_sentence_journeys')
sql('timezone',"SET time_zone = '+00:00'")
if '--reports' not in sys.argv:
 for table in ['raw','lifetimes','presence','firsts','spread','ranked','pairs','edges','events','titles','page_birth','all_spread']:
  sql('drop-'+table,'DROP TABLE IF EXISTS '+table)
 sql('titles','CREATE TABLE titles AS SELECT page_id,title FROM wtt.revision')
 sql('titles-index','ALTER TABLE titles ADD PRIMARY KEY(page_id)')
 sql('page-birth','CREATE TABLE page_birth AS SELECT page_id,MIN(saved_at) born_at,MIN(seq) first_seq FROM wtt.edit GROUP BY page_id')
 sql('raw',"""CREATE TABLE raw AS SELECT p.page_id,p.hash,p.dup,p.born_rev,p.row_start s,p.row_end e
 FROM wtt.passage FOR SYSTEM_TIME ALL p JOIN wtt.passage_text t ON t.hash=p.hash WHERE t.kind='prose' AND t.chars>=120""")
 sql('raw-index','ALTER TABLE raw ADD INDEX(hash,page_id), ADD INDEX(page_id,hash,dup,s)')
 sql('lifetimes',"""CREATE TABLE lifetimes AS
 WITH previous AS (SELECT *,MAX(e) OVER(PARTITION BY page_id,hash,dup ORDER BY s,e ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) prior_end FROM raw),
 groups AS (SELECT *,SUM(prior_end IS NULL OR s>prior_end) OVER(PARTITION BY page_id,hash,dup ORDER BY s,e) g FROM previous)
 SELECT page_id,hash,dup,g,MIN(s) s,MAX(e) e,SUBSTRING_INDEX(GROUP_CONCAT(born_rev ORDER BY s,e),',',1)+0 born_rev FROM groups GROUP BY page_id,hash,dup,g""")
 # Merge duplicates too: presence is existence of wording anywhere on the page.
 sql('presence',"""CREATE TABLE presence AS
 WITH previous AS (SELECT *,MAX(e) OVER(PARTITION BY page_id,hash ORDER BY s,e,dup ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) prior_end FROM lifetimes),
 groups AS (SELECT *,SUM(prior_end IS NULL OR s>prior_end) OVER(PARTITION BY page_id,hash ORDER BY s,e,dup) island FROM previous)
 SELECT page_id,hash,island,MIN(s) s,MAX(e) e,SUBSTRING_INDEX(GROUP_CONCAT(born_rev ORDER BY s,e,dup),',',1)+0 born_rev FROM groups GROUP BY page_id,hash,island""")
 sql('presence-index','ALTER TABLE presence ADD INDEX(hash,page_id,s), ADD INDEX(page_id,s)')
 sql('firsts',"""CREATE TABLE firsts AS SELECT page_id,hash,MIN(s) first_at,SUBSTRING_INDEX(GROUP_CONCAT(born_rev ORDER BY s),',',1)+0 born_rev,MAX(e>'2100-01-01') current FROM presence GROUP BY page_id,hash""")
 sql('firsts-index','ALTER TABLE firsts ADD PRIMARY KEY(hash,page_id)')
 sql('spread','CREATE TABLE spread AS SELECT hash,COUNT(*) articles,SUM(current) current_articles FROM firsts GROUP BY hash')
 sql('spread-index','ALTER TABLE spread ADD PRIMARY KEY(hash)')
 sql('ranked',"""CREATE TABLE ranked AS SELECT f.*,ROW_NUMBER() OVER(PARTITION BY f.hash ORDER BY first_at,page_id) pos FROM firsts f JOIN spread s USING(hash) WHERE s.articles>=2""")
 sql('ranked-index','ALTER TABLE ranked ADD INDEX(hash,pos)')
 sql('pairs',"""CREATE TABLE pairs AS SELECT a.hash,a.page_id src,b.page_id dst,a.first_at src_at,b.first_at dst_at,a.born_rev src_rev,b.born_rev dst_rev,TIMESTAMPDIFF(SECOND,a.first_at,b.first_at) delay_seconds FROM ranked a JOIN ranked b ON a.hash=b.hash AND a.pos=1 AND b.pos=2""")
 # Every destination's first appearance, any earlier source present then or removed within an hour.
 sql('edges',"""CREATE TABLE edges AS SELECT d.hash,s.page_id src,d.page_id dst,d.first_at at,d.born_rev dst_rev,MAX(s.e) src_end,
 MAX(s.e>d.first_at) overlaps, (ABS(TIMESTAMPDIFF(SECOND,MAX(s.e),d.first_at))<=3600) near_removal
 FROM ranked d JOIN presence s ON s.hash=d.hash AND s.page_id<>d.page_id AND s.s<d.first_at AND s.e>=d.first_at-INTERVAL 1 HOUR
 GROUP BY d.hash,s.page_id,d.page_id,d.first_at,d.born_rev""")
 sql('events',"""CREATE TABLE events AS SELECT src,dst,at,dst_rev,COUNT(*) paragraphs,SUM(near_removal) moved,SUM(NOT near_removal AND overlaps) retained FROM edges GROUP BY src,dst,at,dst_rev HAVING COUNT(*)>=5""")
 sql('all-spread',"""CREATE TABLE all_spread AS SELECT p.hash,COUNT(DISTINCT p.page_id) articles FROM wtt.passage FOR SYSTEM_TIME ALL p GROUP BY p.hash""")
out('summary',"""SELECT COUNT(*) prose_wordings,SUM(articles>=2) shared,SUM(articles>=5) five_plus,SUM(articles>=20) twenty_plus,SUM(current_articles>=2) current_shared,MAX(articles) max_articles,
 (SELECT COUNT(*) FROM titles) articles,(SELECT COUNT(*) FROM raw) raw_rows,(SELECT COUNT(*) FROM lifetimes) duplicate_lifetimes,(SELECT COUNT(*) FROM presence) page_lifetimes,(SELECT MAX(saved_at) FROM wtt.edit) cutoff FROM spread""",'Prose paragraph journeys: headline scale')
out('spread-distribution','SELECT articles,COUNT(*) wordings,SUM(current_articles>=2) currently_shared FROM spread GROUP BY articles ORDER BY articles','Articles per prose wording')
out('delay-distribution',"""SELECT DISTINCT COUNT(*) OVER() n,PERCENTILE_CONT(.25) WITHIN GROUP(ORDER BY delay_seconds) OVER() q25_seconds,PERCENTILE_CONT(.5) WITHIN GROUP(ORDER BY delay_seconds) OVER() median_seconds,PERCENTILE_CONT(.75) WITHIN GROUP(ORDER BY delay_seconds) OVER() q75_seconds,AVG(delay_seconds<=3600) OVER() within_hour,AVG(delay_seconds<=86400) OVER() within_day,AVG(delay_seconds<=31536000) OVER() within_year,SUM(delay_seconds=0) OVER() tied_first FROM pairs""",'First to second observed article','seconds and proportions')
out('delay-bins',"""SELECT CASE WHEN delay_seconds=0 THEN '0 tied' WHEN delay_seconds<=3600 THEN '1 within hour' WHEN delay_seconds<=86400 THEN '2 hour to day' WHEN delay_seconds<=31536000 THEN '3 day to year' ELSE '4 over year' END bin,COUNT(*) wordings FROM pairs GROUP BY bin ORDER BY bin""")
out('journey-candidates',"""SELECT HEX(s.hash) hash,s.articles,s.current_articles,t.chars,LEFT(t.text,1500) text FROM spread s JOIN wtt.passage_text t USING(hash) WHERE s.articles>=2 ORDER BY s.articles DESC,t.chars DESC,hash LIMIT 100""")
out('splits-and-merges',"""SELECT a.title source,b.title destination,v.*,e.user editor,e.editor editor_type,e.comment,CONCAT('https://fi.wikipedia.org/?oldid=',v.dst_rev) link FROM events v JOIN titles a ON a.page_id=v.src JOIN titles b ON b.page_id=v.dst LEFT JOIN wtt.edit e ON e.rev_id=v.dst_rev ORDER BY paragraphs DESC,at,src,dst LIMIT 30""",'Largest exact-text transfer candidates','paragraphs')
out('event-summary',"""SELECT COUNT(*) events,SUM(moved>=5) move_events,SUM(retained>=5) copy_events,COUNT(DISTINCT dst) destinations,SUM(COALESCE(e.comment,'') REGEXP 'siirr|siirt|yhdist|kopio|jaett|eriyt|split|merg|mov|cop') corroborated FROM events v LEFT JOIN wtt.edit e ON e.rev_id=v.dst_rev""",unit='events')
out('birth-summary',"""WITH reused AS (SELECT d.page_id,COUNT(*) paragraphs FROM ranked d JOIN page_birth b ON b.page_id=d.page_id AND b.born_at=d.first_at JOIN ranked a ON a.hash=d.hash AND a.pos=1 AND a.first_at<d.first_at GROUP BY d.page_id) SELECT COUNT(*) any_reused_at_birth,SUM(paragraphs>=5) five_reused_at_birth FROM reused""",unit='articles')
out('survival',"""WITH x AS (SELECT p.*,s.e source_end,d.e destination_end FROM pairs p JOIN presence s ON s.hash=p.hash AND s.page_id=p.src AND s.s<=p.dst_at AND s.e>p.dst_at JOIN presence d ON d.hash=p.hash AND d.page_id=p.dst AND d.s=p.dst_at WHERE p.delay_seconds>0)
 SELECT COUNT(*) overlapping_first_second,SUM(source_end>='2100-01-01' AND destination_end>='2100-01-01') both_censored,SUM(source_end<destination_end) destination_outlives,SUM(destination_end<source_end) source_outlives,SUM(source_end=destination_end AND source_end<'2100-01-01') same_end,
 SUM(source_end<'2100-01-01' AND destination_end<'2100-01-01') both_ended,
 SUM(dst_at<=(SELECT MAX(saved_at) FROM wtt.edit)-INTERVAL 365 DAY) eligible_year,
 SUM(dst_at<=(SELECT MAX(saved_at) FROM wtt.edit)-INTERVAL 365 DAY AND source_end>=dst_at+INTERVAL 365 DAY) source_survives_year,
 SUM(dst_at<=(SELECT MAX(saved_at) FROM wtt.edit)-INTERVAL 365 DAY AND destination_end>=dst_at+INTERVAL 365 DAY) destination_survives_year FROM x""",'Paired uninterrupted survival from second appearance','wordings')
out('boilerplate',"""SELECT HEX(a.hash) hash,t.kind,t.chars,a.articles,t.text FROM all_spread a JOIN wtt.passage_text t USING(hash) WHERE t.kind IN ('prose','list') ORDER BY a.articles DESC,t.chars DESC LIMIT 40""",'Most repeated complete prose/list blocks','articles')
out('integrity',"""SELECT (SELECT COUNT(*) FROM raw WHERE e<s) negative_intervals,(SELECT COUNT(*) FROM raw WHERE e=s) zero_intervals,(SELECT COUNT(*) FROM firsts f LEFT JOIN wtt.edit e ON e.rev_id=f.born_rev WHERE e.rev_id IS NULL) missing_born_edits,(SELECT COUNT(*) FROM firsts f JOIN wtt.edit e ON e.rev_id=f.born_rev WHERE e.saved_at<>f.first_at OR e.page_id<>f.page_id) mismatched_births,(SELECT COUNT(*) FROM pairs WHERE delay_seconds<0) negative_delays""",unit='rows')
c.close()
