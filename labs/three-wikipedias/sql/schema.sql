-- The lab's tables. Small: one row per extracted fact.
CREATE OR REPLACE TABLE lab_three_wikipedias.topic (
  qid        VARCHAR(20) NOT NULL PRIMARY KEY,
  kind       ENUM('lifespan','other') NOT NULL,   -- lifespan: the Finnish lead and one more open with birth or death
  langs      VARCHAR(8) NOT NULL,                 -- 'en,fi', 'fi,sv' or 'en,fi,sv'
  fi_page_id INT UNSIGNED NOT NULL,
  fi_title   VARCHAR(255) NOT NULL,
  sv_title   VARCHAR(255) NULL,
  en_title   VARCHAR(255) NULL,
  fi_chars   INT UNSIGNED NOT NULL,
  sv_chars   INT UNSIGNED NULL,
  en_chars   INT UNSIGNED NULL
);
CREATE OR REPLACE TABLE lab_three_wikipedias.lead_fact (
  qid        VARCHAR(20) NOT NULL,
  lang       CHAR(2) NOT NULL,
  field      ENUM('birth','death') NOT NULL,
  y          SMALLINT NOT NULL,
  m          TINYINT NULL,
  d          TINYINT NULL,
  day_number INT NULL,                            -- proleptic Gregorian day count, only when y, m and d are all given
  approx     TINYINT(1) NOT NULL,                 -- "noin", "c.", "omkring", "tai" ... stands before the date
  old_style  TINYINT(1) NOT NULL,                 -- the lead mentions O.S., J:, g.s. or the Julian calendar
  how        VARCHAR(40) NOT NULL,
  shown      VARCHAR(80) NOT NULL,
  PRIMARY KEY (qid, lang, field)
);
CREATE OR REPLACE TABLE lab_three_wikipedias.lead_date (
  qid        VARCHAR(20) NOT NULL,
  lang       CHAR(2) NOT NULL,
  day_number INT NOT NULL,
  shown      VARCHAR(80) NOT NULL,
  PRIMARY KEY (qid, lang, day_number)
);
CREATE OR REPLACE TABLE lab_three_wikipedias.lead_quantity (
  qid        VARCHAR(20) NOT NULL,
  lang       CHAR(2) NOT NULL,
  value      DOUBLE NOT NULL,
  shown      VARCHAR(80) NOT NULL,
  PRIMARY KEY (qid, lang, value)
);
-- Kept across reloads of the facts: the distances depend only on the article vectors.
CREATE TABLE IF NOT EXISTS lab_three_wikipedias.topic_distance (
  qid        VARCHAR(20) NOT NULL,
  lang_a     CHAR(2) NOT NULL,
  lang_b     CHAR(2) NOT NULL,
  distance   DOUBLE NOT NULL,
  chars_a    INT UNSIGNED NOT NULL,
  chars_b    INT UNSIGNED NOT NULL,
  truncated  TINYINT(1) NOT NULL,                 -- either article was cut at 8,192 tokens before embedding
  PRIMARY KEY (qid, lang_a, lang_b)
);
-- Every pair of languages that states the same field for the same topic.
-- Compared at the coarser of the two precisions: a full date against a bare year compares years.
CREATE OR REPLACE VIEW lab_three_wikipedias.fact_pair AS
SELECT qid, field, lang_a, lang_b, shown_a, shown_b, grain, gap, approx, old_style, y,
       CASE WHEN gap = 0 THEN 'same'
            WHEN grain = 'day' AND gap = 1 THEN '1 day'
            WHEN grain = 'day' AND gap <= 31 THEN '2 to 31 days'
            WHEN grain = 'day' AND gap <= 366 THEN 'up to a year'
            WHEN grain = 'month' AND gap <= 12 THEN 'up to a year'
            WHEN grain = 'year' AND gap = 1 THEN 'one calendar year, only years given'
            ELSE 'more than a year' END AS size,
       (grain = 'day' AND gap = CASE WHEN y < 1700 THEN 10 WHEN y < 1800 THEN 11 WHEN y < 1900 THEN 12 ELSE 13 END) AS calendar_shaped
FROM (
  SELECT a.qid, a.field, a.lang AS lang_a, b.lang AS lang_b, a.shown AS shown_a, b.shown AS shown_b, a.y,
         CASE WHEN a.d IS NOT NULL AND b.d IS NOT NULL THEN 'day'
              WHEN a.m IS NOT NULL AND b.m IS NOT NULL THEN 'month'
              ELSE 'year' END AS grain,
         CASE WHEN a.d IS NOT NULL AND b.d IS NOT NULL THEN ABS(a.day_number - b.day_number)
              WHEN a.m IS NOT NULL AND b.m IS NOT NULL THEN ABS((a.y * 12 + a.m) - (b.y * 12 + b.m))
              ELSE ABS(a.y - b.y) END AS gap,
         (a.approx OR b.approx) AS approx,
         (a.old_style OR b.old_style) AS old_style
  FROM lab_three_wikipedias.lead_fact AS a
  JOIN lab_three_wikipedias.lead_fact AS b ON b.qid = a.qid AND b.field = a.field AND a.lang < b.lang
) AS p;
