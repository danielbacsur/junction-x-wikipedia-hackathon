SELECT g.endpoint,g.dimension,g.grp,a.age_seconds,
IF(a.age_seconds>g.max_duration,NULL,COALESCE((SELECT k.survival FROM km k WHERE k.endpoint=g.endpoint AND k.dimension=g.dimension AND k.grp=g.grp AND k.duration<=a.age_seconds ORDER BY k.duration DESC LIMIT 1),1)) survival,
COALESCE((SELECT k.at_risk FROM km k WHERE k.endpoint=g.endpoint AND k.dimension=g.dimension AND k.grp=g.grp AND k.duration>=a.age_seconds ORDER BY k.duration LIMIT 1),0) at_risk,g.n
FROM curve_groups g CROSS JOIN ages a ORDER BY g.endpoint,g.dimension,g.grp,a.age_seconds;
