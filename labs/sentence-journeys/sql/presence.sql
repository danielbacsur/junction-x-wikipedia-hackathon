CREATE TABLE presence AS
 WITH previous AS (SELECT *,MAX(e) OVER(PARTITION BY page_id,hash ORDER BY s,e,dup ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) prior_end FROM lifetimes),
 groups AS (SELECT *,SUM(prior_end IS NULL OR s>prior_end) OVER(PARTITION BY page_id,hash ORDER BY s,e,dup) island FROM previous)
 SELECT page_id,hash,island,MIN(s) s,MAX(e) e,SUBSTRING_INDEX(GROUP_CONCAT(born_rev ORDER BY s,e,dup),',',1)+0 born_rev FROM groups GROUP BY page_id,hash,island;
