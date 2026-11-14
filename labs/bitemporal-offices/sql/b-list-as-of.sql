-- (b) The list of presidents with their stated terms, as Wikipedia had it at the end of 2006, 2012, 2020 and now.
WITH as_of AS (
  SELECT '2006' AS label, TIMESTAMP '2006-12-31 23:59:59' AS t UNION ALL
  SELECT '2012', TIMESTAMP '2012-12-31 23:59:59' UNION ALL
  SELECT '2020', TIMESTAMP '2020-12-31 23:59:59' UNION ALL
  SELECT 'now',  NOW(6))
SELECT o.person,
       GROUP_CONCAT(DISTINCT CASE WHEN label = '2006' THEN CONCAT(valid_from, ' .. ', IF(open_ended, '', valid_to)) END) AS as_of_2006,
       GROUP_CONCAT(DISTINCT CASE WHEN label = '2012' THEN CONCAT(valid_from, ' .. ', IF(open_ended, '', valid_to)) END) AS as_of_2012,
       GROUP_CONCAT(DISTINCT CASE WHEN label = '2020' THEN CONCAT(valid_from, ' .. ', IF(open_ended, '', valid_to)) END) AS as_of_2020,
       GROUP_CONCAT(DISTINCT CASE WHEN label = 'now'  THEN CONCAT(valid_from, ' .. ', IF(open_ended, '', valid_to)) END) AS as_of_now
FROM as_of
JOIN office_term FOR SYSTEM_TIME ALL o ON o.row_start <= as_of.t AND o.row_end > as_of.t
WHERE o.office = 'Suomen tasavallan presidentti'
GROUP BY o.person
ORDER BY MIN(o.valid_from);
