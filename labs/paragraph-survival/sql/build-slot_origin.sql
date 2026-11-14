CREATE TABLE slot_origin AS SELECT * FROM (SELECT r.*,ROW_NUMBER() OVER(PARTITION BY page_id,slot ORDER BY a,born_rev,hash,dup) rn FROM raw r WHERE slot>0) z WHERE rn=1;
