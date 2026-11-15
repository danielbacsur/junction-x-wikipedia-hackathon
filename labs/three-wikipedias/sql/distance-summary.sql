-- Cosine distance between the vectors of the same topic, by pair of languages.
SELECT CONCAT(lang_a, '-', lang_b) AS pair, COUNT(*) AS topics,
       ROUND(MIN(distance), 4) AS smallest, ROUND(AVG(distance), 4) AS mean, ROUND(MAX(distance), 4) AS largest,
       SUM(distance < 0.2) AS under_0_2, SUM(distance >= 0.2 AND distance < 0.3) AS from_0_2,
       SUM(distance >= 0.3 AND distance < 0.4) AS from_0_3, SUM(distance >= 0.4 AND distance < 0.5) AS from_0_4,
       SUM(distance >= 0.5) AS from_0_5, SUM(truncated) AS truncated
FROM lab_three_wikipedias.topic_distance
GROUP BY lang_a, lang_b
