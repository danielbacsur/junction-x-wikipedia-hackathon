ALTER TABLE facts ADD KEY k(page_id,hash,dup,a), ADD KEY sl(page_id,slot), ADD KEY endpoint(event,kind,duration);
