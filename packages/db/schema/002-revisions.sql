-- Every saved version of an article. The table holds one row per article,
-- what wikipedia shows today, and MariaDB keeps each earlier version as a
-- history row stamped with the moment it was saved on wikipedia.
CREATE TABLE IF NOT EXISTS revision (
  page_id   INT UNSIGNED NOT NULL,
  title     VARCHAR(255) NOT NULL,               -- changes when a page is renamed
  rev_id    INT UNSIGNED NOT NULL,
  parent_id INT UNSIGNED,
  user      VARCHAR(255),                        -- name, ip or temporary account
  anonymous BOOL         NOT NULL DEFAULT 0,
  comment   VARCHAR(1000),                       -- the edit summary
  minor     BOOL         NOT NULL DEFAULT 0,
  sha1      CHAR(31),                            -- same hash, same text
  bytes     INT UNSIGNED NOT NULL DEFAULT 0,
  text      MEDIUMTEXT COMPRESSED NOT NULL,      -- raw wikitext
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  PRIMARY KEY (page_id),

  -- MariaDB's own history index ends in row_end, so "as of 2005" walks
  -- every later version. This one lets it start from the other end.
  KEY (page_id, row_start),
  KEY (rev_id)
) WITH SYSTEM VERSIONING;
