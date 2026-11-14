SELECT e.page_id,e.rev_id,CASE WHEN e.saved_at<'2025-09-01' THEN 'before' ELSE 'after' END period,
 CASE WHEN e.editor IN ('ip','temp') THEN 'anonymous' ELSE e.editor END editor_group,
 CASE WHEN r.saved_at<=e.saved_at+INTERVAL 7 DAY AND BINARY e.user<>BINARY r.user THEN 1 ELSE 0 END undone_7d,
 CASE WHEN r.saved_at<=e.saved_at+INTERVAL 7 DAY AND BINARY e.user<>BINARY r.user THEN TIMESTAMPDIFF(SECOND,e.saved_at,r.saved_at) END lag_seconds
 FROM wtt.edit e LEFT JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by
 WHERE ((e.saved_at>='2025-03-01' AND e.saved_at<'2025-09-01') OR (e.saved_at>='2025-10-01' AND e.saved_at<'2026-04-01')) AND e.editor IN ('ip','temp');
