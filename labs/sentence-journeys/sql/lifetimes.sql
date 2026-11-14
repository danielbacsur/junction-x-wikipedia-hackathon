CREATE TABLE lifetimes AS
 WITH previous AS (SELECT *,MAX(e) OVER(PARTITION BY page_id,hash,dup ORDER BY s,e ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) prior_end FROM raw),
 groups AS (SELECT *,SUM(prior_end IS NULL OR s>prior_end) OVER(PARTITION BY page_id,hash,dup ORDER BY s,e) g FROM previous)
 SELECT page_id,hash,dup,g,MIN(s) s,MAX(e) e,SUBSTRING_INDEX(GROUP_CONCAT(born_rev ORDER BY s,e),',',1)+0 born_rev FROM groups GROUP BY page_id,hash,dup,g;
