-- (e, continued) The carve-out is itself system-versioned: the undivided row is still there as history.
SELECT holder, status, valid_from, valid_to, row_end < NOW(6) AS superseded
FROM president_timeline FOR SYSTEM_TIME ALL
WHERE holder = 'Urho Kekkonen'
ORDER BY superseded DESC, valid_from;
