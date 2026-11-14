-- (e) Application-time features doing real work: one clean "who held the office" line, derived from the
--     articles' current statements, kept overlap-free by the key and edited with FOR PORTION OF.
CREATE OR REPLACE TABLE president_timeline (
  office     VARCHAR(64)  NOT NULL,
  holder     VARCHAR(255) NOT NULL,
  status     VARCHAR(64)  NOT NULL DEFAULT 'in office',
  valid_from DATE NOT NULL,
  valid_to   DATE NOT NULL,
  rev_id     INT UNSIGNED NOT NULL,
  PERIOD FOR valid_time (valid_from, valid_to),
  PRIMARY KEY (office, valid_time WITHOUT OVERLAPS)      -- across all articles: one holder per day
) WITH SYSTEM VERSIONING;

INSERT INTO president_timeline (office, holder, valid_from, valid_to, rev_id)
SELECT office, person, valid_from, valid_to, rev_id
FROM office_term WHERE office = 'Suomen tasavallan presidentti';

-- Koivisto's article states an acting presidency inside Kekkonen's stated term. Inserting it is refused:
INSERT INTO president_timeline (office, holder, status, valid_from, valid_to, rev_id)
SELECT 'Suomen tasavallan presidentti', person, 'acting', valid_from, valid_to, rev_id
FROM office_term WHERE office = 'Suomen tasavallan presidentti (vt.)';

-- FOR PORTION OF carves exactly those days out of whoever holds them (MariaDB splits Kekkonen's row in two) ...
SELECT valid_from, valid_to INTO @acting_from, @acting_to
FROM office_term WHERE office = 'Suomen tasavallan presidentti (vt.)';
UPDATE president_timeline FOR PORTION OF valid_time FROM @acting_from TO @acting_to
   SET status = 'in office, on sick leave: Koivisto acting'
 WHERE office = 'Suomen tasavallan presidentti';

-- ... and the timeline now reads:
SELECT holder, status, valid_from, valid_to, rev_id
FROM president_timeline
WHERE valid_to > DATE '1950-01-01' AND valid_from < DATE '1995-01-01'
ORDER BY valid_from;
