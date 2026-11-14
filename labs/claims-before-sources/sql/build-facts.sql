CREATE TABLE facts AS SELECT n.*,o.written,o.referenced,TIMESTAMPDIFF(SECOND,o.written,o.referenced)/86400 wait_days FROM current n LEFT JOIN origins o ON o.page_id=n.page_id AND o.slot=n.slot;
