CREATE TABLE firsts AS SELECT page_id,hash,MIN(s) first_at,SUBSTRING_INDEX(GROUP_CONCAT(born_rev ORDER BY s),',',1)+0 born_rev,MAX(e>'2100-01-01') current FROM presence GROUP BY page_id,hash;
