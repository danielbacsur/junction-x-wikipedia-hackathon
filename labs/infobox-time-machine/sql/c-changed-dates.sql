WITH history AS (
 SELECT page_id,title,template,slot,field,fact_date,`precision`,row_start,
 LAG(fact_date) OVER w AS previous_date,
 LAG(`precision`) OVER w AS previous_precision,
 LAG(row_end) OVER w AS previous_end
 FROM statement FOR SYSTEM_TIME ALL
 WHERE field IN ('syntynyt','syntymäaika','kuollut','kuolinaika','perustettu')
 WINDOW w AS (PARTITION BY page_id,template,slot,field ORDER BY row_start)
)
SELECT page_id,title,field,COUNT(*) AS changes,MAX(ABS(DATEDIFF(fact_date,previous_date))) AS largest_days
FROM history WHERE `precision`='day' AND previous_precision='day'
 AND previous_end=row_start AND fact_date<>previous_date
GROUP BY page_id,title,field ORDER BY changes DESC,page_id,field LIMIT 100;
