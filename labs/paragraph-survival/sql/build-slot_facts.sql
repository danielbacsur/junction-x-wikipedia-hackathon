CREATE TABLE slot_facts AS SELECT s.page_id,s.slot,s.a,s.b,o.kind,o.chars,YEAR(s.a) cohort,
CASE WHEN e.editor='named' THEN 'named' WHEN e.editor IN ('ip','temp') THEN 'anonymous' ELSE 'hidden_or_missing' END editor_group,
CASE WHEN o.chars<200 THEN '80-199' WHEN o.chars<500 THEN '200-499' WHEN o.chars<1000 THEN '500-999' ELSE '1000+' END length_bucket,
TIMESTAMPDIFF(MICROSECOND,s.a,LEAST(s.b,'2026-10-01 10:59:12'))/1000000 duration,
IF(s.b<='2026-10-01 10:59:12' AND d.rev_id IS NOT NULL AND d.undone_by IS NULL,1,0) event,s.b>'2026-10-01 10:59:12' standing
FROM slots s JOIN slot_origin o USING(page_id,slot) LEFT JOIN wtt.edit e ON e.rev_id=o.born_rev
LEFT JOIN end_edit d ON d.page_id=s.page_id AND d.saved_at=s.b WHERE o.kind IN ('prose','list') AND o.chars>=80;
