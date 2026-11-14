SELECT COUNT(*) list_wordings,SUM(a.articles>=2) shared,SUM(a.articles>=20) twenty_plus,MAX(a.articles) max_articles FROM all_spread a JOIN wtt.passage_text t USING(hash) WHERE t.kind='list';
