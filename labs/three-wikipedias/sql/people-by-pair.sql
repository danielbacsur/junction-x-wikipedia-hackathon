-- The same by pair of languages: compared facts and disagreements.
SELECT CONCAT(lang_a, '-', lang_b) AS pair, field, COUNT(*) AS compared, SUM(gap > 0) AS disagree,
       ROUND(100 * SUM(gap > 0) / COUNT(*), 2) AS percent
FROM lab_three_wikipedias.fact_pair
GROUP BY lang_a, lang_b, field
ORDER BY lang_a, lang_b, field
