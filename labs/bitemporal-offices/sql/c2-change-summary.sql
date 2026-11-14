-- (c, summary) The 45 direct replacements by office, by who made them and by where they led.
SELECT a.office,
       COUNT(*) AS changes,
       SUM(a.open_ended AND NOT b.open_ended AND a.valid_from = b.valid_from) AS term_closed,
       SUM(nb.rev_id IS NOT NULL) AS to_todays_value,
       SUM(nb.rev_id IS NULL AND na.rev_id IS NOT NULL) AS away_from_todays_value,
       SUM(nb.rev_id IS NULL AND na.rev_id IS NULL) AS between_superseded_values,
       SUM(b.editor_kind = 'ip') AS by_ip_editors,
       SUM(b.comment IS NULL OR b.comment = '') AS without_edit_summary
FROM office_term FOR SYSTEM_TIME ALL a
JOIN office_term FOR SYSTEM_TIME ALL b
  ON b.page_id = a.page_id AND b.office = a.office AND b.row_start = a.row_end
 AND a.valid_from < b.valid_to AND b.valid_from < a.valid_to
LEFT JOIN office_term nb ON nb.page_id = b.page_id AND nb.office = b.office
                        AND nb.valid_from = b.valid_from AND nb.valid_to = b.valid_to
LEFT JOIN office_term na ON na.page_id = a.page_id AND na.office = a.office
                        AND na.valid_from = a.valid_from AND na.valid_to = a.valid_to
GROUP BY a.office WITH ROLLUP;
