-- Every distinct wording that ever stood in an article, stored once and
-- found by the hash of its wikitext. This table is not versioned on
-- purpose: MariaDB's full-text index skips history rows, so the words of
-- the past have to live in ordinary rows to be searchable.
CREATE TABLE IF NOT EXISTS passage_text (
  hash     BINARY(8)    NOT NULL,                -- first 8 bytes of the sha1
  kind     ENUM('prose', 'list', 'heading', 'table', 'template', 'file',
                'meta', 'markup', 'end') NOT NULL,
  chars    INT UNSIGNED NOT NULL,                -- length of the clean text
  wikitext MEDIUMTEXT COMPRESSED NOT NULL,       -- exactly as it was saved
  text     MEDIUMTEXT   NOT NULL,                -- what a reader sees
  stems    MEDIUMTEXT   NOT NULL,                -- finnish stems of the text
  PRIMARY KEY (hash),
  FULLTEXT (stems)
);

-- Which wordings an article consisted of, and when. A row lives exactly as
-- long as its wording stands in the article: it is inserted by the edit
-- that wrote it and ended by the edit that changed or removed it, so its
-- history rows are the lifetimes of a paragraph. Asking for a date returns
-- the article as it was built that day.
CREATE TABLE IF NOT EXISTS passage (
  page_id   INT UNSIGNED NOT NULL,
  hash      BINARY(8)    NOT NULL,               -- the wording, in passage_text
  dup       SMALLINT UNSIGNED NOT NULL,          -- nth copy within the article
  ord       VARBINARY(255) NOT NULL,             -- sorts the article's blocks
  gap       INT UNSIGNED NOT NULL,               -- empty lines right before it
  rev_id    INT UNSIGNED NOT NULL,               -- version that set this row
  born_rev  INT UNSIGNED NOT NULL,               -- version that wrote the wording

  -- An interpretation, not evidence: which earlier wording this one most
  -- likely replaced, and how alike the two are.
  slot      INT UNSIGNED NOT NULL,
  prev_hash BINARY(8),
  sim       FLOAT,

  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  PRIMARY KEY (page_id, hash, dup),
  KEY (hash),
  KEY (page_id, slot),
  KEY (born_rev)
) WITH SYSTEM VERSIONING;
