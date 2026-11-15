SELECT b.page_id,b.title,b.field,a.value AS before_value,b.value AS after_value,
 b.row_start AS changed_at,b.rev_id,b.editor
FROM statement FOR SYSTEM_TIME ALL a
JOIN statement FOR SYSTEM_TIME ALL b
 ON b.page_id=a.page_id AND b.template=a.template AND b.slot=a.slot
 AND b.field=a.field AND b.row_start=a.row_end
WHERE b.field='syntymäaika' AND b.row_start>='2010-05-01' AND b.row_start<'2010-06-01'
ORDER BY b.row_start,b.page_id;
