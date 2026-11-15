# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
from build import *
c=connect();q=c.cursor();q.execute("SELECT page_id,title FROM revision WHERE title IN ('Urho Kekkonen','Carl Gustaf Emil Mannerheim','Tarja Halonen') OR page_id=1158");print(q.fetchall());c.close()
