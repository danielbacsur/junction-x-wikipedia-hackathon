-- (a) Both timelines in one statement: who was president on 1 May 1960 (valid time),
--     according to Wikipedia as it stood at the end of 2006 (system time)?
SELECT person, valid_from, valid_to, rev_id, row_start AS said_since
FROM office_term FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59'
WHERE office = 'Suomen tasavallan presidentti'
  AND valid_from <= DATE '1960-05-01' AND valid_to > DATE '1960-05-01';
