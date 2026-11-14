CREATE TABLE sentence_map (hash BINARY(8), sentence_hash BINARY(20), PRIMARY KEY(hash,sentence_hash), INDEX(sentence_hash));
