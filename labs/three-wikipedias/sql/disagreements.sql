-- Every lifespan disagreement, with both pages. One row per topic, field and pair of languages.
SELECT p.qid, p.field, p.lang_a, p.lang_b, p.shown_a, p.shown_b, p.grain, p.gap, p.size,
       p.approx, p.old_style, p.calendar_shaped,
       t.fi_page_id, t.fi_title, t.sv_title, t.en_title, t.langs
FROM lab_three_wikipedias.fact_pair AS p
JOIN lab_three_wikipedias.topic AS t ON t.qid = p.qid
WHERE p.gap > 0
ORDER BY p.qid, p.field, p.lang_a, p.lang_b
