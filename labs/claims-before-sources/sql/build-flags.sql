CREATE TABLE flags AS SELECT hash,kind,chars,(wikitext REGEXP '<ref([[:space:]/>])') has_ref FROM wtt.passage_text;
