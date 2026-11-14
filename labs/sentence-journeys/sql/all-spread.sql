CREATE TABLE all_spread AS SELECT p.hash,COUNT(DISTINCT p.page_id) articles FROM wtt.passage FOR SYSTEM_TIME ALL p GROUP BY p.hash;
