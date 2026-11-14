CREATE TABLE events AS SELECT src,dst,at,dst_rev,COUNT(*) paragraphs,SUM(near_removal) moved,SUM(NOT near_removal AND overlaps) retained FROM edges GROUP BY src,dst,at,dst_rev HAVING COUNT(*)>=5;
