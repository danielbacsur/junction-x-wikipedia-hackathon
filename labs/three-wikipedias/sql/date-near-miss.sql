-- Wider net, articles that are not lifespans: full dates in the opening paragraph.
-- A near miss is a date one language gives and the other does not, while the other
-- gives a different date within 31 days that the first does not have.
SELECT a.qid, a.lang AS lang_a, b.lang AS lang_b, a.shown AS shown_a, b.shown AS shown_b,
       ABS(a.day_number - b.day_number) AS gap_days, t.fi_title
FROM lab_three_wikipedias.lead_date AS a
JOIN lab_three_wikipedias.lead_date AS b
  ON b.qid = a.qid AND a.lang < b.lang
 AND a.day_number <> b.day_number AND ABS(a.day_number - b.day_number) <= 31
JOIN lab_three_wikipedias.topic AS t ON t.qid = a.qid
WHERE NOT EXISTS (SELECT 1 FROM lab_three_wikipedias.lead_date AS x
                  WHERE x.qid = a.qid AND x.lang = b.lang AND x.day_number = a.day_number)
  AND NOT EXISTS (SELECT 1 FROM lab_three_wikipedias.lead_date AS x
                  WHERE x.qid = a.qid AND x.lang = a.lang AND x.day_number = b.day_number)
ORDER BY a.qid, a.lang, b.lang, a.day_number, b.day_number
