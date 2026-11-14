WITH ordered AS (
 SELECT page_id,seq,saved_at,revert_at,MAX(revert_at) OVER(PARTITION BY page_id ORDER BY saved_at,seq ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) previous_end
 FROM lab_exposure_clock.fact),
 marked AS (SELECT *,CASE WHEN previous_end IS NULL OR saved_at>previous_end THEN 1 ELSE 0 END new_group FROM ordered),
 grouped AS (SELECT *,SUM(new_group) OVER(PARTITION BY page_id ORDER BY saved_at,seq ROWS UNBOUNDED PRECEDING) island FROM marked),
 intervals AS (SELECT page_id,island,MIN(saved_at) start_at,MAX(revert_at) end_at FROM grouped GROUP BY page_id,island),
 years AS (SELECT DISTINCT YEAR(saved_at) year FROM wtt.edit)
 SELECT y.year,SUM(TIMESTAMPDIFF(SECOND,GREATEST(i.start_at,MAKEDATE(y.year,1)),LEAST(i.end_at,MAKEDATE(y.year+1,1))))/3600 article_hours
 FROM years y JOIN intervals i ON i.start_at<MAKEDATE(y.year+1,1) AND i.end_at>MAKEDATE(y.year,1)
 GROUP BY y.year ORDER BY y.year;
