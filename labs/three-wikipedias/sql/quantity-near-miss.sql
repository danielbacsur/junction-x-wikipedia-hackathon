-- Wider still: numbers of 100 or more in the opening paragraph that are not dates or years.
-- A near miss: two languages give different numbers within 10 % of each other,
-- and neither number appears in the other language at all.
SELECT a.qid, a.lang AS lang_a, b.lang AS lang_b, a.shown AS shown_a, b.shown AS shown_b,
       ROUND(ABS(a.value - b.value) / LEAST(a.value, b.value) * 100, 2) AS percent_apart, t.fi_title
FROM lab_three_wikipedias.lead_quantity AS a
JOIN lab_three_wikipedias.lead_quantity AS b
  ON b.qid = a.qid AND a.lang < b.lang
 AND a.value <> b.value AND ABS(a.value - b.value) <= 0.10 * LEAST(a.value, b.value)
JOIN lab_three_wikipedias.topic AS t ON t.qid = a.qid
WHERE NOT EXISTS (SELECT 1 FROM lab_three_wikipedias.lead_quantity AS x
                  WHERE x.qid = a.qid AND x.lang = b.lang AND x.value = a.value)
  AND NOT EXISTS (SELECT 1 FROM lab_three_wikipedias.lead_quantity AS x
                  WHERE x.qid = a.qid AND x.lang = a.lang AND x.value = b.value)
ORDER BY a.qid, a.lang, b.lang, a.value, b.value
