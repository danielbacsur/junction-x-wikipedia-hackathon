CREATE TABLE page_birth AS SELECT page_id,MIN(saved_at) born_at,MIN(seq) first_seq FROM wtt.edit GROUP BY page_id;
