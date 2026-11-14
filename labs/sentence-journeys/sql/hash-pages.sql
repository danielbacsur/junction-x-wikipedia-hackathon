CREATE TABLE hash_pages AS SELECT DISTINCT p.hash,p.page_id FROM wtt.passage FOR SYSTEM_TIME ALL p JOIN wtt.passage_text t ON t.hash=p.hash WHERE t.kind='prose';
