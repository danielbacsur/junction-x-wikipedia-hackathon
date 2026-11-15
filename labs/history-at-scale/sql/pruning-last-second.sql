-- Does AS OF pruning keep the partition of the year the moment falls in?
-- Run as root:  docker exec -i wikipedia-through-time-mariadb-1 mariadb -uroot -pwtt -t --force < sql/pruning-last-second.sql
USE lab_history_at_scale;
SET time_zone = '+00:00';
DROP TABLE IF EXISTS t_edge;
CREATE TABLE t_edge (
  id INT PRIMARY KEY, v INT,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end)
) WITH SYSTEM VERSIONING
  PARTITION BY SYSTEM_TIME INTERVAL 1 YEAR STARTS '2003-01-01 00:00:00' PARTITIONS 25;
SET system_versioning_insert_history = 1;
INSERT INTO t_edge (id, v, row_start, row_end) VALUES
  (1, 1, '2005-01-01 00:00:00', '2006-12-31 23:59:59.500000'),  -- ends half a second after the moment
  (2, 1, '2005-01-01 00:00:00', '2006-12-31 23:59:59.000000'),  -- ends exactly at the moment
  (3, 1, '2005-01-01 00:00:00', '2006-07-01 00:00:00'),          -- ended earlier that year
  (4, 1, '2005-01-01 00:00:00', '2007-03-01 00:00:00');          -- ends the year after
SET system_versioning_insert_history = 0;
SELECT partition_name, partition_description, table_rows FROM information_schema.partitions
WHERE table_schema = 'lab_history_at_scale' AND table_name = 't_edge' AND table_rows > 0;

-- rows 1 and 4 stood at 2006-12-31 23:59:59
EXPLAIN PARTITIONS SELECT id FROM t_edge FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59';
SELECT 'as of 23:59:59' AS q, id, row_end FROM t_edge FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59' ORDER BY id;
-- rows 1, 2, 3 and 4 stood in the middle of 2006
EXPLAIN PARTITIONS SELECT id FROM t_edge FOR SYSTEM_TIME AS OF TIMESTAMP '2006-06-30 12:00:00';
SELECT 'as of mid 2006' AS q, id, row_end FROM t_edge FOR SYSTEM_TIME AS OF TIMESTAMP '2006-06-30 12:00:00' ORDER BY id;
-- the row is there
SELECT 'p3 holds' AS q, id, row_end FROM t_edge PARTITION (p3);

-- control: the same rows without partitions return rows 1 and 4
DROP TABLE IF EXISTS t_edge_flat;
CREATE TABLE t_edge_flat (
  id INT PRIMARY KEY, v INT,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end)
) WITH SYSTEM VERSIONING;
SET system_versioning_insert_history = 1;
INSERT INTO t_edge_flat (id, v, row_start, row_end) VALUES
  (1, 1, '2005-01-01 00:00:00', '2006-12-31 23:59:59.500000'),
  (2, 1, '2005-01-01 00:00:00', '2006-12-31 23:59:59.000000'),
  (3, 1, '2005-01-01 00:00:00', '2006-07-01 00:00:00'),
  (4, 1, '2005-01-01 00:00:00', '2007-03-01 00:00:00');
SET system_versioning_insert_history = 0;
SELECT 'flat, as of 23:59:59' AS q, id, row_end FROM t_edge_flat
FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59' ORDER BY id;
-- and with the fraction written out
SELECT 'partitioned, 23:59:59.000000' AS q, id, row_end FROM t_edge
FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59.000000' ORDER BY id;
SELECT 'partitioned, 23:59:58.999999' AS q, id, row_end FROM t_edge
FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:58.999999' ORDER BY id;
DROP TABLE t_edge, t_edge_flat;
