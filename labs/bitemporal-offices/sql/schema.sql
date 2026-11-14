-- lab_bitemporal_offices.office_term as MariaDB reports it after load.py (note row_end inside the key)
CREATE TABLE `office_term` (
  `page_id` int(10) unsigned NOT NULL,
  `person` varchar(255) NOT NULL,
  `office` varchar(64) NOT NULL,
  `valid_from` date NOT NULL,
  `valid_to` date NOT NULL,
  `open_ended` tinyint(1) NOT NULL,
  `rev_id` int(10) unsigned NOT NULL,
  `seq` int(10) unsigned NOT NULL,
  `editor` varchar(255) DEFAULT NULL,
  `editor_kind` varchar(8) NOT NULL,
  `comment` varchar(1000) DEFAULT NULL,
  `versions` int(10) unsigned NOT NULL,
  `source_text` varchar(600) NOT NULL,
  `row_start` timestamp(6) GENERATED ALWAYS AS ROW START,
  `row_end` timestamp(6) GENERATED ALWAYS AS ROW END,
  PERIOD FOR `valid_time` (`valid_from`, `valid_to`),
  PRIMARY KEY (`page_id`,`office`,`row_end`,`valid_time` WITHOUT OVERLAPS),
  KEY `office_valid` (`office`,`valid_from`,`valid_to`),
  PERIOD FOR SYSTEM_TIME (`row_start`, `row_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci WITH SYSTEM VERSIONING;
