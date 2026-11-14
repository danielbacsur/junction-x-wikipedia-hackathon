CREATE TABLE end_edit AS SELECT e.* FROM wtt.edit e JOIN (SELECT page_id,saved_at,MAX(seq) seq FROM wtt.edit GROUP BY page_id,saved_at) z ON z.page_id=e.page_id AND z.seq=e.seq;
