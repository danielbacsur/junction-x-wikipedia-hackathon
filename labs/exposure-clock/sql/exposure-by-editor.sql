WITH base AS (SELECT *, CASE WHEN reverter_editor IN ('ip','temp') THEN 'anonymous' ELSE reverter_editor END reverter_group FROM lab_exposure_clock.fact WHERE 1=1),
 ranked AS (SELECT *,
 PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY exposure_seconds) OVER(PARTITION BY editor,reverter_group,self_revert,population) p50,
 PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY exposure_seconds) OVER(PARTITION BY editor,reverter_group,self_revert,population) p75,
 PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY exposure_seconds) OVER(PARTITION BY editor,reverter_group,self_revert,population) p90,
 PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY exposure_seconds) OVER(PARTITION BY editor,reverter_group,self_revert,population) p99
 FROM base)
 SELECT editor,reverter_group,self_revert,population,COUNT(*) n,MIN(p50) median_seconds,MIN(p75) p75_seconds,MIN(p90) p90_seconds,MIN(p99) p99_seconds,
 AVG(exposure_seconds<=60) within_minute,AVG(exposure_seconds<=3600) within_hour,
 AVG(exposure_seconds<=86400) within_day,AVG(exposure_seconds<=604800) within_week,
 SUM(exposure_seconds)/3600 version_hours,SUM(live_seconds)/3600 exact_version_hours
 FROM ranked GROUP BY editor,reverter_group,self_revert,population ORDER BY editor,reverter_group,self_revert,population;
