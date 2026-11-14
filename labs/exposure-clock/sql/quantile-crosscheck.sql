SELECT page_id,saved_at,revert_at,YEAR(saved_at) year,exposure_seconds FROM lab_exposure_clock.fact ORDER BY page_id,saved_at,seq;
