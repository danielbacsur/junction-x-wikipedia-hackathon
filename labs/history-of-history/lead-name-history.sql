-- Part 1c: under which name the main article (page_id 1150) opens, over its whole life.
-- The dump keeps one title per page, so the title column cannot show renames. The
-- first bold phrase ending in -sota, -kapina or tapahtumat is the name the article
-- gives the war. Summed per name: how many versions opened with it and for how long.
WITH v AS (
  SELECT row_start, LEAST(row_end, TIMESTAMP '2026-10-01 23:59:59') AS row_end,
         REGEXP_SUBSTR(text, "'''[^'\n]*(?:sota|kapina|tapahtumat)'''") AS opening_name
  FROM wtt.revision FOR SYSTEM_TIME ALL WHERE page_id = 1150
)
SELECT opening_name, COUNT(*) AS versions, MIN(row_start) AS first_seen, MAX(row_end) AS last_seen,
       ROUND(SUM(TIMESTAMPDIFF(SECOND, row_start, row_end)) / 86400, 1) AS days
FROM v GROUP BY opening_name ORDER BY days DESC LIMIT 12;

-- Which side the infobox lists first: the "taistelija1" (belligerent 1) parameter
-- of the article's infobox, classified by the words it contains, summed per side.
WITH v AS (
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
FROM v GROUP BY belligerent_1 ORDER BY first_seen;

-- the moments the first belligerent changed between Reds and Whites
WITH v AS (
  SELECT rev_id, row_start, user, comment, REGEXP_SUBSTR(text, '(?i)taistelija1\\s*=[^\n]*') AS side1
  FROM wtt.revision FOR SYSTEM_TIME ALL WHERE page_id = 1150
),
c AS (
  SELECT v.*, CASE WHEN side1 REGEXP 'puna' AND NOT side1 REGEXP 'valko|hallitu|senaat|tasavalla' THEN 'Reds'
                   WHEN side1 REGEXP 'valko|hallitu|senaat|tasavalla' AND NOT side1 REGEXP 'puna' THEN 'Whites' END AS side
  FROM v
),
l AS (SELECT c.*, LAG(side) OVER (ORDER BY row_start) AS side_before FROM c WHERE side IS NOT NULL)
SELECT rev_id, row_start, user, side_before, side, LEFT(comment, 80) AS comment FROM l WHERE side <> side_before ORDER BY row_start;
