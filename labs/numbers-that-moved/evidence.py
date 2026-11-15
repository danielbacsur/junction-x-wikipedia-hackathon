# /// script
# dependencies = []
# ///
import gzip,json,pathlib
R=pathlib.Path(__file__).resolve().parent
with gzip.open(R/'cache/events.ndjson.gz','rt') as f:
 for line in f:
  e=json.loads(line)
  if e['article']=='Talvisota' and e['old']=='26 600' and e['new']=='26662':print(json.dumps(e,ensure_ascii=False,indent=2))
print('Completed range files:',len(list((R/'cache').glob('*.json.gz'))))
for name in ['summary.json','durations.json','editors.json']:
 print(name);print((R/'data'/name).read_text())
