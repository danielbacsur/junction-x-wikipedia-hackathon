CREATE TABLE sentence_counts AS SELECT s.sentence_hash,COUNT(DISTINCT p.page_id) articles FROM sentence_map s JOIN hash_pages p ON p.hash=s.hash GROUP BY s.sentence_hash;
