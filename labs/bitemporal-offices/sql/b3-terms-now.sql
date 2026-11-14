-- Every term Wikipedia states today, all loaded offices.
SELECT office, person, valid_from, IF(open_ended, NULL, valid_to) AS valid_to, open_ended, rev_id,
       DATE(row_start) AS said_since, versions
FROM office_term
ORDER BY office, valid_from;
