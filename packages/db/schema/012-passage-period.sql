-- Both ends of a row's period, next to its article. MariaDB appends row_end
-- to the primary key of a versioned table, so the rows of an article lie
-- together whatever their time, and reading it as of a date walked every
-- row it ever had: 6,463 rows for the 172 blocks of Talvisota at the end of
-- 2006. With this key the whole AS OF condition is checked inside the index
-- and only the rows that stood are fetched. The optimizer does not choose it
-- for early dates, so the statements that read one article name it.
-- Measured in labs/history-at-scale.
ALTER TABLE passage ADD KEY IF NOT EXISTS stood (page_id, row_end, row_start);
