-- Part 1b, step 2: edits that swap one name for another inside an existing article.
-- A swap is an edit after which name A occurs fewer times and name B more times
-- than in the version just before it (wtt.edit gives the order, seq - 1 is the
-- version before, a version without a row in name_count mentions no name at all).
CREATE OR REPLACE TABLE lab_history_of_history.swap AS
WITH nm AS (
  SELECT 1 AS i, 'sisällissota' AS name UNION ALL SELECT 2, 'vapaussota' UNION ALL SELECT 3, 'kansalaissota' UNION ALL
  SELECT 4, 'luokkasota' UNION ALL SELECT 5, 'veljessota' UNION ALL SELECT 6, 'punakapina'
),
v AS (  -- every version of every article that ever mentioned a name, with its counts
  SELECT e.page_id, e.seq, e.rev_id,
         COALESCE(c.sisallis, 0) AS n1, COALESCE(c.vapaus, 0) AS n2, COALESCE(c.kansalais, 0) AS n3,
         COALESCE(c.luokka, 0)   AS n4, COALESCE(c.veljes, 0) AS n5, COALESCE(c.punakapina, 0) AS n6
  FROM wtt.edit e
  LEFT JOIN lab_history_of_history.name_count c ON c.rev_id = e.rev_id
  WHERE e.page_id IN (SELECT page_id FROM lab_history_of_history.name_count)
),
w AS (  -- the same, next to the version before it
  SELECT v.*, LAG(n1) OVER p AS p1, LAG(n2) OVER p AS p2, LAG(n3) OVER p AS p3,
              LAG(n4) OVER p AS p4, LAG(n5) OVER p AS p5, LAG(n6) OVER p AS p6
  FROM v WINDOW p AS (PARTITION BY page_id ORDER BY seq)
),
x AS (  -- one row per version and name whose count changed
  SELECT w.page_id, w.seq, w.rev_id, nm.name,
         CASE nm.i WHEN 1 THEN p1 WHEN 2 THEN p2 WHEN 3 THEN p3 WHEN 4 THEN p4 WHEN 5 THEN p5 ELSE p6 END AS n_before,
         CASE nm.i WHEN 1 THEN n1 WHEN 2 THEN n2 WHEN 3 THEN n3 WHEN 4 THEN n4 WHEN 5 THEN n5 ELSE n6 END AS n_after
  FROM w JOIN nm
  WHERE p1 IS NOT NULL AND (n1 <> p1 OR n2 <> p2 OR n3 <> p3 OR n4 <> p4 OR n5 <> p5 OR n6 <> p6)
)
SELECT f.page_id, f.seq, f.rev_id,
       f.name AS name_from, t.name AS name_to,
       f.n_before AS from_before, f.n_after AS from_after,
       t.n_before AS to_before,   t.n_after AS to_after,
       LEAST(f.n_before - f.n_after, t.n_after - t.n_before) AS moved
FROM x f JOIN x t ON t.rev_id = f.rev_id
WHERE f.n_after < f.n_before AND t.n_after > t.n_before;

-- the swaps with who, when and why, and whether somebody undid them
SELECT s.page_id, r.title, s.rev_id, e.saved_at, e.user, e.editor, e.comment, e.delta,
       s.name_from, s.name_to, s.from_before, s.from_after, s.to_before, s.to_after, s.moved,
       e.restores IS NOT NULL AS is_revert,
       e.undone_by IS NOT NULL AS was_undone,
       TIMESTAMPDIFF(SECOND, e.saved_at, u.saved_at) AS undone_after_seconds,
       u.user AS undone_by_user
FROM lab_history_of_history.swap s
JOIN wtt.edit e ON e.rev_id = s.rev_id
JOIN wtt.revision r ON r.page_id = s.page_id
LEFT JOIN wtt.edit u ON u.page_id = e.page_id AND u.seq = e.undone_by
ORDER BY s.moved DESC, e.saved_at;

-- the edit war in one table: direction, how many, by whom, how many were undone and how fast
SELECT s.name_from, s.name_to, COUNT(*) AS swaps, COUNT(DISTINCT s.page_id) AS articles, SUM(s.moved) AS mentions_moved,
       SUM(e.editor <> 'named') AS by_anonymous,
       SUM(e.restores IS NOT NULL) AS are_reverts,
       SUM(e.restores IS NULL) AS fresh,
       SUM(e.restores IS NULL AND e.undone_by IS NOT NULL) AS fresh_undone,
       ROUND(AVG(CASE WHEN e.restores IS NULL AND e.undone_by IS NOT NULL
                      THEN TIMESTAMPDIFF(SECOND, e.saved_at, u.saved_at) END) / 3600, 1) AS mean_hours_to_undo
FROM lab_history_of_history.swap s
JOIN wtt.edit e ON e.rev_id = s.rev_id
LEFT JOIN wtt.edit u ON u.page_id = e.page_id AND u.seq = e.undone_by
GROUP BY s.name_from, s.name_to ORDER BY swaps DESC;

-- where the fight is: articles with the most swaps
SELECT s.page_id, r.title, COUNT(*) AS swaps,
       SUM(e.restores IS NULL) AS fresh,
       SUM(e.restores IS NULL AND e.undone_by IS NOT NULL) AS fresh_undone,
       SUM(e.restores IS NOT NULL) AS are_reverts,
       MIN(e.saved_at) AS first_swap, MAX(e.saved_at) AS last_swap
FROM lab_history_of_history.swap s
JOIN wtt.edit e ON e.rev_id = s.rev_id
JOIN wtt.revision r ON r.page_id = s.page_id
GROUP BY s.page_id, r.title ORDER BY swaps DESC LIMIT 20;
