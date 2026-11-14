SELECT p.page_id,HEX(p.hash) hash,p.s,p.e FROM presence p JOIN spread t USING(hash) WHERE t.articles>=2 ORDER BY p.page_id,p.hash,p.s;
