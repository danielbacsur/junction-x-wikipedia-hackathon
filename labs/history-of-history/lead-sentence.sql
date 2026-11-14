-- Part 1c: the sentence in which the main article (page_id 1150) introduces the war
-- and lists its names, as it stood at each date. page_id is the primary key prefix,
-- so each AS OF lookup reads one article's versions, not the whole table.
SELECT '2003-12-31' AS as_of, rev_id, REGEXP_SUBSTR(text, "'''[^']*(?:sota|kapina)'''[^\n]{0,420}") AS lead_text
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2003-12-31 23:59:59' WHERE page_id = 1150
UNION ALL SELECT '2004-12-31', rev_id, REGEXP_SUBSTR(text, "'''[^']*(?:sota|kapina)'''[^\n]{0,420}")
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2004-12-31 23:59:59' WHERE page_id = 1150
UNION ALL SELECT '2005-12-31', rev_id, REGEXP_SUBSTR(text, "'''[^']*(?:sota|kapina)'''[^\n]{0,420}")
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2005-12-31 23:59:59' WHERE page_id = 1150
UNION ALL SELECT '2007-12-31', rev_id, REGEXP_SUBSTR(text, "'''[^']*(?:sota|kapina)'''[^\n]{0,420}")
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2007-12-31 23:59:59' WHERE page_id = 1150
UNION ALL SELECT '2010-12-31', rev_id, REGEXP_SUBSTR(text, "'''[^']*(?:sota|kapina)'''[^\n]{0,420}")
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59' WHERE page_id = 1150
UNION ALL SELECT '2017-12-31', rev_id, REGEXP_SUBSTR(text, "'''[^']*(?:sota|kapina)'''[^\n]{0,420}")
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2017-12-31 23:59:59' WHERE page_id = 1150
UNION ALL SELECT '2026-10-01', rev_id, REGEXP_SUBSTR(text, "'''[^']*(?:sota|kapina)'''[^\n]{0,420}")
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2026-10-01 23:59:59' WHERE page_id = 1150;
