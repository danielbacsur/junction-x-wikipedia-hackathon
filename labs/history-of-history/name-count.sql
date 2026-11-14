-- Part 1b, step 1: count every name in every one of the 862,076 versions.
-- One pass over the whole history (FOR SYSTEM_TIME ALL), kept in the lab's own
-- database so the swap queries never touch wikitext again. Only versions that
-- mention at least one name get a row. Run as root (it creates the database).
CREATE DATABASE IF NOT EXISTS lab_history_of_history;
GRANT ALL ON lab_history_of_history.* TO 'wtt'@'%';

CREATE OR REPLACE TABLE lab_history_of_history.name_count (
  page_id    INT UNSIGNED NOT NULL,
  rev_id     INT UNSIGNED NOT NULL PRIMARY KEY,
  sisallis   SMALLINT UNSIGNED NOT NULL,
  vapaus     SMALLINT UNSIGNED NOT NULL,
  kansalais  SMALLINT UNSIGNED NOT NULL,
  luokka     SMALLINT UNSIGNED NOT NULL,
  veljes     SMALLINT UNSIGNED NOT NULL,
  punakapina SMALLINT UNSIGNED NOT NULL,
  KEY (page_id)
);

INSERT INTO lab_history_of_history.name_count
SELECT page_id, rev_id,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)sisällisso[dt][ai]',  ''))) DIV 12,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)vapausso[dt][ai]',    ''))) DIV 10,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)kansalaisso[dt][ai]', ''))) DIV 13,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)luokkaso[dt][ai]',    ''))) DIV 10,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)veljesso[dt][ai]',    ''))) DIV 10,
       (CHAR_LENGTH(text) - CHAR_LENGTH(REGEXP_REPLACE(text, '(?i)punakapin',           ''))) DIV 9
FROM wtt.revision FOR SYSTEM_TIME ALL
WHERE text REGEXP 'sisällisso[dt]|vapausso[dt]|kansalaisso[dt]|luokkaso[dt]|veljesso[dt]|punakapin';
