# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
from build import *
c=connect('lab_infobox_time_machine');q=c.cursor();q.execute((BASE/'sql/schema.sql').read_text().replace('CREATE TABLE statement','CREATE TABLE IF NOT EXISTS statement'));q.execute('SHOW CREATE TABLE statement');print(q.fetchone()[1]);c.close()
