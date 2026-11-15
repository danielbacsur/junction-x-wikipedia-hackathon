-- Where history rows live. Run as root (information_schema.innodb_* needs it).
USE lab_history_at_scale;
SET time_zone = '+00:00';

-- The key columns InnoDB stores for each index of the flat copy. row_end is
-- the last column of the primary key, so it is also the tail of every
-- secondary index entry.
SELECT i.name AS index_name, GROUP_CONCAT(f.name ORDER BY f.pos) AS declared_columns, i.n_fields
FROM information_schema.innodb_sys_tables AS t
JOIN information_schema.innodb_sys_indexes AS i USING (table_id)
JOIN information_schema.innodb_sys_fields AS f USING (index_id)
WHERE t.name = 'lab_history_at_scale/p_flat'
GROUP BY i.index_id;

-- One wording of Talvisota in primary key order: history rows and the
-- current row of the same block sit next to each other.
SELECT HEX(hash) AS hash, dup, row_start, row_end, row_end > NOW() AS current
FROM p_flat FOR SYSTEM_TIME ALL
WHERE page_id = 1256
ORDER BY hash, dup, row_end
LIMIT 12;

-- A read of today's article walks all of them: rows read against rows returned.
FLUSH STATUS;
SELECT COUNT(*) AS blocks_today, MAX(born_rev) FROM p_flat WHERE page_id = 1256;
SHOW SESSION STATUS LIKE 'Handler_read%';

-- What the server adds to a current read and to an AS OF read.
EXPLAIN EXTENDED SELECT COUNT(*), MAX(born_rev) FROM p_flat WHERE page_id = 1256;
SHOW WARNINGS;
EXPLAIN EXTENDED SELECT COUNT(*), MAX(born_rev) FROM p_flat
FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' WHERE page_id = 1256;
SHOW WARNINGS;

-- The share of the whole table a current read has to step over.
SELECT COUNT(*) AS rows_all, SUM(row_end > NOW()) AS rows_now,
       ROUND(COUNT(*) / SUM(row_end > NOW()), 2) AS all_per_current
FROM p_flat FOR SYSTEM_TIME ALL;
