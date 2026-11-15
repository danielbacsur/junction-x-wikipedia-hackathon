-- The part of the "still living" list that was read in full: deaths from 2000 on.
SELECT d.qid, t.fi_title, d.lang AS says_died, d.shown AS death, b.lang AS birth_only, b.shown AS birth
FROM lab_three_wikipedias.lead_fact AS d
JOIN lab_three_wikipedias.lead_fact AS b ON b.qid = d.qid AND b.field = 'birth' AND b.lang <> d.lang
JOIN lab_three_wikipedias.topic AS t ON t.qid = d.qid
WHERE d.field = 'death' AND b.how LIKE 'marker%' AND d.y >= 2000
  AND NOT EXISTS (SELECT 1 FROM lab_three_wikipedias.lead_fact AS x
                  WHERE x.qid = d.qid AND x.lang = b.lang AND x.field = 'death')
ORDER BY d.y DESC, d.qid
