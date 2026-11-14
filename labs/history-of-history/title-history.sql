-- Part 1c: the title history of the main article about the war (page_id 1150).
-- 1. every title the page has carried in its 3,357 versions
SELECT title, COUNT(*) AS versions, MIN(row_start) AS first_seen, MAX(row_start) AS last_seen
FROM wtt.revision FOR SYSTEM_TIME ALL WHERE page_id = 1150 GROUP BY title;

-- 2. how many of the 19,742 articles carry more than one title anywhere in their history
SELECT COUNT(*) AS articles_with_more_than_one_title
FROM (SELECT page_id FROM wtt.revision FOR SYSTEM_TIME ALL GROUP BY page_id HAVING COUNT(DISTINCT title) > 1) x;

-- 3. page moves leave an edit summary, so the edit table still remembers renames
SELECT e.page_id, r.title AS title_today, e.rev_id, e.saved_at, e.user, e.comment
FROM wtt.edit e JOIN wtt.revision r ON r.page_id = e.page_id
WHERE e.comment LIKE 'siirsi sivun%'
  AND e.comment REGEXP 'sisällisso[dt]|vapausso[dt]|kansalaisso[dt]|luokkaso[dt]|punakapin'
ORDER BY e.saved_at;

-- 4. when each name first entered the main article
SELECT 'sisällissota' AS name, MIN(e.saved_at) AS first_version_with_it
FROM lab_history_of_history.name_count c JOIN wtt.edit e ON e.rev_id = c.rev_id WHERE c.page_id = 1150 AND c.sisallis > 0
UNION ALL SELECT 'vapaussota', MIN(e.saved_at)
FROM lab_history_of_history.name_count c JOIN wtt.edit e ON e.rev_id = c.rev_id WHERE c.page_id = 1150 AND c.vapaus > 0
UNION ALL SELECT 'kansalaissota', MIN(e.saved_at)
FROM lab_history_of_history.name_count c JOIN wtt.edit e ON e.rev_id = c.rev_id WHERE c.page_id = 1150 AND c.kansalais > 0
UNION ALL SELECT 'luokkasota', MIN(e.saved_at)
FROM lab_history_of_history.name_count c JOIN wtt.edit e ON e.rev_id = c.rev_id WHERE c.page_id = 1150 AND c.luokka > 0
UNION ALL SELECT 'punakapina', MIN(e.saved_at)
FROM lab_history_of_history.name_count c JOIN wtt.edit e ON e.rev_id = c.rev_id WHERE c.page_id = 1150 AND c.punakapina > 0
UNION ALL SELECT 'veljessota', MIN(e.saved_at)
FROM lab_history_of_history.name_count c JOIN wtt.edit e ON e.rev_id = c.rev_id WHERE c.page_id = 1150 AND c.veljes > 0;
