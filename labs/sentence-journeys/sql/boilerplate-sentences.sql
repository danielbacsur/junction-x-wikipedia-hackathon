SELECT HEX(c.sentence_hash) hash,c.articles,t.sentence FROM sentence_counts c JOIN sentence_text t USING(sentence_hash) ORDER BY articles DESC,t.sentence LIMIT 40;
