-- (a, continued) A day with no president: 2 August 1944, asked of Wikipedia at the end of each year.
-- FOR SYSTEM_TIME AS OF takes one moment; to ask many moments at once, join on row_start / row_end.
SELECT y.seq AS wikipedia_at_end_of, COALESCE(GROUP_CONCAT(o.person), '(nobody)') AS president_on_1944_08_02
FROM seq_2006_to_2026 y
LEFT JOIN office_term FOR SYSTEM_TIME ALL o
       ON o.row_start <= TIMESTAMP(CONCAT(y.seq, '-12-31 23:59:59'))
      AND o.row_end   >  TIMESTAMP(CONCAT(y.seq, '-12-31 23:59:59'))
      AND o.office = 'Suomen tasavallan presidentti'
      AND o.valid_from <= DATE '1944-08-02' AND o.valid_to > DATE '1944-08-02'
GROUP BY y.seq ORDER BY y.seq;
