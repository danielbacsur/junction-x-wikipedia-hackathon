# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
from build import *
cases=json.loads((BASE/'data/changed-dates.json').read_text())['rows'][:16]
wanted={};rows={}
for case in cases:
    change=max(case['transitions'],key=lambda x:x['absolute_days'])
    timeline=case['timeline'];i=next(i for i,r in enumerate(timeline) if r['rev_id']==change['rev_id'])
    for r in timeline[max(0,i-1):i+2]:wanted[r['rev_id']]=case['page_id']
d=duckdb.connect(config={'threads':1,'memory_limit':'512MB'})
for file in sorted((ROOT/'data/m').glob('*.parquet')):
    q=d.execute(f'SELECT page_id,title,rev_id,"user",comment,text FROM \'{file}\'')
    while batch:=q.fetchmany(32):
      for page,title,rev,user,comment,txt in batch:
        if rev not in wanted:continue
        # Full local text is retained for review; excerpts emphasize lead and date discussion.
        rows[rev]=dict(page_id=page,title=title,rev_id=rev,editor=user,comment=comment,text=txt)
(BASE/'cache/audit-source.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
lines=[]
for case in cases:
    change=max(case['transitions'],key=lambda x:x['absolute_days']);timeline=case['timeline'];i=next(i for i,r in enumerate(timeline) if r['rev_id']==change['rev_id'])
    lines.append('\n### '+case['title']+' / '+case['field']+' / '+str(case['page_id'])+'\n'+json.dumps(change,ensure_ascii=False))
    for r in timeline[max(0,i-1):i+2]:
        src=rows.get(r['rev_id'],{});txt=src.get('text','');lead=txt.find("'''")
        excerpts=[line for line in txt.splitlines() if re.search(r'synty|kuoli|kuole|kalenter|juliaani|gregoria',line,re.I)]
        lines.append(json.dumps({**r,'lead':txt[lead:lead+1800] if lead>=0 else txt[:1800],'date_lines':excerpts[:25]},ensure_ascii=False))
(BASE/'cache/audit-reading.txt').write_text('\n'.join(lines));print('\n'.join(lines))
