SELECT MAX(seq-restores-1) max_restore_span,SUM(seq-restores-1>5000) spans_beyond_ingest_cap,
 SUM(restores IS NOT NULL AND sha1 IS NULL) null_sha_reverts,SUM(restores IS NOT NULL AND bytes=0) empty_text_reverts,
 SUM(sha1 IS NULL) missing_hash_edits FROM wtt.edit;
