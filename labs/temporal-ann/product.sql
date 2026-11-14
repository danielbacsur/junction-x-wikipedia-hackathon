-- Bind ? as (raw little-endian float32 query vector, UTC as-of timestamp).
-- life: slim system-versioned lifetime table; b: one vector per wording.
-- STRAIGHT_JOIN makes the lifetime table drive vector lookups.
SET time_zone = '+00:00';
SELECT b.id, VEC_DISTANCE_COSINE(b.embedding, ?) AS distance
FROM lab_temporal_ann.life FOR SYSTEM_TIME AS OF TIMESTAMP ? AS l
STRAIGHT_JOIN lab_temporal_ann.b IGNORE INDEX (embedding) ON b.id = l.id
ORDER BY distance
LIMIT 10;
