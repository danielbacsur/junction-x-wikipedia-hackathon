# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
import json,time,gzip,collections,datetime,subprocess,re
from pathlib import Path
import duckdb,pymysql
import parser as p
BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[1]
def dump(name,title,unit,rows,source='uv run build.py; Parquet data/m and wtt.edit'):
    if isinstance(rows,dict):rows=[rows]
    (BASE/'data'/name).write_text(json.dumps(dict(title=title,unit=unit,source=source,rows=rows),ensure_ascii=False,indent=2,default=str))
def connect(db='wtt',user='wtt'):
    c=pymysql.connect(host='127.0.0.1',port=3310,user=user,password='wtt',database=db,charset='utf8mb4');c.cursor().execute("SET time_zone='+00:00'");return c
def extract():
    started=time.monotonic();p.configure()
    c=connect();q=c.cursor();q.execute('SELECT page_id,rev_id,saved_at,reverted_by,editor FROM edit')
    meta={r[1]:(r[0],r[2],r[3],r[4]) for r in q};c.close()
    d=duckdb.connect(config={'threads':1,'memory_limit':'512MB','temp_directory':str(BASE/'cache/tmp')})
    totals=collections.Counter();errors=collections.Counter();typed=collections.Counter();pages=set();boxpages=set();seen=set();anomalies=[];samples=collections.defaultdict(list)
    out=gzip.open(BASE/'cache/statements.jsonl.gz','wt');active={};lastpage=None;lasttime=None;sid=0
    def finish(row,end):
        nonlocal sid
        if end is not None and end<=row['row_start']:
            totals['zero_duration_dropped']+=1;return
        sid+=1;row['id']=sid;row['row_end']=end;out.write(json.dumps(row,ensure_ascii=False,default=str)+'\n')
    for f in sorted((ROOT/'data/m').glob('*.parquet')):
        cur=d.execute(f'SELECT page_id,title,rev_id,"user",comment,text FROM \'{f}\'')
        while batch:=cur.fetchmany(64):
            for page,title,rev,user,comment,text in batch:
                totals['versions_read']+=1;pages.add(page)
                if page!=lastpage:
                    for row in active.values():finish(row,None)
                    active={};lasttime=None
                    if page in seen:raise RuntimeError('Page split across noncontiguous blocks')
                    seen.add(page);lastpage=page
                if rev not in meta:totals['missing_core_edit']+=1;continue
                mp,at,reverted,editor=meta[rev]
                if reverted is not None:totals['reverted_versions_skipped']+=1;continue
                if lasttime and at<=lasttime:
                    totals['nonincreasing_accepted_time']+=1;at=lasttime+datetime.timedelta(microseconds=1)
                lasttime=at;totals['accepted_versions']+=1
                state={};instances=collections.Counter();found=False
                for template,raw,broken in p.boxes(text or ''):
                    found=True;instances[template]+=1;slot=instances[template]
                    if broken:
                        errors['unclosed_infobox']+=1
                        if len(samples['unclosed_infobox'])<20:samples['unclosed_infobox'].append(dict(page_id=page,rev_id=rev,template=template,raw=raw[:1000]))
                        continue
                    fs,es=p.fields(raw);errors.update(es);totals['boxes_parsed']+=1
                    for reason in set(es):
                        if len(samples[reason])<20:samples[reason].append(dict(page_id=page,rev_id=rev,template=template,raw=raw[:1000]))
                    for field,rawval,val,unresolved in fs:
                        totals['fields_parsed_including_empty']+=1
                        if not rawval:totals['empty_fields']+=1;continue
                        totals['nonempty_field_observations']+=1
                        if unresolved:totals['unexpanded_template_observations']+=1
                        key=(template,slot,field);state[key]=(rawval,val,unresolved)
                if found:totals['accepted_versions_with_recognized_infobox']+=1;boxpages.add(page)
                for key,row in list(active.items()):
                    # Raw equality preserves source changes and unresolved templates.
                    if key not in state or state[key][0]!=row['raw_value']:
                        finish(row,at);del active[key]
                for key,(rawval,val,unresolved) in state.items():
                    if key in active:active[key]['versions']+=1;continue
                    template,slot,field=key;dt,num,precision=p.typed(field,rawval,val)
                    if precision:typed[precision]+=1
                    active[key]=dict(page_id=page,title=title,template=template,slot=slot,field=field,raw_value=rawval,value=val,unresolved=unresolved,fact_date=dt,fact_number=num,precision=precision,rev_id=rev,editor=user,editor_kind=editor,comment=comment,versions=1,row_start=at)
        print(f.name,totals['versions_read'],sid,round(time.monotonic()-started,1),flush=True)
    for row in active.values():finish(row,None)
    out.close();dump('refusal-samples.json','Parser refusal and duplicate parameter examples','examples',dict(samples))
    totals.update(articles_read=len(pages),articles_with_recognized_infobox=len(boxpages),statement_lifetimes=sid)
    dump('coverage.json','Infobox extraction coverage','counts',[dict(totals,parse_seconds=round(time.monotonic()-started,3),refusals=dict(errors),typed_lifetimes=dict(typed))])
if __name__=='__main__':extract()
