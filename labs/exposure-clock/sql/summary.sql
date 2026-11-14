SELECT (SELECT COUNT(*) FROM wtt.edit) edits,(SELECT COUNT(DISTINCT page_id) FROM wtt.edit) pages,
(SELECT MIN(saved_at) FROM wtt.edit) first_edit,(SELECT MAX(saved_at) FROM wtt.edit) last_edit,
(SELECT MIN(saved_at) FROM wtt.edit WHERE editor='temp') first_temp,
(SELECT SUM(restores IS NOT NULL) FROM wtt.edit) revert_events,
COUNT(*) undone_versions,SUM(self_revert) self_reverts,SUM(exposure_seconds<0) negative_durations,
SUM(exposure_seconds>31536000) over_one_year,
SUM(exposure_seconds)/3600 version_hours,SUM(live_seconds)/3600 exact_version_hours,
MAX(exposure_seconds)/86400 longest_days FROM lab_exposure_clock.fact;
