SELECT COUNT(DISTINCT page_id,revert_rev_id) named_nonself_revert_events,SUM(undone_versions) named_nonself_undo_associations,
 COUNT(DISTINCT page_id,DATE_FORMAT(revert_at,'%Y-%m')) article_months FROM lab_exposure_clock.event_edges WHERE identity_valid=1;
