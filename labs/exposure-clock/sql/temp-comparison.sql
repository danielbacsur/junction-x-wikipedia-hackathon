WITH horizon AS (SELECT MAX(saved_at) cutoff FROM wtt.edit),
 eligible AS (SELECT e.*,CASE WHEN e.saved_at>='2025-03-01' AND e.saved_at<'2025-09-01' THEN 'before'
 WHEN e.saved_at>='2025-10-01' AND e.saved_at<'2026-04-01' THEN 'after' ELSE 'seasonal_baseline' END period,
 CASE WHEN e.editor IN ('ip','temp') THEN 'anonymous' ELSE e.editor END editor_group,
 r.saved_at revert_at,r.sha1 IS NOT NULL identity_valid,TIMESTAMPDIFF(SECOND,e.saved_at,r.saved_at) lag_seconds,
 CASE WHEN e.user IS NOT NULL AND BINARY e.user=BINARY r.user THEN 1 ELSE 0 END self_revert
 FROM wtt.edit e CROSS JOIN horizon h LEFT JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by
 WHERE ((e.saved_at>='2025-03-01' AND e.saved_at<'2025-09-01') OR (e.saved_at>='2025-10-01' AND e.saved_at<'2026-04-01') OR (e.saved_at>='2024-10-01' AND e.saved_at<'2025-04-01')) AND e.saved_at<=h.cutoff-INTERVAL 7 DAY),
 p AS (SELECT period,editor_group,PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY lag_seconds) OVER(PARTITION BY period,editor_group) median_seconds,
 PERCENTILE_CONT(0.9) WITHIN GROUP(ORDER BY lag_seconds) OVER(PARTITION BY period,editor_group) p90_seconds
 FROM eligible WHERE lag_seconds<=604800 AND self_revert=0),
 med AS (SELECT period,editor_group,MIN(median_seconds) median_7d_seconds,MIN(p90_seconds) p90_7d_seconds FROM p GROUP BY period,editor_group)
 SELECT e.period,e.editor_group,COUNT(*) edits,SUM(revert_at IS NOT NULL) observed_undone,
 SUM(COALESCE(lag_seconds<=604800 AND self_revert=0,0)) other_undone_7d,
 AVG(COALESCE(lag_seconds<=604800 AND self_revert=0,0)) other_undone_7d_share,
 SUM(COALESCE(lag_seconds<=604800 AND self_revert=0 AND identity_valid,0)) valid_other_undone_7d,MAX(m.median_7d_seconds) median_7d_seconds,MAX(m.p90_7d_seconds) p90_7d_seconds
 FROM eligible e LEFT JOIN med m ON m.period=e.period AND m.editor_group=e.editor_group
 GROUP BY e.period,e.editor_group ORDER BY e.period,e.editor_group;
