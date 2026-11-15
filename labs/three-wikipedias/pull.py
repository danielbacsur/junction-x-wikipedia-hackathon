# /// script
# dependencies = ["pymysql"]
# ///
"""Pull the opening of every history-of-Finland article whose topic exists in
two or three languages. One connection, read in chunks of 500 rows, cached in
cache/leads.json.gz so nothing else has to ask the database for article text."""
import gzip, json, pathlib
import pymysql

ROOT = pathlib.Path(__file__).resolve().parent
SQL = (ROOT / 'sql' / 'leads.sql').read_text()

def main():
    conn = pymysql.connect(host='127.0.0.1', port=3310, user='wtt', password='wtt',
                           database='wtt', charset='utf8mb4', autocommit=True)
    rows = []
    with conn.cursor() as q:
        for lang in ('fi', 'sv', 'en'):
            after = 0
            while True:
                q.execute(SQL, (lang, after))
                chunk = q.fetchall()
                if not chunk:
                    break
                for lang_, page_id, rev_id, qid, title, url, modified, chars, head in chunk:
                    rows.append(dict(lang=lang_, page_id=page_id, rev_id=rev_id, qid=qid, title=title, url=url,
                                     modified=modified.isoformat(sep=' ') if modified else None, chars=chars, head=head))
                after = chunk[-1][1]
                print(lang, after, len(rows), flush=True)
    conn.close()
    with gzip.open(ROOT / 'cache' / 'leads.json.gz', 'wt', encoding='utf8') as f:
        json.dump(rows, f, ensure_ascii=False)
    print('rows', len(rows))

if __name__ == '__main__':
    main()
