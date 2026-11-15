-- Run as root. Creates the lab database and its two small helper tables.
CREATE DATABASE IF NOT EXISTS lab_history_at_scale;
GRANT ALL ON lab_history_at_scale.* TO 'wtt'@'%';
USE lab_history_at_scale;

-- how many passage rows each article has, over all time and today
CREATE TABLE IF NOT EXISTS page_rows (PRIMARY KEY (page_id)) AS
  SELECT page_id, COUNT(*) AS rows_all, SUM(row_end > NOW()) AS rows_now,
         MIN(row_start) AS first_start
  FROM wtt.passage FOR SYSTEM_TIME ALL
  GROUP BY page_id;

-- 300 wordings spread over every wording that ever stood. The order of
-- CRC32(hash) is fixed, so the list is the same on every rebuild.
CREATE TABLE IF NOT EXISTS cand (hash BINARY(8) NOT NULL PRIMARY KEY) AS
  SELECT hash FROM (SELECT DISTINCT hash FROM wtt.passage FOR SYSTEM_TIME ALL) AS h
  ORDER BY CRC32(hash), hash LIMIT 300;
