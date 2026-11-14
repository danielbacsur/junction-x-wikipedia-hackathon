DROP TABLE IF EXISTS lab_exposure_clock.local_fact;
 CREATE TABLE lab_exposure_clock.local_fact AS SELECT f.*,TIMESTAMPADD(SECOND,z.offset_seconds,f.saved_at) local_at
 FROM lab_exposure_clock.fact f JOIN lab_exposure_clock.timezone_period z ON f.saved_at>=z.start_at AND f.saved_at<z.end_at;
