-- The opening 6,000 characters of every history-of-Finland article whose topic
-- (wikidata_id) exists in at least two of the three languages.
-- Parameters: language, last page_id of the previous chunk. 500 rows per chunk.
SELECT a.lang, a.page_id, a.rev_id, a.wikidata_id, a.title, a.url, a.date_modified,
       CHAR_LENGTH(a.text) AS chars, LEFT(a.text, 6000) AS head
FROM article AS a
JOIN (SELECT wikidata_id
      FROM article
      WHERE history = 1 AND wikidata_id IS NOT NULL
      GROUP BY wikidata_id
      HAVING COUNT(DISTINCT lang) >= 2) AS shared ON shared.wikidata_id = a.wikidata_id
WHERE a.history = 1 AND a.lang = %s AND a.page_id > %s
ORDER BY a.page_id
LIMIT 500
