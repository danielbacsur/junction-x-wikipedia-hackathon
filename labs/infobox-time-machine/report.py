# /// script
# dependencies = []
# ///
"""Print the measurements cited in README. Does not rerun expensive steps."""
import json
from pathlib import Path
b=Path(__file__).resolve().parent/'data'
def data(n):return json.loads((b/n).read_text())['rows']
for n in ('coverage.json','all-version-coverage.json','load.json','shape.json','validation.json'):
 if (b/n).exists():
  rows=data(n)
  if n=='shape.json':rows=[{k:v for k,v in rows[0].items() if k!='templates'}]
  print(n,json.dumps(rows,ensure_ascii=False,indent=2))
r=data('change-rates.json');common=[x for x in r if x['observations']>=1000 and x['field_slots']>=50]
print('MOST DIRECT REPLACEMENTS',json.dumps(sorted(common,key=lambda x:-x['direct_replacements'])[:10],ensure_ascii=False,indent=2))
print('HIGHEST REPLACEMENT RATE',json.dumps(sorted(common,key=lambda x:-x['changes_per_1000_observations'])[:5],ensure_ascii=False,indent=2))
print('LOWEST REPLACEMENT RATE',json.dumps(sorted(common,key=lambda x:x['changes_per_1000_observations'])[:5],ensure_ascii=False,indent=2))
for n in ('query-timings.json','index-experiment.json','manual-audit.json'):
 if (b/n).exists():print(n,json.dumps(data(n),ensure_ascii=False,indent=2))
