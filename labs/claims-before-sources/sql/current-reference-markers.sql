SELECT COUNT(*) n,SUM(t.wikitext LIKE '%{{sfn%') sfn,SUM(t.wikitext LIKE '%{{harv%') harv FROM current n JOIN wtt.passage_text t ON t.hash=n.hash WHERE NOT n.has_ref;
