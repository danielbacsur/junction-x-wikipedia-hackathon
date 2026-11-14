-- (3) What the product's agent calls: office_holder(office, day, as_of) -> JSON array.
--     Empty array: Wikipedia named nobody for that day. Two elements: its articles disagreed.
--     Acting holders, stored as "<office> (vt.)", are returned too and marked.
CREATE OR REPLACE FUNCTION office_holder(p_office VARCHAR(64), p_day DATE, p_as_of DATETIME(6))
RETURNS LONGTEXT CHARSET utf8mb4
READS SQL DATA
RETURN (
  SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
           'holder', person,
           'office', office,
           'acting', office LIKE '% (vt.)',
           'stated_from', valid_from,
           'stated_to', IF(open_ended, NULL, valid_to),
           'rev_id', rev_id,
           'said_since', row_start,
           'said_until', IF(row_end > NOW(6), NULL, row_end),
           'source_text', source_text) ORDER BY office, valid_from), JSON_ARRAY())
  FROM office_term FOR SYSTEM_TIME AS OF p_as_of
  WHERE office IN (p_office, CONCAT(p_office, ' (vt.)'))
    AND valid_from <= p_day AND valid_to > p_day);
