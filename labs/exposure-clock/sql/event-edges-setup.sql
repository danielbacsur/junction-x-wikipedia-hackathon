DROP TABLE IF EXISTS lab_exposure_clock.event_edges;
CREATE TABLE lab_exposure_clock.event_edges AS
SELECT r.page_id,r.rev_id revert_rev_id,r.saved_at revert_at,r.user reverter,e.user,r.sha1 IS NOT NULL identity_valid,COUNT(*) undone_versions
FROM wtt.edit r JOIN wtt.seq_1_to_10000 s ON s.seq<r.seq-r.restores
JOIN wtt.edit e ON e.page_id=r.page_id AND e.seq=r.restores+s.seq
WHERE r.restores IS NOT NULL AND r.editor='named' AND e.editor='named' AND BINARY r.user<>BINARY e.user
GROUP BY r.page_id,r.rev_id,r.saved_at,r.user,e.user;
