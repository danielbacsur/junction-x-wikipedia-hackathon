-- Full dates that disagree: which part differs. "Same day number, other month" is 17 January against 17 June.
SELECT CASE WHEN a.y = b.y AND a.d = b.d THEN 'same day number and year, other month'
            WHEN a.y = b.y AND a.m = b.m THEN 'same month and year, other day'
            WHEN a.m = b.m AND a.d = b.d THEN 'same day and month, other year'
            ELSE 'more than one part differs' END AS shape,
       COUNT(*) AS pairs,
       SUM(ABS(a.day_number - b.day_number) = CASE WHEN a.y < 1700 THEN 10 WHEN a.y < 1800 THEN 11 WHEN a.y < 1900 THEN 12 ELSE 13 END) AS julian_gap_exactly
FROM lab_three_wikipedias.lead_fact AS a
JOIN lab_three_wikipedias.lead_fact AS b ON b.qid = a.qid AND b.field = a.field AND a.lang < b.lang
WHERE a.d IS NOT NULL AND b.d IS NOT NULL AND a.day_number <> b.day_number
GROUP BY shape
ORDER BY pairs DESC
