CREATE TABLE raw AS SELECT p.page_id,p.hash,p.dup,p.born_rev,p.slot,p.row_start a,p.row_end b,t.kind,t.chars
FROM wtt.passage FOR SYSTEM_TIME ALL p JOIN wtt.passage_text t ON t.hash=p.hash
WHERE p.row_start <= '2026-10-01 10:59:12';
