CREATE TABLE facts AS SELECT s.*,e.user author,e.editor,e.saved_at birth_edit_at,YEAR(s.a) cohort,
CASE WHEN e.editor='named' THEN 'named' WHEN e.editor IN ('ip','temp') THEN 'anonymous' ELSE 'hidden_or_missing' END editor_group,
CASE WHEN s.chars<200 THEN '80-199' WHEN s.chars<500 THEN '200-499' WHEN s.chars<1000 THEN '500-999' ELSE '1000+' END length_bucket,
TIMESTAMPDIFF(MICROSECOND,s.a,LEAST(s.b,'2026-10-01 10:59:12'))/1000000 duration,
s.b>'2026-10-01 10:59:12' standing,IF(s.b<='2026-10-01 10:59:12' AND d.rev_id IS NOT NULL AND d.undone_by IS NULL,1,0) event,
IF(s.b<='2026-10-01 10:59:12',1,0) raw_event,d.rev_id removing_rev,d.user remover,d.comment removal_comment,d.undone_by removal_undone_by
FROM stays s LEFT JOIN wtt.edit e ON e.rev_id=s.born_rev LEFT JOIN end_edit d ON d.page_id=s.page_id AND d.saved_at=s.b
WHERE s.kind IN ('prose','list') AND s.chars>=80;
