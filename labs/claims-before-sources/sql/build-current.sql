CREATE TABLE current AS SELECT p.page_id,p.slot,p.hash,p.dup,p.born_rev,f.has_ref,f.chars FROM wtt.passage p JOIN flags f ON f.hash=p.hash WHERE f.kind='prose' AND f.chars>=80;
