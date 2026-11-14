# /// script
# dependencies = ["pymysql", "mwparserfromhell"]
# ///
import json,time,datetime,decimal,pathlib,sys
import pymysql
BASE=pathlib.Path(__file__).parent
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',autocommit=True,charset='utf8mb4',cursorclass=pymysql.cursors.DictCursor)
timings=[]
def default(x):
 if isinstance(x,bytes):return x.hex()
 if isinstance(x,decimal.Decimal):return float(x)
 return str(x)
def out(name,title,unit,rows):
 directory=BASE/('cache' if name.endswith('input') else 'data')
 directory.mkdir(exist_ok=True)
 (directory/f'{name}.json').write_text(json.dumps(dict(title=title,unit=unit,source='wtt snapshot 2026-10-01; labs/claims-before-sources; '+name,rows=rows),ensure_ascii=False,indent=2,default=default))
def q(name,sql):
 (BASE/'sql'/f'{name}.sql').write_text(sql+';\n');start=time.monotonic()
 with c.cursor() as cur:cur.execute(sql); rows=cur.fetchall() if cur.description else []
 timings.append(dict(query=name,seconds=round(time.monotonic()-start,4),rows=len(rows)))
 out('timings','SQL wall times','seconds',timings);print(name,timings[-1],flush=True);return rows
def build(name,sql,index=None):
 q('drop-'+name,'DROP TABLE IF EXISTS '+name);q('build-'+name,'CREATE TABLE '+name+' AS '+sql)
 if index:q('index-'+name,'ALTER TABLE '+name+' '+index)
q('database','CREATE DATABASE IF NOT EXISTS lab_claims_before_sources');q('use','USE lab_claims_before_sources');q('timezone',"SET time_zone='+00:00'")
if '--extract' in sys.argv:
 build('flags',"SELECT hash,kind,chars,(wikitext REGEXP '<ref([[:space:]/>])') has_ref FROM wtt.passage_text",'ADD PRIMARY KEY(hash)')
 build('raw',"SELECT p.page_id,p.slot,p.hash,p.dup,p.born_rev,p.rev_id,p.prev_hash,p.sim,p.row_start a,p.row_end b,f.kind,f.chars,f.has_ref FROM wtt.passage FOR SYSTEM_TIME ALL p JOIN flags f ON f.hash=p.hash WHERE p.slot>0",'ADD INDEX(page_id,slot,a), ADD INDEX(hash)')
 # Merge movement-only rows, preserving gaps and slot changes.
 build('marked',"SELECT r.*,MAX(b) OVER(PARTITION BY page_id,slot,hash,dup ORDER BY a,b ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) previous_end FROM raw r")
 build('islands',"SELECT m.*,SUM(IF(previous_end>=a,0,1)) OVER(PARTITION BY page_id,slot,hash,dup ORDER BY a,b) island FROM marked m")
 build('stays',"SELECT page_id,slot,hash,dup,island,MIN(a) a,MAX(b) b,MIN(born_rev) born_rev,MAX(has_ref) has_ref,MIN(kind) kind,MIN(chars) chars,COUNT(*) raw_rows FROM islands GROUP BY page_id,slot,hash,dup,island",'ADD INDEX(page_id,slot,a),ADD INDEX(hash)')
 build('origins',"SELECT page_id,slot,MIN(a) written,MIN(IF(has_ref,a,NULL)) referenced FROM stays GROUP BY page_id,slot",'ADD PRIMARY KEY(page_id,slot)')
 build('current',"SELECT p.page_id,p.slot,p.hash,p.dup,p.born_rev,f.has_ref,f.chars FROM wtt.passage p JOIN flags f ON f.hash=p.hash WHERE f.kind='prose' AND f.chars>=80",'ADD INDEX(page_id,slot)')
 build('facts',"SELECT n.*,o.written,o.referenced,TIMESTAMPDIFF(SECOND,o.written,o.referenced)/86400 wait_days FROM current n LEFT JOIN origins o ON o.page_id=n.page_id AND o.slot=n.slot",'ADD INDEX(page_id,slot)')
summary=q('summary',"""SELECT COUNT(*) current_paragraphs,SUM(slot=0) zero_slot,SUM(has_ref) referenced_today,SUM(has_ref AND referenced=written) born_with_reference,SUM(has_ref AND referenced>written) gained_reference,SUM(NOT has_ref) no_reference_today,SUM(NOT has_ref AND referenced IS NULL) never_referenced,SUM(NOT has_ref AND referenced IS NOT NULL) reference_removed,SUM(NOT has_ref AND written<='2021-10-01') unsourced_5_years,SUM(NOT has_ref AND written<='2016-10-01') unsourced_10_years,SUM(NOT has_ref AND written<='2011-10-01') unsourced_15_years FROM facts""");out('summary','Current prose sourcing coverage','paragraphs',summary)
out('sourcing-by-year','Surviving paragraph slots born with inline reference','paragraphs and percent',q('sourcing-by-year',"SELECT YEAR(written) year,COUNT(*) paragraphs,SUM(referenced=written) born_referenced,100*SUM(COALESCE(referenced=written,0))/COUNT(*) born_referenced_pct FROM facts WHERE written IS NOT NULL GROUP BY YEAR(written)"))
out('wait-for-reference','Time to first inline reference among current referenced paragraphs','days',q('wait-for-reference',"""SELECT DISTINCT YEAR(written) year,COUNT(*) OVER(PARTITION BY YEAR(written)) paragraphs,PERCENTILE_CONT(.25) WITHIN GROUP(ORDER BY wait_days) OVER(PARTITION BY YEAR(written)) p25,PERCENTILE_CONT(.5) WITHIN GROUP(ORDER BY wait_days) OVER(PARTITION BY YEAR(written)) median,PERCENTILE_CONT(.75) WITHIN GROUP(ORDER BY wait_days) OVER(PARTITION BY YEAR(written)) p75 FROM facts WHERE has_ref AND referenced IS NOT NULL ORDER BY year"""))
out('wait-overall','Time to first reference, including born referenced; and gained only','days',q('wait-overall',"""SELECT DISTINCT 'all' population,COUNT(*) OVER() n,PERCENTILE_CONT(.25) WITHIN GROUP(ORDER BY wait_days) OVER() p25,PERCENTILE_CONT(.5) WITHIN GROUP(ORDER BY wait_days) OVER() median,PERCENTILE_CONT(.75) WITHIN GROUP(ORDER BY wait_days) OVER() p75 FROM facts WHERE has_ref AND referenced IS NOT NULL UNION ALL SELECT DISTINCT 'gained',COUNT(*) OVER(),PERCENTILE_CONT(.25) WITHIN GROUP(ORDER BY wait_days) OVER(),PERCENTILE_CONT(.5) WITHIN GROUP(ORDER BY wait_days) OVER(),PERCENTILE_CONT(.75) WITHIN GROUP(ORDER BY wait_days) OVER() FROM facts WHERE has_ref AND wait_days>0"""))
build('first_versions',"SELECT * FROM (SELECT s.*,ROW_NUMBER() OVER(PARTITION BY s.page_id,s.slot ORDER BY s.a,s.born_rev,s.hash,s.dup) rn FROM stays s JOIN origins o ON o.page_id=s.page_id AND o.slot=s.slot WHERE s.a=o.written) z WHERE rn=1",'ADD PRIMARY KEY(page_id,slot)')
build('first_refs',"SELECT * FROM (SELECT s.*,ROW_NUMBER() OVER(PARTITION BY s.page_id,s.slot ORDER BY s.a,s.born_rev,s.hash,s.dup) rn FROM stays s JOIN origins o ON o.page_id=s.page_id AND o.slot=s.slot WHERE s.a=o.referenced AND s.has_ref) z WHERE rn=1",'ADD PRIMARY KEY(page_id,slot)')
out('oldest-unsourced','Oldest currently unreferenced prose paragraphs','paragraphs',q('oldest-unsourced',"SELECT f.page_id,f.slot,r.title,f.written,e.user author,v.born_rev,CONCAT('https://fi.wikipedia.org/?oldid=',v.born_rev) oldid,LEFT(t.text,600) excerpt,f.referenced previously_referenced FROM facts f JOIN first_versions v USING(page_id,slot) JOIN wtt.passage_text t ON t.hash=f.hash JOIN wtt.revision r ON r.page_id=f.page_id LEFT JOIN wtt.edit e ON e.rev_id=v.born_rev WHERE NOT f.has_ref ORDER BY written,f.page_id,f.slot LIMIT 25"))
# Targeted extraction; no second wikitext scan.
out('reference-input','Current paragraph and first-reference evidence','paragraphs',q('reference-input',"""SELECT f.page_id,f.slot,HEX(f.hash) current_hash,r.title,f.written,f.referenced,f.wait_days,v.born_rev written_rev,ev.user written_by,fr.born_rev reference_rev,er.user reference_by,HEX(fr.hash) reference_hash,t.wikitext first_ref_wikitext,t.text after_text,t0.text original_text,tc.wikitext current_wikitext,tc.text current_text FROM facts f JOIN first_versions v USING(page_id,slot) JOIN first_refs fr USING(page_id,slot) JOIN wtt.passage_text t ON t.hash=fr.hash JOIN wtt.passage_text t0 ON t0.hash=v.hash JOIN wtt.passage_text tc ON tc.hash=f.hash JOIN wtt.revision r ON r.page_id=f.page_id LEFT JOIN wtt.edit ev ON ev.rev_id=v.born_rev LEFT JOIN wtt.edit er ON er.rev_id=fr.born_rev WHERE f.has_ref"""))
build('pre_refs',"SELECT * FROM (SELECT s.page_id,s.slot,s.hash,s.a,s.b,s.born_rev,ROW_NUMBER() OVER(PARTITION BY s.page_id,s.slot ORDER BY s.a DESC,s.born_rev DESC,s.hash) rn FROM stays s JOIN first_refs f ON f.page_id=s.page_id AND f.slot=s.slot WHERE s.a<f.a AND s.b>=f.a AND NOT s.has_ref) z WHERE rn=1",'ADD PRIMARY KEY(page_id,slot)')
out('pre-reference-input','Immediately preceding unsourced wording','paragraphs',q('pre-reference-input','SELECT p.page_id,p.slot,p.a,p.b,p.born_rev,t.text before_text,t.wikitext before_wikitext FROM pre_refs p JOIN wtt.passage_text t ON t.hash=p.hash'))
out('integrity','Extraction integrity','rows',q('integrity',"SELECT (SELECT COUNT(*) FROM raw) raw_rows,(SELECT COUNT(*) FROM stays) merged_stays,(SELECT COUNT(*) FROM flags) wording_count,(SELECT COUNT(*) FROM origins) historical_slots,(SELECT COUNT(*) FROM facts WHERE written IS NULL) missing_origin,(SELECT COUNT(*) FROM (SELECT page_id,slot,COUNT(*) n FROM current GROUP BY page_id,slot HAVING n>1) x) duplicate_current_slots"))
c.close()
