SELECT
 (SELECT COUNT(*) FROM wtt.edit WHERE undone_by IS NOT NULL) source_undone,
 COUNT(*) joined_undone,SUM(revert_seq<=seq) nonforward_reverts,SUM(restores>=seq) outside_restore_span,
 SUM(ended_at>revert_at) ends_after_revert,SUM(ended_at<revert_at) replaced_before_revert,
 SUM(exposure_seconds=0) zero_duration,
 (SELECT COUNT(*) FROM wtt.edit e JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by WHERE r.restores IS NULL) missing_restore
 FROM lab_exposure_clock.fact;
