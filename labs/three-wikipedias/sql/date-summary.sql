-- How many topic and language pairs can be compared on full dates at all, and how many share one.
SELECT COUNT(*) AS comparable_pairs,
       SUM(shared > 0) AS pairs_sharing_a_date,
       COUNT(DISTINCT qid) AS comparable_topics
FROM (
  SELECT a.qid, a.lang AS lang_a, b.lang AS lang_b,
         (SELECT COUNT(*) FROM lab_three_wikipedias.lead_date AS x
          JOIN lab_three_wikipedias.lead_date AS y ON y.qid = x.qid AND y.day_number = x.day_number
          WHERE x.qid = a.qid AND x.lang = a.lang AND y.lang = b.lang) AS shared
  FROM (SELECT DISTINCT qid, lang FROM lab_three_wikipedias.lead_date) AS a
  JOIN (SELECT DISTINCT qid, lang FROM lab_three_wikipedias.lead_date) AS b ON b.qid = a.qid AND a.lang < b.lang
) AS pairs
