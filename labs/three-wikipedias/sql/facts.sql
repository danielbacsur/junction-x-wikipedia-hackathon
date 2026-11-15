-- Every birth and death read from a lead.
SELECT qid, lang, field, y, m, d, approx, old_style, how, shown
FROM lab_three_wikipedias.lead_fact
