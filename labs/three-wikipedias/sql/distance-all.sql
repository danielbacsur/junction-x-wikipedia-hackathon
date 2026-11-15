-- Every distance with the titles, for the length-controlled ranking done in report.py.
SELECT d.qid, d.lang_a, d.lang_b, d.distance, d.chars_a, d.chars_b, d.truncated,
       t.kind, t.fi_title, t.sv_title, t.en_title
FROM lab_three_wikipedias.topic_distance AS d
JOIN lab_three_wikipedias.topic AS t ON t.qid = d.qid
