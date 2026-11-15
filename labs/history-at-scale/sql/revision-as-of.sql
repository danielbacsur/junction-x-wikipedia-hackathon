-- The other versioned table: one current row per article, every earlier
-- version a history row with its wikitext. Never SELECT * here.
USE wtt;
SET time_zone = '+00:00';

EXPLAIN SELECT rev_id, title, bytes FROM revision
FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' WHERE page_id = 1256;

FLUSH STATUS;
SELECT rev_id, title, bytes FROM revision
FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' WHERE page_id = 1256;
SHOW SESSION STATUS WHERE Variable_name LIKE 'Handler_read%' AND Value > 0
   OR Variable_name LIKE 'Handler_icp%';

-- the same through the product's extra index
EXPLAIN SELECT rev_id, title, bytes FROM revision
FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' AS r FORCE INDEX (page_id) WHERE page_id = 1256;
FLUSH STATUS;
SELECT rev_id, title, bytes FROM revision
FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' AS r FORCE INDEX (page_id) WHERE page_id = 1256;
SHOW SESSION STATUS WHERE Variable_name LIKE 'Handler_read%' AND Value > 0
   OR Variable_name LIKE 'Handler_icp%';

-- today's version
EXPLAIN SELECT rev_id, title, bytes FROM revision WHERE page_id = 1256;
FLUSH STATUS;
SELECT rev_id, title, bytes FROM revision WHERE page_id = 1256;
SHOW SESSION STATUS WHERE Variable_name LIKE 'Handler_read%' AND Value > 0;

SELECT table_name, table_rows, ROUND(data_length / 1048576) AS data_mib,
       ROUND(index_length / 1048576) AS index_mib
FROM information_schema.tables
WHERE table_schema = 'wtt' AND table_name IN ('revision', 'passage', 'passage_text', 'edit');
