WITH edges AS (
 SELECT page_id,DATE_FORMAT(revert_at,'%Y-%m') month,revert_rev_id,reverter,user,SUM(undone_versions) undone_versions
 FROM lab_exposure_clock.event_edges WHERE identity_valid=1
 GROUP BY page_id,month,revert_rev_id,reverter,user),
 clusters AS (SELECT page_id,month,COUNT(DISTINCT revert_rev_id) revert_events,COUNT(*) event_user_edges,SUM(undone_versions) undone_versions
 FROM edges GROUP BY page_id,month),
 top_clusters AS (SELECT * FROM clusters ORDER BY revert_events DESC,page_id,month LIMIT 20),
 pairs AS (SELECT e.page_id,e.month,e.reverter,e.user,COUNT(*) revert_events,SUM(e.undone_versions) undone_versions
 FROM edges e JOIN top_clusters t ON t.page_id=e.page_id AND t.month=e.month GROUP BY e.page_id,e.month,e.reverter,e.user)
 SELECT t.*,a.title,p.reverter,p.user reverted_user,p.revert_events pair_revert_events,p.undone_versions pair_undone_versions
 FROM top_clusters t LEFT JOIN wtt.article a ON a.lang='fi' AND a.page_id=t.page_id
 JOIN pairs p ON p.page_id=t.page_id AND p.month=t.month
 ORDER BY t.revert_events DESC,t.page_id,t.month,p.revert_events DESC,p.reverter,p.user;
