-- (a, continued) The same day asked of four Wikipedias: who was president on 1 March 1925?
SELECT '2006-12-31' AS wikipedia_as_of, person, valid_from, valid_to, rev_id
FROM office_term FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59'
WHERE office = 'Suomen tasavallan presidentti' AND valid_from <= DATE '1925-03-01' AND valid_to > DATE '1925-03-01'
UNION ALL
SELECT '2008-12-31', person, valid_from, valid_to, rev_id
FROM office_term FOR SYSTEM_TIME AS OF TIMESTAMP '2008-12-31 23:59:59'
WHERE office = 'Suomen tasavallan presidentti' AND valid_from <= DATE '1925-03-01' AND valid_to > DATE '1925-03-01'
UNION ALL
SELECT '2012-12-31', person, valid_from, valid_to, rev_id
FROM office_term FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59'
WHERE office = 'Suomen tasavallan presidentti' AND valid_from <= DATE '1925-03-01' AND valid_to > DATE '1925-03-01'
UNION ALL
SELECT 'now', person, valid_from, valid_to, rev_id
FROM office_term
WHERE office = 'Suomen tasavallan presidentti' AND valid_from <= DATE '1925-03-01' AND valid_to > DATE '1925-03-01';
