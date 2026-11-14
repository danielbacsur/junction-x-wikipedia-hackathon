-- How many wordings each stem appears in. MariaDB's full-text search takes
-- 25 seconds when a question holds words that are in most rows, such as
-- "oli" or "suomen", and 50 ms without them. Search looks its words up
-- here first and only sends the rare ones, which are the ones that matter.
CREATE TABLE IF NOT EXISTS term (
  stem VARCHAR(100) NOT NULL COLLATE utf8mb4_bin,
  df   INT UNSIGNED NOT NULL,                    -- wordings that contain it
  PRIMARY KEY (stem)
);
