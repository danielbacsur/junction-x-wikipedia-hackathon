SELECT HEX(hash),kind,text,wikitext FROM passage_text WHERE hash=UNHEX(%s);
