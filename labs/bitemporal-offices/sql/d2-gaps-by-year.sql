-- (d, chart form) Per year end: how many presidents had a stated term, how many handovers did not meet,
--     and how many days were claimed by nobody or by two presidents.
WITH as_of AS (
  SELECT seq AS y, TIMESTAMP(CONCAT(seq, '-12-31 23:59:59')) AS t FROM seq_2006_to_2025
  UNION ALL SELECT 2026, NOW(6)),
snap AS (
  SELECT y, person, valid_from, valid_to, LAG(valid_to) OVER w AS prev_to
  FROM as_of
  JOIN office_term FOR SYSTEM_TIME ALL o ON o.row_start <= as_of.t AND o.row_end > as_of.t
  WHERE o.office = 'Suomen tasavallan presidentti'
  WINDOW w AS (PARTITION BY y ORDER BY valid_from, valid_to))
SELECT y AS year_end, COUNT(*) AS stated_terms,
       SUM(prev_to IS NOT NULL AND valid_from > prev_to) AS gaps,
       COALESCE(SUM(IF(valid_from > prev_to, DATEDIFF(valid_from, prev_to), 0)), 0) AS gap_days,
       SUM(prev_to IS NOT NULL AND valid_from < prev_to) AS overlaps,
       COALESCE(SUM(IF(valid_from < prev_to, DATEDIFF(prev_to, valid_from), 0)), 0) AS overlap_days
FROM snap GROUP BY y ORDER BY y;
