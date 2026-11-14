SELECT COUNT(DISTINCT x.page_id,x.revert_rev_id) invalid_hash_named_revert_events
 FROM lab_exposure_clock.event_edges x JOIN wtt.edit r ON r.rev_id=x.revert_rev_id WHERE r.sha1 IS NULL;
