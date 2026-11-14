-- How much history each article has, counted once. Search uses it to put
-- the article people most likely mean first among equal title matches,
-- and the list of longest histories reads it instead of counting 862,076
-- edits again.
CREATE TABLE IF NOT EXISTS page_stats (
  page_id    INT UNSIGNED NOT NULL,
  edits      INT UNSIGNED NOT NULL,
  editors    INT UNSIGNED NOT NULL,
  reverts    INT UNSIGNED NOT NULL,
  first_edit DATETIME(6)  NOT NULL,
  last_edit  DATETIME(6)  NOT NULL,
  PRIMARY KEY (page_id),
  KEY (edits)
);
