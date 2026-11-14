-- (d, continued) A bitemporal join: two different articles claiming the same office for overlapping days
--     (valid periods intersect) while both statements were live (system periods intersect).
SELECT a.person AS one, a.valid_from AS one_from, a.valid_to AS one_to,
       b.person AS other, b.valid_from AS other_from, b.valid_to AS other_to,
       DATEDIFF(LEAST(a.valid_to, b.valid_to), GREATEST(a.valid_from, b.valid_from)) AS days_claimed_twice,
       GREATEST(a.row_start, b.row_start) AS both_said_from,
       TIMESTAMPDIFF(SECOND, GREATEST(a.row_start, b.row_start), LEAST(a.row_end, b.row_end, NOW(6))) AS both_said_for_seconds
FROM office_term FOR SYSTEM_TIME ALL a
JOIN office_term FOR SYSTEM_TIME ALL b
  ON b.office = a.office AND b.page_id <> a.page_id
 AND (a.valid_from < b.valid_from OR (a.valid_from = b.valid_from AND a.page_id < b.page_id))
 AND a.valid_from < b.valid_to AND b.valid_from < a.valid_to      -- valid time overlaps
 AND a.row_start  < b.row_end  AND b.row_start  < a.row_end       -- system time overlaps
WHERE a.office = 'Suomen tasavallan presidentti'
ORDER BY both_said_from;
