SELECT COUNT(*) n FROM (SELECT a,LAG(b) OVER(PARTITION BY page_id,hash,dup ORDER BY a,b) prev_b FROM stays) z WHERE prev_b>=a;
