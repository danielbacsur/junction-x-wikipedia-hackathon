-- Cosine distance between the bge-m3 vectors of the same topic in two languages.
-- Exact: both vectors are fetched by primary key, the HNSW index is not involved.
-- Parameters: first and last wikidata_id of a chunk of 500 topics.
INSERT INTO lab_three_wikipedias.topic_distance
SELECT a.wikidata_id, a.lang, b.lang,
       VEC_DISTANCE_COSINE(va.embedding, vb.embedding),
       CHAR_LENGTH(a.text), CHAR_LENGTH(b.text),
       (va.truncated OR vb.truncated)
FROM lab_three_wikipedias.topic AS t
JOIN wtt.article AS a ON a.wikidata_id = t.qid AND a.history = 1
JOIN wtt.article AS b ON b.wikidata_id = t.qid AND b.history = 1 AND a.lang < b.lang
JOIN wtt.article_vector AS va ON va.lang = a.lang AND va.page_id = a.page_id
JOIN wtt.article_vector AS vb ON vb.lang = b.lang AND vb.page_id = b.page_id
WHERE t.qid BETWEEN %s AND %s
