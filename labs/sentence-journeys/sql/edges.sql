CREATE TABLE edges AS SELECT d.hash,s.page_id src,d.page_id dst,d.first_at at,d.born_rev dst_rev,MAX(s.e) src_end,
 MAX(s.e>d.first_at) overlaps, (ABS(TIMESTAMPDIFF(SECOND,MAX(s.e),d.first_at))<=3600) near_removal
 FROM ranked d JOIN presence s ON s.hash=d.hash AND s.page_id<>d.page_id AND s.s<d.first_at AND s.e>=d.first_at-INTERVAL 1 HOUR
 GROUP BY d.hash,s.page_id,d.page_id,d.first_at,d.born_rev;
