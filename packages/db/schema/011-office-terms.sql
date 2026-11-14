-- Terms of office as the infoboxes of Finnish Wikipedia stated them, on two
-- timelines at once. Valid time is when the term was: the first day in
-- office and the day it ended. System time is when Wikipedia said so: a row
-- starts at the edit that first stated the term and ends at the edit that
-- changed or removed it. One row is the lifetime of one statement, so the
-- 25,715 times a version repeated a term collapse into 102 rows.
CREATE TABLE IF NOT EXISTS office_term (
  page_id     INT UNSIGNED NOT NULL,             -- the article that makes the statement
  person      VARCHAR(255) NOT NULL,             -- its title
  office      VARCHAR(64)  NOT NULL,             -- acting holders end in " (vt.)"
  valid_from  DATE         NOT NULL,             -- stated first day in office

  -- The stated last day, exclusive, as MariaDB periods are. The infobox
  -- writes "1.3.1956–27.1.1982" and the successor's starts "27.1.1982":
  -- stored as written the two rows meet, and the handover day belongs to
  -- the successor.
  valid_to    DATE         NOT NULL,

  -- A period column cannot be NULL, so "still in office" is stored as
  -- 9999-12-31 and flagged here. Everything that shows a term hides it.
  open_ended  BOOL         NOT NULL,

  rev_id      INT UNSIGNED NOT NULL,             -- the version that first said it
  seq         INT UNSIGNED NOT NULL,
  editor      VARCHAR(255),                      -- who saved that version
  editor_kind ENUM('named', 'ip', 'temp', 'hidden') NOT NULL,
  comment     VARCHAR(1000),                     -- their edit summary
  versions    INT UNSIGNED NOT NULL,             -- accepted versions that repeated it
  source_text VARCHAR(600) NOT NULL,             -- the infobox field as first written
  row_start   TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end     TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  PERIOD FOR valid_time (valid_from, valid_to),

  -- The key is the article, the office and the stated period. One article
  -- may state several terms of one office (Kekkonen led five governments)
  -- but never two that overlap. It stops at the article on purpose: two
  -- articles may disagree about who held the office on a day, and that
  -- disagreement is what the table is for. A key across articles was tried
  -- and refused real history at ten moments, each an editor between
  -- changing one president's article and the next.
  --
  -- MariaDB adds row_end to this key, so WITHOUT OVERLAPS only compares
  -- rows that end together: it guards what is stated now and does not make
  -- the history consistent.
  PRIMARY KEY (page_id, office, valid_time WITHOUT OVERLAPS),
  KEY (office, valid_from, valid_to)
) WITH SYSTEM VERSIONING;

-- What the parser refused to read as a term, with the same system time, so
-- every stretch the table is silent about has its reason on record.
CREATE TABLE IF NOT EXISTS office_unparsed (
  page_id   INT UNSIGNED NOT NULL,
  person    VARCHAR(255) NOT NULL,
  office    VARCHAR(64)  NOT NULL,
  raw_text  VARCHAR(200) NOT NULL,               -- the field without links and markup
  reason    VARCHAR(40)  NOT NULL,
  rev_id    INT UNSIGNED NOT NULL,
  editor    VARCHAR(255),
  comment   VARCHAR(1000),
  versions  INT UNSIGNED NOT NULL,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  KEY (page_id, office)
) WITH SYSTEM VERSIONING;
