SELECT COUNT(*) edges,SUM(near_removal<>(ABS(TIMESTAMPDIFF(SECOND,src_end,at))<=3600)) ambiguous_removal FROM edges;
