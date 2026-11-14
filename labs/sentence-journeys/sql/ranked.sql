CREATE TABLE ranked AS SELECT f.*,ROW_NUMBER() OVER(PARTITION BY f.hash ORDER BY first_at,page_id) pos FROM firsts f JOIN spread s USING(hash) WHERE s.articles>=2;
