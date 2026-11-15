-- The statements bench.py times, written out for one article (Talvisota,
-- page 1256) and one date. Replace lab_history_at_scale.p_flat by
-- wtt.passage, p_hc, p_year or p_idx to ask another layout.
USE lab_history_at_scale;
SET time_zone = '+00:00';

-- blocks: every block of one article as of a moment
SELECT p.hash, p.dup, p.ord, p.gap, p.rev_id, p.born_rev, p.slot
FROM p_flat FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p
WHERE p.page_id = 1256
ORDER BY p.ord;

-- blocks_text: the same, joined to the wording
SELECT HEX(p.hash), t.kind, t.chars, p.born_rev, p.slot
FROM p_flat FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p
JOIN wtt.passage_text AS t USING (hash)
WHERE p.page_id = 1256
ORDER BY p.ord;

-- diff: the blocks that stood at exactly one of two moments
SELECT HEX(u.hash), MAX(u.side), t.kind, MAX(u.slot), MAX(u.born_rev)
FROM (
  SELECT 'from' AS side, hash, dup, slot, born_rev, ord
  FROM p_flat FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p
  WHERE page_id = 1256
  UNION ALL
  SELECT 'to', hash, dup, slot, born_rev, ord
  FROM p_flat AS p WHERE page_id = 1256
) AS u
JOIN wtt.passage_text AS t USING (hash)
GROUP BY u.hash, u.dup
HAVING COUNT(*) = 1
ORDER BY MAX(u.ord);

-- wording: the whole history of one wording in one article
SELECT row_start, row_end, born_rev, slot, row_end > NOW()
FROM p_flat FOR SYSTEM_TIME ALL AS p
WHERE page_id = 1256 AND hash = (
  SELECT hash FROM wtt.passage FOR SYSTEM_TIME ALL
  WHERE page_id = 1256 GROUP BY hash ORDER BY COUNT(*) DESC, hash LIMIT 1)
ORDER BY row_start;

-- search: 300 candidate wordings joined to what stood at a moment
SELECT p.page_id, HEX(p.hash), p.born_rev, p.slot
FROM cand AS c
JOIN p_flat FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p USING (hash);

-- global: how many passages stood on 31 Dec 2010 across all articles
SELECT COUNT(*)
FROM p_flat FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' AS p;

-- An index is forced by a hint after the alias, as bench.py does for the
-- labels idx_pe, idx_ps, idx_se and idx_es:
SELECT p.hash, p.dup, p.ord, p.gap, p.rev_id, p.born_rev, p.slot
FROM p_idx FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p FORCE INDEX (ps)
WHERE p.page_id = 1256
ORDER BY p.ord;

-- Rows read for one answer: the session's handler counters before and after.
SHOW SESSION STATUS LIKE 'Handler_read%';
SELECT COUNT(*) FROM p_flat WHERE page_id = 1256;
SHOW SESSION STATUS LIKE 'Handler_read%';
