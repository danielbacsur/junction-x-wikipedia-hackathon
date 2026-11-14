SELECT r.page_id,HEX(r.hash) hash,r.s,r.e FROM raw r JOIN spread t USING(hash) WHERE t.articles>=2 ORDER BY r.page_id,r.hash,r.s,r.e;
