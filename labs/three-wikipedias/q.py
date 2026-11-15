# /// script
# dependencies = ["pymysql"]
# ///
"""Run one of the lab's SQL files and print the rows: uv run labs/three-wikipedias/q.py people-summary"""
import pathlib, sys
import pymysql
ROOT = pathlib.Path(__file__).resolve().parent
def run(name, args=None):
    text = '\n'.join(l for l in (ROOT / 'sql' / f'{name}.sql').read_text().split('\n') if not l.startswith('--'))
    conn = pymysql.connect(host='127.0.0.1', port=3310, user='wtt', password='wtt', charset='utf8mb4', autocommit=True)
    with conn.cursor() as q:
        q.execute(text, args)
        cols = [d[0] for d in q.description]; rows = q.fetchall()
    conn.close()
    return cols, rows
if __name__ == '__main__':
    cols, rows = run(sys.argv[1])
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else len(rows)
    print(' | '.join(cols))
    for r in rows[:limit]:
        print(' | '.join('' if v is None else str(v) for v in r))
    print(f'({len(rows)} rows)')
