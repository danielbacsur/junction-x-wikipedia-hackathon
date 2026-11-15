-- Time travel on the Finnish side: every prose paragraph one article ever had,
-- with the stretch of time it stood (row_start, row_end) and the edit that began the stretch.
-- FOR SYSTEM_TIME ALL reads the history rows of the system-versioned passage table.
-- Parameter: page_id. Only the opening of each paragraph is needed to read a lifespan.
-- The wikitext is read as well: the clean text drops date templates such as
-- {{Syntymä- ja kuolinaika|2|1|1893|Vaasa|26|3|1918|Messukylä}}, which leaves "()" behind.
SELECT HEX(p.ord) AS ord, p.born_rev, p.row_start, p.row_end, t.chars, LEFT(t.text, 420) AS head, LEFT(t.wikitext, 900) AS wikihead,
       e.user, e.editor, e.reverted_by
FROM wtt.passage FOR SYSTEM_TIME ALL AS p
JOIN wtt.passage_text AS t ON t.hash = p.hash
LEFT JOIN wtt.edit AS e ON e.rev_id = p.born_rev
WHERE p.page_id = %s AND t.kind = 'prose'
