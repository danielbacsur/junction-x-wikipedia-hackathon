SELECT HEX(a.hash) hash,t.kind,t.chars,a.articles,t.text FROM all_spread a JOIN wtt.passage_text t USING(hash) WHERE t.kind IN ('prose','list') ORDER BY a.articles DESC,t.chars DESC LIMIT 40;
