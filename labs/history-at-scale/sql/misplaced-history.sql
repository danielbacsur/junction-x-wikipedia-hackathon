-- History loaded before the partitions exist is silently lost to AS OF.
-- Run as root:  docker exec -i wikipedia-through-time-mariadb-1 mariadb -uroot -pwtt -t --force < sql/misplaced-history.sql
USE lab_history_at_scale;
SET time_zone = '+00:00';
DROP TABLE IF EXISTS t_auto;

-- One history partition per year, made on demand (AUTO). Right after
-- CREATE the table has one history partition, p0, for 2003.
CREATE TABLE t_auto (
  id INT PRIMARY KEY, v INT,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end)
) WITH SYSTEM VERSIONING
  PARTITION BY SYSTEM_TIME INTERVAL 1 YEAR STARTS '2003-01-01 00:00:00' AUTO;

-- A loader writes old history. No warning. All three rows go to p0,
-- also the one that ended in 2010.
SET system_versioning_insert_history = 1;
INSERT INTO t_auto (id, v, row_start, row_end) VALUES
  (1, 1, '2004-05-01', '2005-06-01'),
  (2, 1, '2004-05-01', '2010-06-01'),
  (3, 1, '2003-02-01', '2003-03-01');
SHOW WARNINGS;
INSERT INTO t_auto (id, v, row_start) VALUES (1, 2, '2005-06-01'), (4, 2, '2005-06-01');
SET system_versioning_insert_history = 0;

SELECT partition_name, partition_description, table_rows
FROM information_schema.partitions
WHERE table_schema = 'lab_history_at_scale' AND table_name = 't_auto';

-- Correct so far: row 2 stood on 31 Dec 2008.
SELECT 'before the update' AS moment, id, row_start, row_end
FROM t_auto FOR SYSTEM_TIME AS OF TIMESTAMP '2008-12-31 00:00:00' ORDER BY id;

-- One ordinary update today. AUTO now creates p1 … p23.
UPDATE t_auto SET v = 3 WHERE id = 4;

SELECT COUNT(*) AS history_partitions
FROM information_schema.partitions
WHERE table_schema = 'lab_history_at_scale' AND table_name = 't_auto'
  AND partition_description <> 'CURRENT';

-- Wrong now: the same question no longer returns row 2. Pruning trusts
-- that p0 only holds rows that ended in 2003 and skips it.
EXPLAIN PARTITIONS SELECT id FROM t_auto
FOR SYSTEM_TIME AS OF TIMESTAMP '2008-12-31 00:00:00';
SELECT 'after the update' AS moment, id, row_start, row_end
FROM t_auto FOR SYSTEM_TIME AS OF TIMESTAMP '2008-12-31 00:00:00' ORDER BY id;

-- The row is still there.
SELECT 'in p0' AS place, id, row_start, row_end FROM t_auto PARTITION (p0);

-- The same load into partitions that exist beforehand places every row
-- by the year it ended in, and AS OF stays right.
DROP TABLE IF EXISTS t_year;
CREATE TABLE t_year (
  id INT PRIMARY KEY, v INT,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end)
) WITH SYSTEM VERSIONING
  PARTITION BY SYSTEM_TIME INTERVAL 1 YEAR STARTS '2003-01-01 00:00:00' PARTITIONS 25;
SET system_versioning_insert_history = 1;
INSERT INTO t_year (id, v, row_start, row_end) VALUES
  (1, 1, '2004-05-01', '2005-06-01'),
  (2, 1, '2004-05-01', '2010-06-01'),
  (3, 1, '2003-02-01', '2003-03-01');
SET system_versioning_insert_history = 0;
SELECT partition_name, partition_description, table_rows
FROM information_schema.partitions
WHERE table_schema = 'lab_history_at_scale' AND table_name = 't_year' AND table_rows > 0;
SELECT 'preallocated' AS moment, id, row_start, row_end
FROM t_year FOR SYSTEM_TIME AS OF TIMESTAMP '2008-12-31 00:00:00' ORDER BY id;

-- LIMIT partitions do not rotate on a history load either, and have no
-- time bounds to prune by.
DROP TABLE IF EXISTS t_lim;
CREATE TABLE t_lim (
  id INT PRIMARY KEY, v INT,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end)
) WITH SYSTEM VERSIONING PARTITION BY SYSTEM_TIME LIMIT 2 PARTITIONS 4;
SET system_versioning_insert_history = 1;
INSERT INTO t_lim (id, v, row_start, row_end) VALUES
  (1, 1, '2004-05-01', '2005-06-01'), (2, 1, '2004-05-01', '2010-06-01'),
  (3, 1, '2003-02-01', '2003-03-01'), (6, 1, '2003-02-01', '2026-10-01 10:00:00'),
  (7, 1, '2003-02-01', '2020-10-01 10:00:00'), (8, 1, '2003-02-01', '2021-10-01 10:00:00'),
  (9, 1, '2003-02-01', '2022-10-01 10:00:00');
SHOW WARNINGS;
SET system_versioning_insert_history = 0;
SELECT partition_name, table_rows FROM information_schema.partitions
WHERE table_schema = 'lab_history_at_scale' AND table_name = 't_lim';
EXPLAIN PARTITIONS SELECT * FROM t_lim FOR SYSTEM_TIME AS OF TIMESTAMP '2020-12-31 00:00:00';

-- What ALTER allows on a versioned, partitioned table.
ALTER TABLE t_year ADD KEY (v);                -- allowed
ALTER TABLE t_year ADD COLUMN w INT;           -- ERROR 4119 until the next line
SET system_versioning_alter_history = KEEP;
ALTER TABLE t_year ADD COLUMN w INT;           -- allowed now
ALTER TABLE t_year DROP PARTITION p0;          -- drops the rows that ended in 2003
CREATE TABLE IF NOT EXISTS t_parent (id INT PRIMARY KEY);
ALTER TABLE t_year ADD FOREIGN KEY (id) REFERENCES t_parent (id);  -- ERROR 1506
SELECT id FROM t_year PARTITION (p1) FOR SYSTEM_TIME ALL;           -- ERROR 4142

DROP TABLE IF EXISTS t_auto, t_year, t_lim, t_parent, t_sub;
