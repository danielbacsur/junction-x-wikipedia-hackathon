-- How many topic and language pairs can be compared on quantities, and how many share one exactly.
SELECT COUNT(*) AS comparable_pairs,
       SUM(shared > 0) AS pairs_sharing_a_number,
       COUNT(DISTINCT qid) AS comparable_topics
FROM (
  SELECT a.qid, a.lang AS lang_a, b.lang AS lang_b,
         (SELECT COUNT(*) FROM lab_three_wikipedias.lead_quantity AS x
          JOIN lab_three_wikipedias.lead_quantity AS y ON y.qid = x.qid AND y.value = x.value
          WHERE x.qid = a.qid AND x.lang = a.lang AND y.lang = b.lang) AS shared
  FROM (SELECT DISTINCT qid, lang FROM lab_three_wikipedias.lead_quantity) AS a
  JOIN (SELECT DISTINCT qid, lang FROM lab_three_wikipedias.lead_quantity) AS b ON b.qid = a.qid AND a.lang < b.lang
) AS pairs
