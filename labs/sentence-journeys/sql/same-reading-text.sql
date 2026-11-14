SELECT COUNT(*) hashes,COUNT(DISTINCT SHA2(t.text,256)) clean_texts FROM spread s JOIN wtt.passage_text t USING(hash) WHERE s.articles>=2;
