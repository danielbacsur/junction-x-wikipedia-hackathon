-- Size of every lifespan disagreement, one row per topic, field and pair of languages.
SELECT field, size, COUNT(*) AS pairs, SUM(approx) AS marked_approximate,
       SUM(old_style) AS lead_mentions_old_style, SUM(calendar_shaped) AS julian_gap_exactly
FROM lab_three_wikipedias.fact_pair
WHERE gap > 0
GROUP BY field, size
ORDER BY field, FIELD(size, '1 day', '2 to 31 days', 'up to a year', 'one calendar year, only years given', 'more than a year')
