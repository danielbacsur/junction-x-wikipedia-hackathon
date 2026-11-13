-- One slim row per saved version, without the text. The timeline, the
-- revert counts and every statistic read this instead of walking 6 GB of
-- article history. Filled from the revision table by one statement.
CREATE TABLE IF NOT EXISTS edit (
  page_id   INT UNSIGNED NOT NULL,
  seq       INT UNSIGNED NOT NULL,               -- 1 is the first version
  rev_id    INT UNSIGNED NOT NULL,
  saved_at  DATETIME(6)  NOT NULL,
  ended_at  DATETIME(6),                         -- null while it is current
  user      VARCHAR(255),
  editor    ENUM('named', 'ip', 'temp', 'hidden') NOT NULL,
  minor     BOOL         NOT NULL,
  bytes     INT UNSIGNED NOT NULL,
  delta     INT          NOT NULL,               -- bytes gained or lost
  sha1      CHAR(31),
  comment   VARCHAR(1000),

  -- A version that brings back an earlier text is a revert. It restores
  -- that earlier version and undoes every version in between.
  restores  INT UNSIGNED,                        -- seq of the text it brings back
  undone_by INT UNSIGNED,                        -- seq of the revert that removed it

  PRIMARY KEY (page_id, seq),
  UNIQUE KEY (rev_id),
  KEY (page_id, saved_at),
  KEY (saved_at),
  KEY (user)
);
