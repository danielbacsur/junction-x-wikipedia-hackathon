-- One vector per distinct wording, whenever it lived. Like the words, the
-- vectors sit in a plain table keyed by the hash: a wording that leaves an
-- article and comes back is still one meaning, embedded once. Time comes
-- from joining the versioned passage table.
CREATE TABLE IF NOT EXISTS passage_vector (
  hash      BINARY(8)    NOT NULL,
  embedding VECTOR(1024) NOT NULL,
  PRIMARY KEY (hash),
  VECTOR INDEX (embedding) M=16 DISTANCE=cosine
);
