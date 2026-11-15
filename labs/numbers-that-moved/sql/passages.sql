SELECT p.page_id,p.slot,HEX(p.hash),p.born_rev,p.row_start,LEAST(p.row_end,'2026-10-01 10:59:12'),t.text
FROM passage FOR SYSTEM_TIME ALL AS p
JOIN passage_text AS t ON t.hash=p.hash
WHERE p.page_id BETWEEN %s AND %s AND t.kind='prose'
AND p.row_start < '2026-10-01 10:59:12' ;
