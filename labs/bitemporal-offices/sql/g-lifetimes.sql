-- How long statements live: claim lifetime rows per office, how many are current, and the versions they stand for.
SELECT a.office, COUNT(*) AS claim_rows, SUM(a.row_end > NOW(6)) AS current_rows,
       SUM(a.versions) AS versions_covered, MAX(a.versions) AS most_versions_in_one_row,
       COUNT(DISTINCT a.page_id) AS articles
FROM office_term FOR SYSTEM_TIME ALL a GROUP BY a.office WITH ROLLUP;
