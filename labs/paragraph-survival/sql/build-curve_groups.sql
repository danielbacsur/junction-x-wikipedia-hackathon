CREATE TABLE curve_groups AS SELECT endpoint,dimension,grp,MAX(duration) max_duration,SUM(exits) n FROM km GROUP BY endpoint,dimension,grp;
