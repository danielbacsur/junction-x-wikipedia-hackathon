-- Topics by the languages they exist in and whether their leads open with a lifespan.
SELECT kind, langs, COUNT(*) AS topics
FROM lab_three_wikipedias.topic
GROUP BY kind, langs
ORDER BY kind, langs
