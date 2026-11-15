# /// script
# dependencies = ["pymysql"]
# ///
import json,datetime as D
from run import parse,union,ROOT
assert parse('kuoli 26 662 ihmistä')[1]==parse('kuoli 26\u00a0662 ihmistä')[1]
assert parse('2,5 prosenttia')[1]==('2.5',)
assert parse('13.3.1940')[1]==parse('13. maaliskuuta 1940')[1]==('1940-03-13',)
assert parse('13.03.1940')[1]==('1940-03-13',)
assert parse('vuonna 1940')[2]==('year',)
assert parse('asuu 1384 ihmistä')[2]==('quantity',)
assert parse('asuu 1 384 ihmistä')[2]==('quantity',)
assert parse('26 600 ihmistä')[0]==parse('26 662 ihmistä')[0]
a=D.datetime(2000,1,1)
u=union([dict(a=a,b=a+D.timedelta(days=2),rev=1),dict(a=a+D.timedelta(days=1),b=a+D.timedelta(days=3),rev=2),dict(a=a+D.timedelta(days=3),b=a+D.timedelta(days=4),rev=3)])
assert len(u)==1 and (u[0]['b']-u[0]['a']).days==4
s={r['metric']:r['value'] for r in json.loads((ROOT/'data/summary.json').read_text())['rows']}
assert s['pages_scanned']==19742
assert len(list((ROOT/'cache').glob('*.json.gz')))==198
for pop,key in [('all','all_substitutions'),('clean','both_endpoints_not_reverted')]:
 assert sum(s.get(f'{pop}_{k}',0) for k in ['date','year','quantity','mixed'])==s[key]
 ed=[r for r in json.loads((ROOT/'data/editors.json').read_text())['rows'] if r['population']==pop]
 assert sum(r['n'] for r in ed)==s[key]
 for r in ed:assert r['uninterrupted_new_stay_at_cutoff']<=r['value_standing']<=r['n']
print('Parser, interval union, count partitions and censoring checks passed.')
