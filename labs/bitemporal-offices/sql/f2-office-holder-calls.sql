SELECT office_holder('Suomen tasavallan presidentti', DATE '1960-05-01', TIMESTAMP '2006-12-31 23:59:59') AS answer
UNION ALL SELECT office_holder('Suomen tasavallan presidentti', DATE '1981-12-01', NOW(6))
UNION ALL SELECT office_holder('Suomen tasavallan presidentti', DATE '1944-08-02', NOW(6))
UNION ALL SELECT office_holder('Suomen pääministeri', DATE '1952-06-01', TIMESTAMP '2016-06-01 00:00:00');
