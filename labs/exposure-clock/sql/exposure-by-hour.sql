WITH base AS (SELECT *,HOUR(local_at) local_hour FROM lab_exposure_clock.local_fact WHERE editor IN ('ip','temp') AND self_revert=0 AND population='short_local' AND identity_valid=1),
 p AS (SELECT *,PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY exposure_seconds) OVER(PARTITION BY local_hour) median_seconds,
 PERCENTILE_CONT(0.9) WITHIN GROUP(ORDER BY exposure_seconds) OVER(PARTITION BY local_hour) p90_seconds FROM base)
 SELECT local_hour,COUNT(*) n,MIN(median_seconds) median_seconds,MIN(p90_seconds) p90_seconds,AVG(exposure_seconds<=3600) within_hour
 FROM p GROUP BY local_hour ORDER BY local_hour;
