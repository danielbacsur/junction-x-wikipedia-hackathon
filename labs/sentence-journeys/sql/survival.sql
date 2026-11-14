WITH x AS (SELECT p.*,s.e source_end,d.e destination_end FROM pairs p JOIN presence s ON s.hash=p.hash AND s.page_id=p.src AND s.s<=p.dst_at AND s.e>p.dst_at JOIN presence d ON d.hash=p.hash AND d.page_id=p.dst AND d.s=p.dst_at WHERE p.delay_seconds>0)
 SELECT COUNT(*) overlapping_first_second,SUM(source_end>='2100-01-01' AND destination_end>='2100-01-01') both_censored,SUM(source_end<destination_end) destination_outlives,SUM(destination_end<source_end) source_outlives,SUM(source_end=destination_end AND source_end<'2100-01-01') same_end,
 SUM(source_end<'2100-01-01' AND destination_end<'2100-01-01') both_ended,
 SUM(dst_at<=(SELECT MAX(saved_at) FROM wtt.edit)-INTERVAL 365 DAY) eligible_year,
 SUM(dst_at<=(SELECT MAX(saved_at) FROM wtt.edit)-INTERVAL 365 DAY AND source_end>=dst_at+INTERVAL 365 DAY) source_survives_year,
 SUM(dst_at<=(SELECT MAX(saved_at) FROM wtt.edit)-INTERVAL 365 DAY AND destination_end>=dst_at+INTERVAL 365 DAY) destination_survives_year FROM x;
