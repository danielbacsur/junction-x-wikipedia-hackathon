/**
 * The statements behind each chart, copied from the labs' .sql files and
 * READMEs. Where one is long it is shortened, and its first line says so.
 * The labs' scripts substitute the date and run a statement once per reading.
 */
import type { Query } from "./section";

export const NAMES: Query[] = [
  {
    about:
      "war-names.sql, run once per date. Shortened: three of the six names and two of the five counts are shown, and cleaning steps b to d are one comment.",
    text: String.raw`WITH name AS (
  SELECT 'sisällissota' AS name, 'sisällisso[dt][ai]' AS re, 12 AS len UNION ALL
  SELECT 'vapaussota',    'vapausso[dt][ai]',    10 UNION ALL
  SELECT 'kansalaissota', 'kansalaisso[dt][ai]', 13
),
a AS (  -- every article as of the date, text kept only where a name occurs
  SELECT page_id,
         IF(text REGEXP 'sisällisso[dt]|vapausso[dt]|kansalaisso[dt]|luokkaso[dt]|veljesso[dt]|punakapin',
            LOWER(text), '') AS t0
  FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59'
),
-- b, c, d: t1 removes other countries' wars (Viron vapaussota ...), t2 the medal
-- "Vapaussodan muistomitali", t3 category links and file embeds
e AS (  -- t4: hidden targets of piped links removed: what is left is running text
  SELECT page_id, t0, t1, t2, t3, REGEXP_REPLACE(t3, '\\[\\[[^\\]|]*\\|', ' ') AS t4 FROM d
),
n AS (  -- no REGEXP_COUNT: count the characters that disappear with the matches
  SELECT name.name, e.page_id,
    (CHAR_LENGTH(t0) - CHAR_LENGTH(REGEXP_REPLACE(t0, name.re, ''))) DIV name.len AS c0,
    (CHAR_LENGTH(t4) - CHAR_LENGTH(REGEXP_REPLACE(t4, name.re, ''))) DIV name.len AS c4
  FROM e JOIN name
)
SELECT name,
       COUNT(*)        AS articles_total,
       SUM(c0)         AS mentions,           -- all mentions
       SUM(c4)         AS running_text,       -- what the reader sees
       SUM(c4 > 0)     AS articles_running
FROM n GROUP BY name ORDER BY mentions DESC;`,
  },
];

export const SWAPS: Query[] = [
  {
    about:
      "name-count.sql: the six names counted in every version, once (337 s). Shortened to two names.",
    text: String.raw`INSERT INTO lab_history_of_history.name_count
SELECT page_id, rev_id,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)sisällisso[dt][ai]',  ''))) DIV 12,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)vapausso[dt][ai]',    ''))) DIV 10
FROM wtt.revision FOR SYSTEM_TIME ALL
WHERE text REGEXP 'sisällisso[dt]|vapausso[dt]|kansalaisso[dt]|luokkaso[dt]|veljesso[dt]|punakapin';`,
  },
  {
    about:
      "war-name-swaps.sql: an edit is a swap when one name occurs fewer times and another more times than in the version before. Shortened to the comparison and the join.",
    text: String.raw`w AS (  -- every version next to the version before it
  SELECT v.*, LAG(n1) OVER p AS p1, LAG(n2) OVER p AS p2
  FROM v WINDOW p AS (PARTITION BY page_id ORDER BY seq)
)
SELECT f.page_id, f.seq, f.rev_id,
       f.name AS name_from, t.name AS name_to,
       LEAST(f.n_before - f.n_after, t.n_after - t.n_before) AS moved
FROM x f JOIN x t ON t.rev_id = f.rev_id
WHERE f.n_after < f.n_before AND t.n_after > t.n_before;`,
  },
  {
    about:
      "war-name-swaps.sql: the edit war in one table. restores says the edit is itself a revert, undone_by that it was undone.",
    text: String.raw`SELECT s.name_from, s.name_to, COUNT(*) AS swaps, COUNT(DISTINCT s.page_id) AS articles, SUM(s.moved) AS mentions_moved,
       SUM(e.editor <> 'named') AS by_anonymous,
       SUM(e.restores IS NOT NULL) AS are_reverts,
       SUM(e.restores IS NULL) AS fresh,
       SUM(e.restores IS NULL AND e.undone_by IS NOT NULL) AS fresh_undone,
       ROUND(AVG(CASE WHEN e.restores IS NULL AND e.undone_by IS NOT NULL
                      THEN TIMESTAMPDIFF(SECOND, e.saved_at, u.saved_at) END) / 3600, 1) AS mean_hours_to_undo
FROM lab_history_of_history.swap s
JOIN wtt.edit e ON e.rev_id = s.rev_id
LEFT JOIN wtt.edit u ON u.page_id = e.page_id AND u.seq = e.undone_by
GROUP BY s.name_from, s.name_to ORDER BY swaps DESC;`,
  },
];

export const ARTICLE: Query[] = [
  {
    about:
      "lead-name-history.sql: the first bold phrase ending in -sota, -kapina or tapahtumat, over all 3,357 versions.",
    text: String.raw`WITH v AS (
  SELECT row_start, LEAST(row_end, TIMESTAMP '2026-10-01 23:59:59') AS row_end,
         REGEXP_SUBSTR(text, "'''[^'\n]*(?:sota|kapina|tapahtumat)'''") AS opening_name
  FROM wtt.revision FOR SYSTEM_TIME ALL WHERE page_id = 1150
)
SELECT opening_name, COUNT(*) AS versions, MIN(row_start) AS first_seen, MAX(row_end) AS last_seen,
       ROUND(SUM(TIMESTAMPDIFF(SECOND, row_start, row_end)) / 86400, 1) AS days
FROM v GROUP BY opening_name ORDER BY days DESC LIMIT 12;`,
  },
  {
    about:
      "lead-name-history.sql: which side the infobox lists first, from its taistelija1 (belligerent 1) parameter.",
    text: String.raw`WITH v AS (
  SELECT row_start, LEAST(row_end, TIMESTAMP '2026-10-01 23:59:59') AS row_end,
         REGEXP_SUBSTR(text, '(?i)taistelija1\\s*=[^\n]*') AS side1
  FROM wtt.revision FOR SYSTEM_TIME ALL WHERE page_id = 1150
)
SELECT CASE WHEN side1 = '' THEN 'no infobox'
            WHEN side1 REGEXP 'puna' AND NOT side1 REGEXP 'valko|hallitu|senaat|tasavalla' THEN 'Reds'
            WHEN side1 REGEXP 'valko|hallitu|senaat|tasavalla' AND NOT side1 REGEXP 'puna' THEN 'Whites'
            ELSE 'other' END AS belligerent_1,
       COUNT(*) AS versions, MIN(row_start) AS first_seen, MAX(row_end) AS last_seen,
       ROUND(SUM(TIMESTAMPDIFF(SECOND, row_start, row_end)) / 86400) AS days
FROM v GROUP BY belligerent_1 ORDER BY first_seen;`,
  },
  {
    about: "lead-sentence.sql: the opening sentence as of one date.",
    text: String.raw`SELECT '2004-12-31' AS as_of, rev_id, REGEXP_SUBSTR(text, "'''[^']*(?:sota|kapina)'''[^\n]{0,420}") AS lead_text
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2004-12-31 23:59:59' WHERE page_id = 1150;`,
  },
];

export const YEARS: Query[] = [
  {
    about:
      "year-heatmap.sql, run once per date. Footnotes, citation templates and century phrases are removed, the rest becomes a JSON array of its digit runs, and JSON_TABLE unnests it.",
    text: String.raw`SELECT j.tok + 0                 AS year_mentioned,
       COUNT(*)                  AS mentions,
       COUNT(DISTINCT r.page_id) AS articles
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' AS r,
     JSON_TABLE(
       CONCAT('["',
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(r.text, '(?is)<ref[^>/]*>.*?</ref>|<ref[^>]*>|[0-9]{2}00-lu[kv]u', ' '),
                  '(?i)\\{\\{[a-zåäö]*viite[^{}]*\\}\\}', ' '),
                '[^0-9]+', '","'),
              '"]'),
       '$[*]' COLUMNS (tok VARCHAR(32) PATH '$')) AS j
WHERE j.tok REGEXP '^(1[0-9]{3}|20[01][0-9]|202[0-6])$'
GROUP BY year_mentioned;`,
  },
];

export const WORDS: Query[] = [
  {
    about:
      "term-shares.sql, run once per date. Shortened to the two words drawn: the file counts ten.",
    text: String.raw`SELECT COUNT(*)                              AS articles_total,
       SUM(text REGEXP '[^a-zåäö]nato')      AS nato,             -- Nato, Naton, Natoon
       SUM(text REGEXP 'suomettu')           AS suomettuminen     -- Finlandization
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59';`,
  },
];

export const EXPOSURE: Query[] = [
  {
    about:
      "sql/setup.sql: one row per undone version, joined to the revision that undid it and the one that revision restored. Shortened to the columns the chart uses.",
    text: String.raw`CREATE TABLE lab_exposure_clock.fact AS
SELECT e.page_id, e.seq, e.rev_id, e.saved_at, e.user, e.editor,
       r.saved_at revert_at, r.sha1 IS NOT NULL identity_valid,
       TIMESTAMPDIFF(SECOND, e.saved_at, r.saved_at) exposure_seconds
FROM wtt.edit e JOIN wtt.edit r ON r.page_id = e.page_id AND r.seq = e.undone_by
JOIN wtt.edit t ON t.page_id = r.page_id AND t.seq = r.restores;`,
  },
  {
    about:
      "sql/valid-exposure-by-year.sql: the yearly medians and shares. Shortened: p75, p90, p99 and the hour sums are left out.",
    text: String.raw`WITH base AS (SELECT *, YEAR(saved_at) AS year FROM lab_exposure_clock.fact WHERE identity_valid=1),
 ranked AS (SELECT *,
   PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exposure_seconds) OVER(PARTITION BY year) p50
   FROM base)
SELECT year, COUNT(*) n, MIN(p50) median_seconds,
       AVG(exposure_seconds<=60) within_minute, AVG(exposure_seconds<=3600) within_hour,
       AVG(exposure_seconds<=86400) within_day, AVG(exposure_seconds<=604800) within_week
FROM ranked GROUP BY year ORDER BY year;`,
  },
  {
    about:
      "sql/event-edges-setup.sql: every named editor undone by a different named editor, one row per revert and editor.",
    text: String.raw`CREATE TABLE lab_exposure_clock.event_edges AS
SELECT r.page_id, r.rev_id revert_rev_id, r.saved_at revert_at, r.user reverter, e.user,
       r.sha1 IS NOT NULL identity_valid, COUNT(*) undone_versions
FROM wtt.edit r JOIN wtt.seq_1_to_10000 s ON s.seq < r.seq - r.restores
JOIN wtt.edit e ON e.page_id = r.page_id AND e.seq = r.restores + s.seq
WHERE r.restores IS NOT NULL AND r.editor = 'named' AND e.editor = 'named' AND BINARY r.user <> BINARY e.user
GROUP BY r.page_id, r.rev_id, r.saved_at, r.user, e.user;`,
  },
];

export const TEMPORARY: Query[] = [
  {
    about:
      "sql/temp-comparison.sql: edits in three windows and how many were undone by someone else within seven days. March 2025 falls to the first WHEN, so the third window is October 2024 to February 2025. Shortened: the medians are left out.",
    text: String.raw`WITH horizon AS (SELECT MAX(saved_at) cutoff FROM wtt.edit),
 eligible AS (
   SELECT e.*,
     CASE WHEN e.saved_at>='2025-03-01' AND e.saved_at<'2025-09-01' THEN 'before'
          WHEN e.saved_at>='2025-10-01' AND e.saved_at<'2026-04-01' THEN 'after'
          ELSE 'seasonal_baseline' END period,
     CASE WHEN e.editor IN ('ip','temp') THEN 'anonymous' ELSE e.editor END editor_group,
     r.saved_at revert_at, TIMESTAMPDIFF(SECOND,e.saved_at,r.saved_at) lag_seconds,
     CASE WHEN e.user IS NOT NULL AND BINARY e.user=BINARY r.user THEN 1 ELSE 0 END self_revert
   FROM wtt.edit e CROSS JOIN horizon h
   LEFT JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by
   WHERE ((e.saved_at>='2025-03-01' AND e.saved_at<'2025-09-01')
       OR (e.saved_at>='2025-10-01' AND e.saved_at<'2026-04-01')
       OR (e.saved_at>='2024-10-01' AND e.saved_at<'2025-04-01'))
     AND e.saved_at<=h.cutoff-INTERVAL 7 DAY)
SELECT e.period, e.editor_group, COUNT(*) edits, SUM(revert_at IS NOT NULL) observed_undone,
       SUM(COALESCE(lag_seconds<=604800 AND self_revert=0,0)) other_undone_7d,
       AVG(COALESCE(lag_seconds<=604800 AND self_revert=0,0)) other_undone_7d_share
FROM eligible e
GROUP BY e.period, e.editor_group ORDER BY e.period, e.editor_group;`,
  },
];

export const SURVIVAL: Query[] = [
  {
    about:
      "build-islands.sql: a paragraph that only moved or changed its neighbours is one stay, not several. A row begins a new stay when it does not start where the row before it ended.",
    text: String.raw`SELECT r.*,
       SUM(new_stay) OVER (
         PARTITION BY page_id,hash,dup ORDER BY a,b
         ROWS UNBOUNDED PRECEDING) island
FROM (
  SELECT raw.*,
         IF(LAG(b) OVER (
           PARTITION BY page_id,hash,dup ORDER BY a,b)=a,0,1) new_stay
  FROM raw WHERE b>a
) r;`,
  },
  {
    about:
      "build-km.sql: the Kaplan–Meier product in MariaDB, as a running sum of logarithms over the ages at which a stay ended. One statement, broken into lines here.",
    text: String.raw`CREATE TABLE km AS
SELECT *,
       IF(SUM(deaths=at_risk) OVER w>0, 0,
          EXP(SUM(IF(deaths<at_risk, LN(1-deaths*1e0/at_risk), 0)) OVER w)) survival
FROM risk
WINDOW w AS (PARTITION BY endpoint,dimension,grp ORDER BY duration ROWS UNBOUNDED PRECEDING);`,
  },
  {
    about:
      "medians.sql: the median is the earliest age at which the curve is at or under a half.",
    text: String.raw`SELECT endpoint,dimension,grp,SUM(exits) n,SUM(deaths) deaths,
       MIN(IF(survival<=0.5,duration,NULL))/86400 median_days,
       MAX(duration)/86400 max_followup_days
FROM km GROUP BY endpoint,dimension,grp;`,
  },
];

export const OFFICES: Query[] = [
  {
    about:
      "The table, from the lab's README: two periods on one row. System time is when Wikipedia said it, loaded from the real edit times. Valid time is the term the infobox states. Shortened: seven columns that describe the stating version are one comment.",
    text: String.raw`CREATE TABLE office_term (
  page_id     INT UNSIGNED NOT NULL,   -- the article that makes the statement
  person      VARCHAR(255) NOT NULL,   -- its title
  office      VARCHAR(64)  NOT NULL,
  valid_from  DATE NOT NULL,           -- stated first day in office
  valid_to    DATE NOT NULL,           -- stated last day, exclusive
  open_ended  BOOLEAN NOT NULL,        -- still in office: valid_to is 9999-12-31
  -- rev_id, seq, editor, editor_kind, comment, versions, source_text
  row_start   TIMESTAMP(6) GENERATED ALWAYS AS ROW START,
  row_end     TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  PERIOD FOR valid_time (valid_from, valid_to),
  PRIMARY KEY (page_id, office, valid_time WITHOUT OVERLAPS),
  KEY office_valid (office, valid_from, valid_to)
) WITH SYSTEM VERSIONING;`,
  },
  {
    about:
      "a2-answer-that-flips.sql: one day of history asked of four Wikipedias. Shortened to the first and the last of the four.",
    text: String.raw`SELECT '2006-12-31' AS wikipedia_as_of, person, valid_from, valid_to, rev_id
FROM office_term FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59'
WHERE office = 'Suomen tasavallan presidentti' AND valid_from <= DATE '1925-03-01' AND valid_to > DATE '1925-03-01'
UNION ALL
SELECT 'now', person, valid_from, valid_to, rev_id
FROM office_term
WHERE office = 'Suomen tasavallan presidentti' AND valid_from <= DATE '1925-03-01' AND valid_to > DATE '1925-03-01';`,
  },
  {
    about:
      "c-term-changes.sql, as the lab's README gives it: a statement's system period ends at the instant another statement about overlapping days begins in the same article. The file adds what changed, whether the new value is today's and how long it stood.",
    text: String.raw`SELECT b.row_start AS changed_at, a.person, a.office,
       a.valid_from AS from_before, IF(a.open_ended, NULL, a.valid_to) AS to_before,
       b.valid_from AS from_after,  IF(b.open_ended, NULL, b.valid_to) AS to_after,
       b.editor, b.rev_id, b.comment
FROM office_term FOR SYSTEM_TIME ALL a
JOIN office_term FOR SYSTEM_TIME ALL b
  ON b.page_id = a.page_id AND b.office = a.office
 AND b.row_start = a.row_end                                    -- system time: one replaces the other
 AND a.valid_from < b.valid_to AND b.valid_from < a.valid_to    -- valid time: about the same days
ORDER BY changed_at;`,
  },
  {
    about:
      "a3-nobody.sql: FOR SYSTEM_TIME AS OF takes one moment, so to ask 21 year ends at once the query joins a sequence to all of history on row_start and row_end.",
    text: String.raw`SELECT y.seq AS wikipedia_at_end_of, COALESCE(GROUP_CONCAT(o.person), '(nobody)') AS president_on_1944_08_02
FROM seq_2006_to_2026 y
LEFT JOIN office_term FOR SYSTEM_TIME ALL o
       ON o.row_start <= TIMESTAMP(CONCAT(y.seq, '-12-31 23:59:59'))
      AND o.row_end   >  TIMESTAMP(CONCAT(y.seq, '-12-31 23:59:59'))
      AND o.office = 'Suomen tasavallan presidentti'
      AND o.valid_from <= DATE '1944-08-02' AND o.valid_to > DATE '1944-08-02'
GROUP BY y.seq ORDER BY y.seq;`,
  },
];

export const JOURNEYS: Query[] = [
  {
    about:
      "raw.sql: every lifetime of every prose paragraph of at least 120 characters, from the versioned passage table.",
    text: String.raw`CREATE TABLE raw AS SELECT p.page_id,p.hash,p.dup,p.born_rev,p.row_start s,p.row_end e
 FROM wtt.passage FOR SYSTEM_TIME ALL p JOIN wtt.passage_text t ON t.hash=p.hash WHERE t.kind='prose' AND t.chars>=120;`,
  },
  {
    about:
      "pairs.sql: the first and the second article each wording was observed in, and the seconds between them.",
    text: String.raw`CREATE TABLE pairs AS SELECT a.hash,a.page_id src,b.page_id dst,a.first_at src_at,b.first_at dst_at,a.born_rev src_rev,b.born_rev dst_rev,TIMESTAMPDIFF(SECOND,a.first_at,b.first_at) delay_seconds FROM ranked a JOIN ranked b ON a.hash=b.hash AND a.pos=1 AND b.pos=2;`,
  },
  {
    about:
      "edges.sql and events.sql: for a wording's first appearance in an article, every earlier article that still had it up to an hour before. Five or more arriving in one revision from one article make a transfer candidate.",
    text: String.raw`CREATE TABLE edges AS SELECT d.hash,s.page_id src,d.page_id dst,d.first_at at,d.born_rev dst_rev,MAX(s.e) src_end,
 MAX(s.e>d.first_at) overlaps, (ABS(TIMESTAMPDIFF(SECOND,MAX(s.e),d.first_at))<=3600) near_removal
 FROM ranked d JOIN presence s ON s.hash=d.hash AND s.page_id<>d.page_id AND s.s<d.first_at AND s.e>=d.first_at-INTERVAL 1 HOUR
 GROUP BY d.hash,s.page_id,d.page_id,d.first_at,d.born_rev;

CREATE TABLE events AS SELECT src,dst,at,dst_rev,COUNT(*) paragraphs,SUM(near_removal) moved,SUM(NOT near_removal AND overlaps) retained FROM edges GROUP BY src,dst,at,dst_rev HAVING COUNT(*)>=5;`,
  },
];

export const SOURCES: Query[] = [
  {
    about:
      "build-flags.sql: one pass over every wording ever stored, marking the ones with an inline reference. <references> does not match.",
    text: String.raw`CREATE TABLE flags AS
SELECT hash,kind,chars,
       (wikitext REGEXP '<ref([[:space:]/>])') has_ref
FROM wtt.passage_text;`,
  },
  {
    about:
      "build-origins.sql: when each paragraph was first seen and when it first carried a reference.",
    text: String.raw`CREATE TABLE origins AS
SELECT page_id,slot,MIN(a) written,
       MIN(IF(has_ref,a,NULL)) referenced
FROM stays GROUP BY page_id,slot;`,
  },
  {
    about:
      "all-sourcing-by-year.sql: the chart. Every paragraph first seen in a year, with those later removed, and how many were born with a reference.",
    text: String.raw`SELECT YEAR(o.written) year,COUNT(*) paragraphs,SUM(COALESCE(o.referenced=o.written,0)) born_referenced,100*SUM(COALESCE(o.referenced=o.written,0))/COUNT(*) born_referenced_pct FROM origins o JOIN first_versions v USING(page_id,slot) WHERE v.kind='prose' AND v.chars>=80 GROUP BY YEAR(o.written);`,
  },
];

export const NUMBERS: Query[] = [
  {
    about:
      "sql/passages.sql, as the lab's README gives it: the only scan, run once per range of 100 articles. It reads every prose wording with its lifetime and nothing else. Finding the wordings that differ in one number, joining their stays and counting are Python, in run.py.",
    text: String.raw`SELECT p.page_id,p.slot,HEX(p.hash),p.born_rev,p.row_start,
       LEAST(p.row_end,'2026-10-01 10:59:12'),t.text
FROM passage FOR SYSTEM_TIME ALL AS p
JOIN passage_text AS t ON t.hash=p.hash
WHERE p.page_id BETWEEN %s AND %s AND t.kind='prose'
  AND p.row_start < '2026-10-01 10:59:12';`,
  },
  {
    about:
      "sql/edits.sql: who saved each version, with what summary, and whether a later edit reverted it. reverted_by is the flag the filter uses.",
    text: String.raw`SELECT page_id,rev_id,saved_at,ended_at,user,editor,comment,reverted_by FROM edit WHERE page_id BETWEEN %s AND %s;`,
  },
  {
    about:
      "sql/audit.sql: the wikitext of one wording, for the substitutions that were read by hand.",
    text: String.raw`SELECT wikitext FROM passage_text WHERE hash=UNHEX(%s);`,
  },
];

/*
 * The two wrong answers of yearly partitions, from the scripts that reproduce
 * them. Shortened: the table is one comment, and the looks at
 * information_schema and the control tables are left out. The results in
 * the comments are the ones in data/raw/*.out.
 */

export const MISPLACED = String.raw`-- t_auto: WITH SYSTEM VERSIONING
--   PARTITION BY SYSTEM_TIME INTERVAL 1 YEAR
--   STARTS '2003-01-01 00:00:00' AUTO
-- Right after CREATE it has one history partition, p0.

-- A loader writes old history. No warning. All three
-- rows go to p0, also the one that ended in 2010.
SET system_versioning_insert_history = 1;
INSERT INTO t_auto (id, v, row_start, row_end) VALUES
  (1, 1, '2004-05-01', '2005-06-01'),
  (2, 1, '2004-05-01', '2010-06-01'),
  (3, 1, '2003-02-01', '2003-03-01');
INSERT INTO t_auto (id, v, row_start) VALUES
  (1, 2, '2005-06-01'), (4, 2, '2005-06-01');
SET system_versioning_insert_history = 0;

-- Correct so far: rows 1, 2 and 4.
SELECT id FROM t_auto
FOR SYSTEM_TIME AS OF TIMESTAMP '2008-12-31 00:00:00';

-- One ordinary update today. AUTO now creates p1 … p23.
UPDATE t_auto SET v = 3 WHERE id = 4;

-- Wrong now: rows 1 and 4. Pruning reads p5 … pn.
SELECT id FROM t_auto
FOR SYSTEM_TIME AS OF TIMESTAMP '2008-12-31 00:00:00';

-- Row 2 is still there.
SELECT id FROM t_auto PARTITION (p0);`;

export const LAST_SECOND = String.raw`-- t_edge: WITH SYSTEM VERSIONING
--   PARTITION BY SYSTEM_TIME INTERVAL 1 YEAR
--   STARTS '2003-01-01 00:00:00' PARTITIONS 25

SET system_versioning_insert_history = 1;
INSERT INTO t_edge (id, v, row_start, row_end) VALUES
  (1, 1, '2005-01-01 00:00:00', '2006-12-31 23:59:59.500000'),
  (2, 1, '2005-01-01 00:00:00', '2006-12-31 23:59:59.000000'),
  (3, 1, '2005-01-01 00:00:00', '2006-07-01 00:00:00'),
  (4, 1, '2005-01-01 00:00:00', '2007-03-01 00:00:00');
SET system_versioning_insert_history = 0;

-- Rows 1 and 4 stood at this moment. Returns row 4:
-- the partitions read are p4 … pn, from 2007 on.
SELECT id FROM t_edge
FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59';

-- Row 1 is there.
SELECT id FROM t_edge PARTITION (p3);

-- The same rows without partitions: rows 1 and 4.
SELECT id FROM t_edge_flat
FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59';

-- One microsecond earlier, partitioned: rows 1, 2 and 4.
SELECT id FROM t_edge
FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:58.999999';`;

export const SCALE: Query[] = [
  {
    about:
      "sql/hot-statements.sql, blocks: every block of one article as of a moment, here Talvisota. This is the statement the first two charts time. The lab runs it on wtt.passage and on its copies p_flat, p_hc, p_year and p_idx.",
    text: String.raw`SELECT p.hash, p.dup, p.ord, p.gap, p.rev_id, p.born_rev, p.slot
FROM passage FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p
WHERE p.page_id = 1256
ORDER BY p.ord;`,
  },
  {
    about:
      "The same through an index that holds both ends of the period, forced with a hint after the alias, as bench.py does for every index.",
    text: String.raw`SELECT p.hash, p.dup, p.ord, p.gap, p.rev_id, p.born_rev, p.slot
FROM p_idx FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p
     FORCE INDEX (per)
WHERE p.page_id = 1256
ORDER BY p.ord;`,
  },
  {
    about:
      "The candidate indexes, from the lab's README. pe, ps and per are the three drawn above; se and es serve the count over all articles.",
    text: String.raw`ALTER TABLE p_idx
  ADD KEY pe  (page_id, row_end),             -- good today, a trap for early dates
  ADD KEY ps  (page_id, row_start),           -- best for early dates
  ADD KEY per (page_id, row_end, row_start),  -- exact today, bounded for dates
  ADD KEY se  (row_start, row_end),           -- the global count, early dates
  ADD KEY es  (row_end, row_start);           -- the global count, late dates, now`,
  },
  {
    about:
      "The two partitioned layouts, from the lab's README. Shortened as it is there: (…) stands for the columns of passage, which LAYOUTS in build.py spells out.",
    text: String.raw`-- history and current apart
CREATE TABLE p_hc (…) WITH SYSTEM VERSIONING
  PARTITION BY SYSTEM_TIME (PARTITION p_hist HISTORY, PARTITION p_cur CURRENT);

-- one history partition per year, all made before the load
CREATE TABLE p_year (…) WITH SYSTEM VERSIONING
  PARTITION BY SYSTEM_TIME INTERVAL 1 YEAR
  STARTS '2003-01-01 00:00:00' PARTITIONS 25;`,
  },
  {
    about:
      "The load of a copy: history rows with both ends of their period, current rows with their start. One of eight chunks is shown.",
    text: String.raw`SET system_versioning_insert_history = 1;
INSERT INTO p_hc (page_id, hash, dup, ord, gap, rev_id, born_rev, slot,
                  prev_hash, sim, row_start, row_end)
SELECT page_id, hash, dup, ord, gap, rev_id, born_rev, slot, prev_hash, sim,
       row_start, row_end
FROM wtt.passage FOR SYSTEM_TIME ALL
WHERE page_id BETWEEN 0 AND 30000 AND row_end < '2100-01-01';
INSERT INTO p_hc (page_id, hash, dup, ord, gap, rev_id, born_rev, slot,
                  prev_hash, sim, row_start)
SELECT page_id, hash, dup, ord, gap, rev_id, born_rev, slot, prev_hash, sim,
       row_start
FROM wtt.passage WHERE page_id BETWEEN 0 AND 30000;`,
  },
  {
    about:
      "sql/hot-statements.sql, search and global: 300 candidate wordings joined to what stood at a moment, and the count of every passage that stood on a date. The second is the statement that falls off at four times the rows.",
    text: String.raw`SELECT p.page_id, HEX(p.hash), p.born_rev, p.slot
FROM cand AS c
JOIN p_flat FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p USING (hash);

SELECT COUNT(*)
FROM p_flat FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' AS p;`,
  },
  {
    about:
      "What the engine reports for Talvisota as of 31 Dec 2010 on the real table, from the lab's README (data/raw/analyze-core-blocks-talvisota-2010.json). Only page_id of the key is used, and both ends of the period are checked on the row.",
    text: String.raw`{
  "table_name": "p", "access_type": "ref", "key": "PRIMARY",
  "used_key_parts": ["page_id"], "r_rows": 6462, "r_filtered": 4.95,
  "attached_condition": "p.page_id <=> 1256 and p.row_end > TIMESTAMP'2010-12-31 23:59:59' and p.row_start <= TIMESTAMP'2010-12-31 23:59:59'",
  "r_engine_stats": { "pages_accessed": 80, "pages_read_count": 65, "pages_read_time_ms": 18.98 }
}`,
  },
];

/* The three designs of the search lab, as they were timed. */

export const VERSIONED = String.raw`SET mhnsw_ef_search=80;
SELECT id,
       VEC_DISTANCE_COSINE(embedding,?) AS d
FROM a FOR SYSTEM_TIME AS OF TIMESTAMP ?
ORDER BY d LIMIT 10;`;

export const JOINED = String.raw`SELECT cand.id,cand.d
FROM (
  SELECT id,
         VEC_DISTANCE_COSINE(embedding,?) AS d
  FROM b ORDER BY d LIMIT 1000
) AS cand
JOIN life
  FOR SYSTEM_TIME AS OF TIMESTAMP ? AS l
  ON l.id=cand.id
ORDER BY cand.d LIMIT 10;`;

export const EXACT = String.raw`SELECT b.id,
       VEC_DISTANCE_COSINE(b.embedding, ?)
         AS distance
FROM life
  FOR SYSTEM_TIME AS OF TIMESTAMP ? AS l
STRAIGHT_JOIN b IGNORE INDEX (embedding)
  ON b.id = l.id
ORDER BY distance LIMIT 10;`;

export const SEARCH: Query[] = [
  {
    about:
      "The versioned table with its vector index, loaded with real edit times. b is the same without the period, life the same without the vector and with KEY alive (row_end, row_start).",
    text: String.raw`CREATE TABLE a (
  id INT PRIMARY KEY, page_id INT, seq INT,
  embedding VECTOR(1024) NOT NULL,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START,
  row_end TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
  PERIOD FOR SYSTEM_TIME (row_start, row_end)
) WITH SYSTEM VERSIONING;
ALTER TABLE a ADD VECTOR INDEX embedding (embedding) M=16 DISTANCE=cosine;
SET system_versioning_insert_history=1;
-- Historical row:
INSERT INTO a(id,page_id,seq,embedding,row_start,row_end) VALUES(?,?,?,?,?,?);
-- Current row:
INSERT INTO a(id,page_id,seq,embedding,row_start) VALUES(?,?,?,?,?);`,
  },
  {
    about:
      "ANALYZE FORMAT=JSON of the versioned search, query 0 as of 1 June 2006 at ef_search 80: the index returned 178 rows and the period condition kept none.",
    text: String.raw`{
  "table_name": "a",
  "access_type": "index",
  "key": "embedding",
  "r_rows": 178,
  "attached_condition": "a.row_end > TIMESTAMP/*WITH LOCAL TIME ZONE*/'2006-06-01 00:00:00' and a.row_start <= TIMESTAMP/*WITH LOCAL TIME ZONE*/'2006-06-01 00:00:00'",
  "r_filtered": 0
}`,
  },
  {
    about:
      "product.sql: the search the product runs. The lifetime table drives, the vector index is not used.",
    text: String.raw`SET time_zone = '+00:00';
SELECT b.id, VEC_DISTANCE_COSINE(b.embedding, ?) AS distance
FROM lab_temporal_ann.life FOR SYSTEM_TIME AS OF TIMESTAMP ? AS l
STRAIGHT_JOIN lab_temporal_ann.b IGNORE INDEX (embedding) ON b.id = l.id
ORDER BY distance
LIMIT 10;`,
  },
];

export const LANGUAGES: Query[] = [
  {
    about:
      "sql/schema.sql, whole: the view every count is taken from. Two languages that state the same field of the same topic are compared at the coarser precision of the two, so a full date against a bare year compares years. calendar_shaped is a gap that is exactly the Julian offset of the century.",
    text: String.raw`CREATE OR REPLACE VIEW lab_three_wikipedias.fact_pair AS
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
) AS p;`,
  },
  {
    about:
      "sql/people-summary.sql, whole: the topics that agree everywhere and those that differ on a birth or a death, the first bar above.",
    text: String.raw`SELECT COUNT(*) AS topics_compared,
       SUM(worst = 0) AS agree_everywhere,
       SUM(worst > 0) AS disagree_somewhere,
       SUM(birth_gap > 0) AS disagree_on_birth,
       SUM(death_gap > 0) AS disagree_on_death,
       SUM(worst > 0 AND firm_gap = 0) AS only_where_a_date_is_marked_approximate,
       SUM(firm_gap > 0) AS disagree_on_a_date_given_as_exact
FROM (
  SELECT qid, MAX(gap) AS worst,
         MAX(IF(field = 'birth', gap, 0)) AS birth_gap,
         MAX(IF(field = 'death', gap, 0)) AS death_gap,
         MAX(IF(approx, 0, gap)) AS firm_gap
  FROM lab_three_wikipedias.fact_pair
  GROUP BY qid
) AS per_topic;`,
  },
  {
    about:
      "sql/people-size.sql and sql/people-shape.sql, whole: how far apart the two dates of a pair are, and which part of a full date differs.",
    text: String.raw`SELECT field, size, COUNT(*) AS pairs, SUM(approx) AS marked_approximate,
       SUM(old_style) AS lead_mentions_old_style, SUM(calendar_shaped) AS julian_gap_exactly
FROM lab_three_wikipedias.fact_pair
WHERE gap > 0
GROUP BY field, size
ORDER BY field, FIELD(size, '1 day', '2 to 31 days', 'up to a year', 'one calendar year, only years given', 'more than a year');

SELECT CASE WHEN a.y = b.y AND a.d = b.d THEN 'same day number and year, other month'
            WHEN a.y = b.y AND a.m = b.m THEN 'same month and year, other day'
            WHEN a.m = b.m AND a.d = b.d THEN 'same day and month, other year'
            ELSE 'more than one part differs' END AS shape,
       COUNT(*) AS pairs,
       SUM(ABS(a.day_number - b.day_number) = CASE WHEN a.y < 1700 THEN 10 WHEN a.y < 1800 THEN 11 WHEN a.y < 1900 THEN 12 ELSE 13 END) AS julian_gap_exactly
FROM lab_three_wikipedias.lead_fact AS a
JOIN lab_three_wikipedias.lead_fact AS b ON b.qid = a.qid AND b.field = a.field AND a.lang < b.lang
WHERE a.d IS NOT NULL AND b.d IS NOT NULL AND a.day_number <> b.day_number
GROUP BY shape
ORDER BY pairs DESC;`,
  },
  {
    about:
      "sql/lead-history.sql: time travel on the Finnish side, run once for each of the Finnish articles with a date in dispute. It returns every prose paragraph the article ever had with the stretch it stood. history.py then picks the paragraph that was the lead at each moment and reads its dates, so the timelines above are this statement plus that reading, not SQL alone. The parameter is the page id.",
    text: String.raw`SELECT HEX(p.ord) AS ord, p.born_rev, p.row_start, p.row_end, t.chars,
       LEFT(t.text, 420) AS head, LEFT(t.wikitext, 900) AS wikihead,
       e.user, e.editor, e.reverted_by
FROM wtt.passage FOR SYSTEM_TIME ALL AS p
JOIN wtt.passage_text AS t ON t.hash = p.hash
LEFT JOIN wtt.edit AS e ON e.rev_id = p.born_rev
WHERE p.page_id = ? AND t.kind = 'prose';`,
  },
  {
    about:
      "sql/date-near-miss.sql, whole: the wider net over articles that are not lifespans. Two languages each give a full date in the opening paragraph that the other lacks, at most 31 days apart.",
    text: String.raw`SELECT a.qid, a.lang AS lang_a, b.lang AS lang_b, a.shown AS shown_a, b.shown AS shown_b,
       ABS(a.day_number - b.day_number) AS gap_days, t.fi_title
FROM lab_three_wikipedias.lead_date AS a
JOIN lab_three_wikipedias.lead_date AS b
  ON b.qid = a.qid AND a.lang < b.lang
 AND a.day_number <> b.day_number AND ABS(a.day_number - b.day_number) <= 31
JOIN lab_three_wikipedias.topic AS t ON t.qid = a.qid
WHERE NOT EXISTS (SELECT 1 FROM lab_three_wikipedias.lead_date AS x
                  WHERE x.qid = a.qid AND x.lang = b.lang AND x.day_number = a.day_number)
  AND NOT EXISTS (SELECT 1 FROM lab_three_wikipedias.lead_date AS x
                  WHERE x.qid = a.qid AND x.lang = a.lang AND x.day_number = b.day_number);`,
  },
];

export const INFOBOX: Query[] = [
  {
    about:
      "sql/schema.sql, whole: one row for each raw value of a field and the stretch of time it stood. load.py sets system_versioning_insert_history = 1 and inserts a history row with both ends of its period and a current row with its start alone.",
    text: `CREATE TABLE statement (
 id BIGINT UNSIGNED NOT NULL,
 page_id INT UNSIGNED NOT NULL,
 title VARCHAR(255) NOT NULL,
 template VARCHAR(255) NOT NULL,
 slot SMALLINT UNSIGNED NOT NULL,
 field VARCHAR(255) NOT NULL,
 raw_value MEDIUMTEXT NOT NULL,
 value MEDIUMTEXT NOT NULL,
 unresolved BOOLEAN NOT NULL,
 fact_date DATE NULL,
 fact_number DOUBLE NULL,
 \`precision\` VARCHAR(40) NULL,
 rev_id INT UNSIGNED NOT NULL,
 editor VARCHAR(255) NULL,
 editor_kind VARCHAR(8) NOT NULL,
 comment TEXT NULL,
 versions INT UNSIGNED NOT NULL,
 row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START,
 row_end TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
 PERIOD FOR SYSTEM_TIME (row_start,row_end),
 PRIMARY KEY(id),
 KEY article_asof(page_id,row_end,row_start),
 KEY field_time(field,row_start),
 KEY typed_date(field,fact_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin WITH SYSTEM VERSIONING;`,
  },
  {
    about:
      "sql/a-asof.sql, whole: the infobox of one article as it was stated at a moment. Page 1275 is Urho Kekkonen.",
    text: String.raw`SELECT title,template,slot,field,value,raw_value,rev_id,editor,row_start
FROM statement FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59'
WHERE page_id = 1275
ORDER BY template,slot,field;`,
  },
  {
    about:
      "sql/b-field-history.sql, whole: every row one field of one article ever had. Its result is the bar drawn above.",
    text: String.raw`SELECT title,template,slot,field,value,rev_id,editor,comment,row_start,row_end
FROM statement FOR SYSTEM_TIME ALL
WHERE page_id = 1275 AND field = 'syntymäaika'
ORDER BY row_start;`,
  },
  {
    about:
      "sql/c-changed-dates.sql, whole: fields whose parsed full date was replaced by another, a row straight after a row. This showcase statement reads five field names and stops at 100 fields. The count of replaced birth and death dates above comes from analyze.py, which applies the same rule to the extracted rows under more field names (syntymäpäivä and kuolinpäivä among them) and without perustettu.",
    text: `WITH history AS (
 SELECT page_id,title,template,slot,field,fact_date,\`precision\`,row_start,
 LAG(fact_date) OVER w AS previous_date,
 LAG(\`precision\`) OVER w AS previous_precision,
 LAG(row_end) OVER w AS previous_end
 FROM statement FOR SYSTEM_TIME ALL
 WHERE field IN ('syntynyt','syntymäaika','kuollut','kuolinaika','perustettu')
 WINDOW w AS (PARTITION BY page_id,template,slot,field ORDER BY row_start)
)
SELECT page_id,title,field,COUNT(*) AS changes,MAX(ABS(DATEDIFF(fact_date,previous_date))) AS largest_days
FROM history WHERE \`precision\`='day' AND previous_precision='day'
 AND previous_end=row_start AND fact_date<>previous_date
GROUP BY page_id,title,field ORDER BY changes DESC,page_id,field LIMIT 100;`,
  },
  {
    about:
      "sql/d-returned-values.sql, whole: a raw value that was replaced and then came back, three rows in a row with no gap between them. It reads every row of the table and compares SHA-256 hashes of the values.",
    text: String.raw`WITH history AS (
 SELECT page_id,title,template,slot,field,value,rev_id,row_start,
 SHA2(raw_value,256) AS hash,
 LAG(SHA2(raw_value,256),1) OVER w AS previous_hash,
 LAG(SHA2(raw_value,256),2) OVER w AS older_hash,
 LAG(row_end,1) OVER w AS previous_end,
 LAG(row_end,2) OVER w AS older_end,
 LAG(row_start,1) OVER w AS previous_start
 FROM statement FOR SYSTEM_TIME ALL
 WINDOW w AS (PARTITION BY page_id,template,slot,field ORDER BY row_start)
)
SELECT page_id,title,template,field,value,rev_id,row_start
FROM history WHERE hash=older_hash AND hash<>previous_hash
 AND previous_end=row_start AND older_end=previous_start
ORDER BY row_start DESC,page_id,template,slot,field LIMIT 100;`,
  },
  {
    about:
      "sql/e-month.sql, whole: every replacement of a date of birth field in one month, with the value before and after. A row joins the row that begins where it ends.",
    text: String.raw`SELECT b.page_id,b.title,b.field,a.value AS before_value,b.value AS after_value,
 b.row_start AS changed_at,b.rev_id,b.editor
FROM statement FOR SYSTEM_TIME ALL a
JOIN statement FOR SYSTEM_TIME ALL b
 ON b.page_id=a.page_id AND b.template=a.template AND b.slot=a.slot
 AND b.field=a.field AND b.row_start=a.row_end
WHERE b.field='syntymäaika' AND b.row_start>='2010-05-01' AND b.row_start<'2010-06-01'
ORDER BY b.row_start,b.page_id;`,
  },
];
