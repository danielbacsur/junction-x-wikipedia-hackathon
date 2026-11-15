-- Every pair of languages of a lifespan topic: the distance between the two articles
-- and whether the two leads disagree on the birth or the death.
SELECT d.qid, d.lang_a, d.lang_b, d.distance, d.chars_a, d.chars_b, MAX(p.gap > 0) AS disagree
FROM lab_three_wikipedias.topic_distance AS d
JOIN lab_three_wikipedias.fact_pair AS p ON p.qid = d.qid AND p.lang_a = d.lang_a AND p.lang_b = d.lang_b
GROUP BY d.qid, d.lang_a, d.lang_b
