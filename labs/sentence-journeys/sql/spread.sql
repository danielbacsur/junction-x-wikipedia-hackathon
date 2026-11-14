CREATE TABLE spread AS SELECT hash,COUNT(*) articles,SUM(current) current_articles FROM firsts GROUP BY hash;
