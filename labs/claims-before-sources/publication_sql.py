# /// script
# dependencies = ["pymysql"]
# ///
import pathlib
p=pathlib.Path(__file__).parent
exec((p/'run.py').read_text().split("q('database'")[0])
timings=json.loads((BASE/'data'/'timings.json').read_text())['rows']
q('use-publication','USE lab_claims_before_sources')
q('drop-citation_dates','DROP TABLE IF EXISTS citation_dates')
q('create-citation_dates','CREATE TABLE citation_dates(page_id INT,slot INT,reference_index INT,written_year INT,publication_year INT NULL,unresolved_named INT,PRIMARY KEY(page_id,slot,reference_index))')
rs=json.loads((BASE/'cache'/'citation-facts-input.json').read_text())['rows']
sql='INSERT INTO citation_dates VALUES (%s,%s,%s,%s,%s,%s)'
(BASE/'sql/insert-citation_dates.sql').write_text('-- Parameterized executemany; exact parameters in cache/citation-facts-input.json\n'+sql+';\n')
start=time.monotonic()
with c.cursor() as cur:
 for i in range(0,len(rs),1000):cur.executemany(sql,[tuple(r[k] for k in ['page_id','slot','reference_index','written_year','publication_year','unresolved_named']) for r in rs[i:i+1000]])
timings.append(dict(query='insert-citation_dates',seconds=round(time.monotonic()-start,4),rows=len(rs)))
out('publication-sql-summary','SQL aggregation of parsed publication years','reference occurrences',q('publication-sql-summary','SELECT COUNT(*) references_n,COUNT(publication_year) parsed_n,100*COUNT(publication_year)/COUNT(*) parsed_pct,SUM(unresolved_named) unresolved_named,SUM(publication_year>2026) future_years,SUM(publication_year>written_year) positive_gap,SUM(publication_year=written_year) zero_gap,SUM(publication_year<written_year) negative_gap FROM citation_dates'))
out('publication-year-gap','Publication year minus slot birth year, all current dated references','reference occurrences',q('publication-year-gap','SELECT publication_year-written_year year_gap,COUNT(*) references_n FROM citation_dates WHERE publication_year IS NOT NULL GROUP BY year_gap ORDER BY year_gap'))
out('publication-quantiles','Current parsed publication-year gap quantiles','years',q('publication-quantiles','SELECT DISTINCT COUNT(*) OVER() n,PERCENTILE_CONT(.25) WITHIN GROUP(ORDER BY publication_year-written_year) OVER() p25,PERCENTILE_CONT(.5) WITHIN GROUP(ORDER BY publication_year-written_year) OVER() median,PERCENTILE_CONT(.75) WITHIN GROUP(ORDER BY publication_year-written_year) OVER() p75 FROM citation_dates WHERE publication_year IS NOT NULL'))
c.close()
