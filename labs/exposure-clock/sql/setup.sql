CREATE DATABASE IF NOT EXISTS lab_exposure_clock;
DROP TABLE IF EXISTS lab_exposure_clock.fact;
CREATE TABLE lab_exposure_clock.fact AS
SELECT e.page_id,e.seq,e.rev_id,e.saved_at,e.ended_at,e.user,e.editor,e.comment,e.delta,
 r.seq revert_seq,r.rev_id revert_rev_id,r.saved_at revert_at,r.user reverter,r.editor reverter_editor,r.comment revert_comment,r.restores,
 t.saved_at restored_at,r.sha1 IS NOT NULL identity_valid,r.bytes revert_bytes,
 TIMESTAMPDIFF(SECOND,e.saved_at,r.saved_at) exposure_seconds,
 TIMESTAMPDIFF(SECOND,e.saved_at,COALESCE(e.ended_at,r.saved_at)) live_seconds,
 CAST(r.seq AS SIGNED)-CAST(r.restores AS SIGNED)-1 span_edits,
 TIMESTAMPDIFF(SECOND,t.saved_at,r.saved_at) target_age_seconds,
 CASE WHEN e.user IS NOT NULL AND e.editor<>'hidden' AND r.editor<>'hidden' AND BINARY e.user=BINARY r.user THEN 1 ELSE 0 END self_revert,
 CASE WHEN TIMESTAMPDIFF(SECOND,t.saved_at,r.saved_at)>31536000 OR r.seq-r.restores-1>50 THEN 'long_range'
 WHEN TIMESTAMPDIFF(SECOND,t.saved_at,r.saved_at)<=604800 AND r.seq-r.restores-1<=5 THEN 'short_local'
 ELSE 'intermediate' END population
FROM wtt.edit e JOIN wtt.edit r ON r.page_id=e.page_id AND r.seq=e.undone_by
JOIN wtt.edit t ON t.page_id=r.page_id AND t.seq=r.restores;
ALTER TABLE lab_exposure_clock.fact ADD PRIMARY KEY(page_id,seq),ADD INDEX(saved_at),ADD INDEX(revert_at);
