CREATE TABLE risk AS SELECT *,SUM(exits) OVER(PARTITION BY endpoint,dimension,grp ORDER BY duration DESC ROWS UNBOUNDED PRECEDING) at_risk FROM event_counts;
