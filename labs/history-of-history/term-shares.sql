-- Part 3: how many articles mention each word, as they stood on one date.
-- REGEXP is case-insensitive under the table's collation. Each pattern is a stem,
-- so inflected forms count (Neuvostoliiton, Venäjällä, talvisodassa ...).
SELECT COUNT(*)                              AS articles_total,
       SUM(text REGEXP 'neuvostoliit')       AS neuvostoliitto,   -- Soviet Union
       SUM(text REGEXP 'venäjä')             AS venaja,           -- Russia
       SUM(text REGEXP 'ruotsi')             AS ruotsi,           -- Sweden
       SUM(text REGEXP 'saksa')              AS saksa,            -- Germany, German
       SUM(text REGEXP '[^a-zåäö]nato')      AS nato,             -- Nato, Naton, Natoon
       SUM(text REGEXP 'suomettu')           AS suomettuminen,    -- Finlandization
       SUM(text REGEXP 'talviso[dt]')        AS talvisota,        -- Winter War
       SUM(text REGEXP 'jatkoso[dt]')        AS jatkosota,        -- Continuation War
       SUM(text REGEXP 'saamelai')           AS saamelainen,      -- Sámi, the name they use
       SUM(text REGEXP 'lappalai')           AS lappalainen       -- Lapp, the old outsiders' name
FROM wtt.revision FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59';
