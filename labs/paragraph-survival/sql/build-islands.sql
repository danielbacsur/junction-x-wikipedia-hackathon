CREATE TABLE islands AS SELECT r.*,SUM(new_stay) OVER(PARTITION BY page_id,hash,dup ORDER BY a,b ROWS UNBOUNDED PRECEDING) island FROM
(SELECT raw.*,IF(LAG(b) OVER(PARTITION BY page_id,hash,dup ORDER BY a,b)=a,0,1) new_stay FROM raw WHERE b>a) r;
