WITH history AS (
 SELECT page_id,title,template,slot,field,value,rev_id,row_start,
 SHA2(raw_value,256) AS hash,
 LAG(SHA2(raw_value,256),1) OVER w AS previous_hash,
 LAG(SHA2(raw_value,256),2) OVER w AS older_hash,
 LAG(row_end,1) OVER w AS previous_end,
 LAG(row_end,2) OVER w AS older_end,
 LAG(row_start,1) OVER w AS previous_start
 FROM statement FOR SYSTEM_TIME ALL
 WINDOW w AS (PARTITION BY page_id,template,slot,field ORDER BY row_start)
)
SELECT page_id,title,template,field,value,rev_id,row_start
FROM history WHERE hash=older_hash AND hash<>previous_hash
 AND previous_end=row_start AND older_end=previous_start
ORDER BY row_start DESC,page_id,template,slot,field LIMIT 100;
