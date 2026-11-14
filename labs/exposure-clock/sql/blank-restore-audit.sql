SELECT r.page_id,r.rev_id,r.saved_at,r.bytes,r.sha1,r.comment,t.rev_id target_rev_id,t.bytes target_bytes,t.sha1 target_sha,t.saved_at target_at
 FROM wtt.edit r JOIN wtt.edit t ON t.page_id=r.page_id AND t.seq=r.restores WHERE r.seq-r.restores-1=1106;
