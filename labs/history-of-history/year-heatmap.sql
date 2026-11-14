-- Part 2: which years of history the articles mention, as they stood on one date.
-- A year is a run of exactly four digits between 1000 and 2026. Footnotes
-- (<ref>...</ref>, <ref ... />) and citation templates ({{Kirjaviite ...}},
-- {{Verkkoviite ...}}, {{Lehtiviite ...}}) are removed first, because their
-- access and publication dates say when a source was read or printed, not which
-- year the article is about. Century phrases (1800-luvulla = in the 19th century)
-- are removed too, they would all land on the round year. The cleaned text is turned
-- into a JSON array of its digit runs and JSON_TABLE unnests it into one row per number.
SELECT j.tok + 0                 AS year_mentioned,
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
GROUP BY year_mentioned;
