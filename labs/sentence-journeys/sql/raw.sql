CREATE TABLE raw AS SELECT p.page_id,p.hash,p.dup,p.born_rev,p.row_start s,p.row_end e
 FROM wtt.passage FOR SYSTEM_TIME ALL p JOIN wtt.passage_text t ON t.hash=p.hash WHERE t.kind='prose' AND t.chars>=120;
