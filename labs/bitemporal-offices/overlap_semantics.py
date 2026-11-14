# /// script
# dependencies = ["pymysql"]
# ///
"""What does WITHOUT OVERLAPS check on a system-versioned table? Five inserts into a scratch table tell.

    uv run overlap_semantics.py
"""
import pymysql
c = pymysql.connect(host="127.0.0.1", port=3310, user="root", password="wtt", database="lab_bitemporal_offices", autocommit=True)
cur = c.cursor()
cur.execute("SET time_zone = '+00:00'")
cur.execute("DROP TABLE IF EXISTS overlap_probe")
cur.execute("""CREATE TABLE overlap_probe (
  office VARCHAR(20) NOT NULL, person VARCHAR(20) NOT NULL, valid_from DATE NOT NULL, valid_to DATE NOT NULL,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START, row_end TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
  PERIOD FOR SYSTEM_TIME (row_start, row_end), PERIOD FOR valid_time (valid_from, valid_to),
  PRIMARY KEY (office, valid_time WITHOUT OVERLAPS)) WITH SYSTEM VERSIONING""")
cur.execute("SET system_versioning_insert_history = 1")
steps = [
 ("A  history row: said 2006..2010, valid 1956..1982",
  "INSERT INTO overlap_probe (office, person, valid_from, valid_to, row_start, row_end) VALUES ('p','Kekkonen','1956-03-01','1982-01-27','2006-01-01','2010-01-01')"),
 ("B  history row said 2008..2012 (system time overlaps A), valid 1981..1994 (valid time overlaps A)",
  "INSERT INTO overlap_probe (office, person, valid_from, valid_to, row_start, row_end) VALUES ('p','Koivisto','1981-10-27','1994-03-01','2008-01-01','2012-01-01')"),
 ("C  current row: said since 2012, valid 1956..1982",
  "INSERT INTO overlap_probe (office, person, valid_from, valid_to, row_start) VALUES ('p','Kekkonen','1956-03-01','1982-01-27','2012-01-01')"),
 ("D  current row overlapping C in valid time: valid 1981..1994",
  "INSERT INTO overlap_probe (office, person, valid_from, valid_to, row_start) VALUES ('p','Koivisto','1981-10-27','1994-03-01','2012-01-01')"),
 ("E  current row touching C (starts on C's end day): valid 1982-01-27..1994",
  "INSERT INTO overlap_probe (office, person, valid_from, valid_to, row_start) VALUES ('p','Koivisto','1982-01-27','1994-03-01','2012-01-01')"),
 ("F  history row identical to A in every column but said 2010..2011",
  "INSERT INTO overlap_probe (office, person, valid_from, valid_to, row_start, row_end) VALUES ('p','Kekkonen','1956-03-01','1982-01-27','2010-01-01','2011-01-01')"),
]
for label, sql in steps:
    try:
        cur.execute(sql); print("accepted ", label)
    except pymysql.err.MySQLError as e:
        print("REFUSED  ", label, "->", e.args)
cur.execute("SELECT COUNT(*), SUM(row_end > NOW()) FROM overlap_probe FOR SYSTEM_TIME ALL")
print("rows in table (all system time, current):", cur.fetchone())
cur.execute("SHOW CREATE TABLE overlap_probe"); print(cur.fetchone()[1])
cur.execute("DROP TABLE overlap_probe")
