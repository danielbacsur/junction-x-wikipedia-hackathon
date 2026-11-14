SELECT p.page_id,p.slot,p.a,p.b,p.born_rev,t.text before_text,t.wikitext before_wikitext FROM pre_refs p JOIN wtt.passage_text t ON t.hash=p.hash;
