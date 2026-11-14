ALTER TABLE raw ADD INDEX(hash,page_id), ADD INDEX(page_id,hash,dup,s);
