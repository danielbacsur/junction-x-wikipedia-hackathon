CREATE TABLE islands AS SELECT m.*,SUM(IF(previous_end>=a,0,1)) OVER(PARTITION BY page_id,slot,hash,dup ORDER BY a,b) island FROM marked m;
