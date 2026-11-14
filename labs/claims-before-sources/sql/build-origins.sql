CREATE TABLE origins AS SELECT page_id,slot,MIN(a) written,MIN(IF(has_ref,a,NULL)) referenced FROM stays GROUP BY page_id,slot;
