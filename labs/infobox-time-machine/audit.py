# /// script
# dependencies = []
# ///
"""Validate manual annotations and package them with measured transition evidence."""
import json
from pathlib import Path
B=Path(__file__).resolve().parent
cases=json.loads((B/'data/changed-dates.json').read_text())['rows'][:16]
notes=json.loads((B/'audit_notes.json').read_text());assert len(notes)==16
out=[]
for case,note in zip(cases,notes):
 assert (case['page_id'],case['field'])==(note['page_id'],note['field']), (case['title'],note)
 transition=max(case['transitions'],key=lambda c:c['absolute_days'])
 assert transition['rev_id']==note['rev_id']
 assert note['classification'] in ('correction','vandalism that survived more than thirty days','dispute between sources','calendar or format change','unclear')
 i=next(i for i,r in enumerate(case['timeline']) if r['rev_id']==note['rev_id'])
 inspected=case['timeline'][max(0,i-1):i+2]
 out.append(dict(title=case['title'],**note,transition=transition,inspected_revisions=[r['rev_id'] for r in inspected],evidence=[{k:r[k] for k in ('rev_id','raw_value','row_start','row_end','editor','comment')} for r in inspected],scope='Manual read of infobox, edit summaries, lead excerpts at the listed revisions; no external sources or talk pages'))
(B/'data/manual-audit.json').write_text(json.dumps(dict(title='Manual audit of sixteen extreme date transitions',unit='reviewed cases',source='audit_notes.json; uv run audit_context.py; uv run audit.py',rows=out),ensure_ascii=False,indent=2))
print('Validated',len(out),'manual cases')
