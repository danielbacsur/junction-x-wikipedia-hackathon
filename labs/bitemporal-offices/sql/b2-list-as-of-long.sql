-- (b, chart form) One row per president per as-of date.
WITH as_of AS (
  SELECT '2006-12-31' AS as_of, TIMESTAMP '2006-12-31 23:59:59' AS t UNION ALL
  SELECT '2012-12-31', TIMESTAMP '2012-12-31 23:59:59' UNION ALL
  SELECT '2020-12-31', TIMESTAMP '2020-12-31 23:59:59' UNION ALL
  SELECT 'now', NOW(6))
SELECT as_of.as_of, o.person, o.valid_from, IF(o.open_ended, NULL, o.valid_to) AS valid_to, o.open_ended,
       o.rev_id, DATE(o.row_start) AS said_since
FROM as_of
JOIN office_term FOR SYSTEM_TIME ALL o ON o.row_start <= as_of.t AND o.row_end > as_of.t
WHERE o.office = 'Suomen tasavallan presidentti'
ORDER BY as_of.as_of, o.valid_from;
