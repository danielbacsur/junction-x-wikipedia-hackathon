# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
from build import *
p.configure();d=duckdb.connect(config={'threads':1,'memory_limit':'512MB'});counts=collections.Counter();examples={};versions=0;recognized=0
for f in sorted((ROOT/'data/m').glob('*.parquet')):
    q=d.execute(f"SELECT page_id,rev_id,text FROM '{f}'")
    while batch:=q.fetchmany(64):
        for page,rev,text in batch:
            versions+=1;found=False
            for name,raw,broken in p.boxes(text or '',True):
                if name in p.ALLOW or (name.startswith(('tietolaatikko','infobox')) and '/' not in name):found=True
                elif raw.count('=')>=4:
                    counts[name]+=1
                    if name not in examples:examples[name]=dict(page_id=page,rev_id=rev,raw=raw[:1000])
            recognized+=found
    print(f.name,flush=True)
dump('recognition.json','Unrecognized top-level templates with at least four equals signs','template occurrences',[dict(template=n,occurrences=c,example=examples[n]) for n,c in counts.most_common(100)],'uv run recognition.py; includes non-infobox templates, a candidate list not measured false negatives')
dump('all-version-coverage.json','Recognized infobox presence before revert filtering','versions',[dict(versions=versions,with_recognized_infobox=recognized)],'uv run recognition.py')
