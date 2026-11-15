SELECT title,template,slot,field,value,rev_id,editor,comment,row_start,row_end
FROM statement FOR SYSTEM_TIME ALL
WHERE page_id = 1275 AND field = 'syntymäaika'
ORDER BY row_start;
