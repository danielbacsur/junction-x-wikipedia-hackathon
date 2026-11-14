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
