SELECT f.page_id,a.title,f.seq,f.rev_id,f.saved_at,f.editor,f.user,f.comment,
 f.revert_rev_id,f.revert_at,f.reverter,f.reverter_editor,f.revert_comment,f.restores,f.restored_at,
 f.span_edits,f.target_age_seconds,f.exposure_seconds/86400 exposure_days,f.live_seconds/86400 exact_version_days,f.self_revert,f.population
 FROM lab_exposure_clock.fact f LEFT JOIN wtt.article a ON a.lang='fi' AND a.page_id=f.page_id
 WHERE f.exposure_seconds>31536000 ORDER BY f.exposure_seconds DESC,f.rev_id LIMIT 20;
