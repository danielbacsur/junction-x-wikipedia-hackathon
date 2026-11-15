SELECT page_id,rev_id,saved_at,ended_at,user,editor,comment,reverted_by FROM edit WHERE page_id BETWEEN %s AND %s;
