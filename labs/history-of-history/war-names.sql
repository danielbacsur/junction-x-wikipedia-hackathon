-- Part 1: how many articles use each name of the 1918 war, as they stood on one date.
-- Run once per snapshot date, war_names.py substitutes the timestamp.
-- All matching is done on LOWER(text). A name is its stem plus an inflected form of
-- "sota" (sota, sodan, sotaa, sodassa, sotien, sodissa ...): so[dt][ai].
SET SESSION optimizer_switch = 'derived_merge=off';

WITH name AS (
  SELECT 'sisällissota' AS name, 'sisällisso[dt][ai]' AS re, 12 AS len UNION ALL
  SELECT 'vapaussota',    'vapausso[dt][ai]',    10 UNION ALL
  SELECT 'kansalaissota', 'kansalaisso[dt][ai]', 13 UNION ALL
  SELECT 'luokkasota',    'luokkaso[dt][ai]',    10 UNION ALL
  SELECT 'veljessota',    'veljesso[dt][ai]',    10 UNION ALL
  SELECT 'punakapina',    'punakapin',            9
),
a AS (  -- every article as of the date, text kept only where a name occurs
  SELECT page_id,
         IF(text REGEXP 'sisällisso[dt]|vapausso[dt]|kansalaisso[dt]|luokkaso[dt]|veljesso[dt]|punakapin',
            LOWER(text), '') AS t0
  FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59'
),
b AS (  -- t1: other countries' wars removed (Viron vapaussota, Venäjän sisällissota ...)
  SELECT page_id, t0, REGEXP_REPLACE(t0,
    '(?:venäjän|espanjan|yhdysvaltain|yhdysvaltojen|amerikan|ruotsin|viron|eestin|latvian|liettuan|aunuksen|karjalan|inkerin|kreikan|irlannin|englannin|kiinan|algerian|afganistanin|puolan|unkarin|turkin|rooman) (?:sisällis|vapaus|kansalais)so[dt][ai]',
    ' ') AS t1 FROM a
),
c AS (  -- t2: the medal "Vapaussodan muistomitali" removed, a proper noun nobody can rename
  SELECT page_id, t0, t1, REPLACE(t1, 'vapaussodan muistomital', ' ') AS t2 FROM b
),
d AS (  -- t3: category links and file embeds removed
  SELECT page_id, t0, t1, t2, REGEXP_REPLACE(t2,
    '\\[\\[(?:luokka|category|kuva|tiedosto|file|image):[^\\]]*\\]\\]', ' ') AS t3 FROM c
),
e AS (  -- t4: hidden targets of piped links removed: [[Suomen sisällissota|...  what is left is running text
  SELECT page_id, t0, t1, t2, t3, REGEXP_REPLACE(t3, '\\[\\[[^\\]|]*\\|', ' ') AS t4 FROM d
),
n AS (
  SELECT name.name, e.page_id,
    (CHAR_LENGTH(t0) - CHAR_LENGTH(REGEXP_REPLACE(t0, name.re, ''))) DIV name.len AS c0,
    (CHAR_LENGTH(t1) - CHAR_LENGTH(REGEXP_REPLACE(t1, name.re, ''))) DIV name.len AS c1,
    (CHAR_LENGTH(t2) - CHAR_LENGTH(REGEXP_REPLACE(t2, name.re, ''))) DIV name.len AS c2,
    (CHAR_LENGTH(t3) - CHAR_LENGTH(REGEXP_REPLACE(t3, name.re, ''))) DIV name.len AS c3,
    (CHAR_LENGTH(t4) - CHAR_LENGTH(REGEXP_REPLACE(t4, name.re, ''))) DIV name.len AS c4
  FROM e JOIN name
)
SELECT name,
       COUNT(*)        AS articles_total,
       SUM(c0 > 0)     AS articles,           -- articles with any mention
       SUM(c0)         AS mentions,           -- all mentions
       SUM(c0 - c1)    AS other_countries,    -- Viron vapaussota, Venäjän sisällissota ...
       SUM(c1 - c2)    AS medal,              -- Vapaussodan muistomitali
       SUM(c2 - c3)    AS category_or_file,   -- [[Luokka:...]] and [[Kuva:...]]
       SUM(c3 - c4)    AS link_target,        -- hidden target of [[target|label]]
       SUM(c4)         AS running_text,       -- what the reader sees
       SUM(c4 > 0)     AS articles_running
FROM n GROUP BY name ORDER BY mentions DESC;
