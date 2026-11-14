-- (c, continued) Statements that got past the revert filter and still stood for less than a day:
--     the candidates for "vandalism that slipped through". Read the summaries: they are typos and half-finished edits.
SELECT person, office, valid_from, IF(open_ended, NULL, valid_to) AS valid_to, row_start AS said_from,
       TIMESTAMPDIFF(SECOND, row_start, row_end) AS stood_seconds, versions, editor, editor_kind, rev_id, comment
FROM office_term FOR SYSTEM_TIME ALL
WHERE row_end < NOW(6) AND TIMESTAMPDIFF(SECOND, row_start, row_end) < 86400
ORDER BY row_start;
