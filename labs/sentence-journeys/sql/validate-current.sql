SELECT COUNT(*) n FROM (SELECT p.hash FROM wtt.passage p JOIN wtt.passage_text t USING(hash) WHERE t.kind='prose' AND t.chars>=120 GROUP BY p.hash HAVING COUNT(DISTINCT p.page_id)>=2) x;
