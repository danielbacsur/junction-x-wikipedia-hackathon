SELECT endpoint,dimension,grp,SUM(exits) n,SUM(deaths) deaths,MIN(IF(survival<=0.5,duration,NULL))/86400 median_days,MAX(duration)/86400 max_followup_days FROM km GROUP BY endpoint,dimension,grp;
