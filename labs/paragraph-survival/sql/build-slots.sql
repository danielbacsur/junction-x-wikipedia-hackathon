CREATE TABLE slots AS SELECT page_id,slot,MIN(a) a,MAX(b) b FROM raw WHERE slot>0 GROUP BY page_id,slot;
