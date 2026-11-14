# /// script
# dependencies = ["pymysql"]
# ///
import pathlib
# Reuse only connection/SQL-output helpers, without running the extraction.
p=pathlib.Path(__file__).parent
exec((p/'run.py').read_text().split("q('database'")[0])
timings=json.loads((BASE/'data'/'timings.json').read_text())['rows']
q('use-refine','USE lab_claims_before_sources')
out('surviving-sourcing-by-year','Current surviving paragraph birth cohorts','paragraphs and percent',json.loads((BASE/'data'/'sourcing-by-year.json').read_text())['rows'])
out('sourcing-by-year','All observed new prose paragraph slots, including later removed','paragraphs and percent',q('all-sourcing-by-year',"SELECT YEAR(o.written) year,COUNT(*) paragraphs,SUM(COALESCE(o.referenced=o.written,0)) born_referenced,100*SUM(COALESCE(o.referenced=o.written,0))/COUNT(*) born_referenced_pct FROM origins o JOIN first_versions v USING(page_id,slot) WHERE v.kind='prose' AND v.chars>=80 GROUP BY YEAR(o.written)"))
build('slot_gaps',"SELECT page_id,slot,a,previous_end FROM (SELECT page_id,slot,a,MAX(b) OVER(PARTITION BY page_id,slot ORDER BY a,b ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) previous_end FROM stays) x WHERE a>previous_end",'ADD INDEX(page_id,slot,a)')
out('gap-input','Removed-then-restored paragraph slots before first reference','slots',q('gap-input','SELECT o.page_id,o.slot,COUNT(*) gaps,SUM(TIMESTAMPDIFF(SECOND,g.previous_end,g.a))/86400 absent_days FROM origins o JOIN slot_gaps g USING(page_id,slot) WHERE g.a<=o.referenced GROUP BY o.page_id,o.slot'))
out('never-unsourced-age','No current reference and no reference in observed slot history','paragraphs',q('never-unsourced-age',"SELECT SUM(written<='2021-10-01') years5,SUM(written<='2016-10-01') years10,SUM(written<='2011-10-01') years15 FROM facts WHERE NOT has_ref AND referenced IS NULL"))
c.close()
