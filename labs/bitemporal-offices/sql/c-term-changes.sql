-- (c) Every time one stated term directly replaced another: a statement's system period ends (a.row_end)
--     at the instant another statement about an overlapping period in the same article begins (b.row_start).
--     The version that made the change is b.rev_id, with its editor and edit summary.
SELECT b.row_start AS changed_at, a.person, a.office,
       CASE WHEN a.open_ended AND NOT b.open_ended AND a.valid_from = b.valid_from THEN 'term closed'
            WHEN a.valid_from <> b.valid_from AND a.valid_to <> b.valid_to THEN 'start and end'
            WHEN a.valid_from <> b.valid_from THEN 'start' ELSE 'end' END AS what_changed,
       a.valid_from AS from_before, IF(a.open_ended, NULL, a.valid_to) AS to_before,
       b.valid_from AS from_after,  IF(b.open_ended, NULL, b.valid_to) AS to_after,
       CASE WHEN nb.rev_id IS NOT NULL THEN 'to today''s value'
            WHEN na.rev_id IS NOT NULL THEN 'away from today''s value'
            ELSE 'between two values Wikipedia no longer states' END AS verdict,
       IF(b.row_end > NOW(), NULL, ROUND(TIMESTAMPDIFF(SECOND, b.row_start, b.row_end) / 86400, 2)) AS new_value_stood_days,
       c.rev_id IS NOT NULL AS then_put_back,
       b.editor, b.editor_kind, b.rev_id, b.comment
FROM office_term FOR SYSTEM_TIME ALL a
JOIN office_term FOR SYSTEM_TIME ALL b
  ON b.page_id = a.page_id AND b.office = a.office
 AND b.row_start = a.row_end
 AND a.valid_from < b.valid_to AND b.valid_from < a.valid_to
LEFT JOIN office_term nb ON nb.page_id = b.page_id AND nb.office = b.office
                        AND nb.valid_from = b.valid_from AND nb.valid_to = b.valid_to
LEFT JOIN office_term na ON na.page_id = a.page_id AND na.office = a.office
                        AND na.valid_from = a.valid_from AND na.valid_to = a.valid_to
LEFT JOIN office_term FOR SYSTEM_TIME ALL c
       ON c.page_id = a.page_id AND c.office = a.office AND c.row_start = b.row_end
      AND c.valid_from = a.valid_from AND c.valid_to = a.valid_to
ORDER BY changed_at, a.valid_from;
