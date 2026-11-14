SELECT COUNT(DISTINCT x.hash) shared_wordings_in_bulk_events FROM edges x JOIN events e ON e.src=x.src AND e.dst=x.dst AND e.dst_rev=x.dst_rev;
