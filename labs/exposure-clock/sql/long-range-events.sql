SELECT f.page_id,a.title,f.revert_rev_id,MIN(f.revert_at) revert_at,MIN(f.revert_comment) revert_comment,
 MIN(f.span_edits) span_edits,COUNT(*) undone_versions,SUM(f.exposure_seconds)/3600 version_hours
 FROM lab_exposure_clock.fact f LEFT JOIN wtt.article a ON a.lang='fi' AND a.page_id=f.page_id
 GROUP BY f.page_id,a.title,f.revert_rev_id ORDER BY version_hours DESC LIMIT 20;
