ALTER TABLE stays ADD KEY k(page_id,hash,dup,a), ADD KEY sl(page_id,slot,a), ADD KEY born(born_rev);
