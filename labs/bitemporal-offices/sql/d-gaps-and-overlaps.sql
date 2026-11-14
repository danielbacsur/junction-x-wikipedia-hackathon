-- (d) Where Wikipedia's own articles disagree with each other: consecutive presidents whose stated terms
--     leave a gap (nobody) or overlap (two at once), as Wikipedia stood at the end of each year.
WITH as_of AS (
  SELECT seq AS y, TIMESTAMP(CONCAT(seq, '-12-31 23:59:59')) AS t FROM seq_2006_to_2025
  UNION ALL SELECT 2026, NOW(6)),
snap AS (
  SELECT y, person, valid_from, valid_to,
         LAG(person)   OVER w AS prev_person,
         LAG(valid_to) OVER w AS prev_to
  FROM as_of
  JOIN office_term FOR SYSTEM_TIME ALL o ON o.row_start <= as_of.t AND o.row_end > as_of.t
  WHERE o.office = 'Suomen tasavallan presidentti'
  WINDOW w AS (PARTITION BY y ORDER BY valid_from, valid_to))
SELECT IF(valid_from > prev_to, 'gap: nobody', 'overlap: two at once') AS kind,
       prev_person AS outgoing, prev_to AS outgoing_stated_end,
       person AS incoming, valid_from AS incoming_stated_start,
       ABS(DATEDIFF(valid_from, prev_to)) AS days,
       MIN(y) AS first_year_end, MAX(y) AS last_year_end, COUNT(*) AS year_ends
FROM snap
WHERE prev_to IS NOT NULL AND valid_from <> prev_to
GROUP BY kind, outgoing, outgoing_stated_end, incoming, incoming_stated_start, days
ORDER BY incoming_stated_start, first_year_end;
