SELECT title,template,slot,field,value,raw_value,rev_id,editor,row_start
FROM statement FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59'
WHERE page_id = 1275
ORDER BY template,slot,field;
