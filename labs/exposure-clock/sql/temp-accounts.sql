WITH horizon AS (SELECT MAX(saved_at) cutoff FROM wtt.edit),
 eligible AS (SELECT e.*,DATE_FORMAT(e.saved_at,'%Y-%m') month,r.saved_at revert_at,r.sha1 IS NOT NULL identity_valid,
 TIMESTAMPDIFF(SECOND,e.saved_at,r.saved_at) lag_seconds,
 CASE WHEN e.user IS NOT NULL AND BINARY e.user=BINARY r.user THEN 1 ELSE 0 END self_revert
 FROM wtt.edit e CROSS JOIN horizon h LEFT JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by
 WHERE e.saved_at>='2024-01-01' AND e.saved_at<=h.cutoff-INTERVAL 7 DAY),
 pct AS (SELECT month,editor,
 PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY lag_seconds) OVER(PARTITION BY month,editor) median_7d_seconds
 FROM eligible WHERE lag_seconds<=604800 AND self_revert=0),
 med AS (SELECT month,editor,MIN(median_7d_seconds) median_7d_seconds FROM pct GROUP BY month,editor)
 SELECT e.month,e.editor,COUNT(*) edits,SUM(revert_at IS NOT NULL) observed_undone,
 SUM(revert_at IS NOT NULL AND self_revert=1) observed_self_undone,
 SUM(lag_seconds<=604800 AND self_revert=0) other_undone_7d,
 AVG(COALESCE(lag_seconds<=604800 AND self_revert=0,0)) other_undone_7d_share,
 SUM(COALESCE(lag_seconds<=604800 AND self_revert=0 AND identity_valid,0)) valid_other_undone_7d,MAX(m.median_7d_seconds) median_7d_seconds
 FROM eligible e LEFT JOIN med m ON m.month=e.month AND m.editor=e.editor
 GROUP BY e.month,e.editor ORDER BY e.month,e.editor;
