# /// script
# dependencies = ["duckdb", "pymysql", "mwparserfromhell", "pytz"]
# ///
from build import *
import statistics,math
start=time.monotonic()
fields=collections.defaultdict(lambda:dict(lifetimes=0,observations=0,articles=set(),keys=set(),closed_days=[],current=0,direct_replacements=0,clean_changes=0,raw_only_changes=0))
templates=collections.Counter();last={};datehist=collections.defaultdict(list);typedcounts=collections.Counter();aba=0;previous2={};keycounts=collections.Counter()
for line in gzip.open(BASE/'cache/statements.jsonl.gz','rt'):
    r=json.loads(line);f=r['field'];k=(r['page_id'],r['template'],r['slot'],f);s=fields[f];s['lifetimes']+=1;s['observations']+=r['versions'];s['articles'].add(r['page_id']);s['keys'].add(k);templates[r['template']]+=1;keycounts[k]+=1
    a=datetime.datetime.fromisoformat(r['row_start']);b=datetime.datetime.fromisoformat(r['row_end']) if r['row_end'] else None
    if b:s['closed_days'].append((b-a).total_seconds()/86400)
    else:s['current']+=1
    old=last.get(k)
    if old and old['row_end']==r['row_start']:
        s['direct_replacements']+=1
        if old['value']!=r['value']:s['clean_changes']+=1
        else:s['raw_only_changes']+=1
        older=previous2.get(k)
        if older and older['row_end']==old['row_start'] and older['raw_value']==r['raw_value']:aba+=1
    previous2[k]=old;last[k]=r
    if r['precision']:typedcounts[(f,r['precision'])]+=1
    if p.norm(f) in ('syntynyt','syntymäaika','syntymäpäivä','born','birth_date','kuollut','kuolinaika','kuolinpäivä','died','death_date'):
        datehist[k].append(r)
def quant(v,q):
    if not v:return None
    v=sorted(v);pos=(len(v)-1)*q;lo=int(pos);hi=math.ceil(pos);return v[lo]+(v[hi]-v[lo])*(pos-lo)
rates=[]
for f,s in fields.items():
    rates.append(dict(field=f,lifetimes=s['lifetimes'],observations=s['observations'],articles=len(s['articles']),field_slots=len(s['keys']),observations_per_lifetime=s['observations']/s['lifetimes'],direct_replacements=s['direct_replacements'],clean_changes=s['clean_changes'],raw_only_changes=s['raw_only_changes'],changes_per_1000_observations=1000*s['direct_replacements']/s['observations'],current=s['current']))
rates.sort(key=lambda s:-s['observations'])
dump('change-rates.json','Changes per field; raw-value lifetimes','counts and replacements per 1,000 observations',rates,'uv run analyze.py; cache/statements.jsonl.gz')
durations=[]
for r in rates[:20]:
    s=fields[r['field']];v=s['closed_days'];durations.append(dict(field=r['field'],closed=len(v),right_censored=s['current'],p10_days=quant(v,.1),p25_days=quant(v,.25),median_days=quant(v,.5),p75_days=quant(v,.75),p90_days=quant(v,.9),under_day=sum(x<1 for x in v),under_30_days=sum(x<30 for x in v),over_year=sum(x>=365 for x in v)))
dump('durations.json','Completed raw-value lifetimes for twenty most observed fields','days',durations,'uv run analyze.py; excludes current/right-censored lifetimes')
changed=[];bins=collections.Counter();transitions=[]
for k,history in datehist.items():
    history.sort(key=lambda r:r['row_start']);changes=[]
    for old,new in zip(history,history[1:]):
        if old['row_end']!=new['row_start'] or old['precision']!='day' or new['precision']!='day' or old['fact_date']==new['fact_date']:continue
        a=datetime.date.fromisoformat(old['fact_date']);b=datetime.date.fromisoformat(new['fact_date']);days=abs((b-a).days)
        bucket='1 day' if days==1 else '2–31 days' if days<=31 else '32–365 days' if days<=365 else '>365 days'
        c=dict(before=str(a),after=str(b),absolute_days=days,bucket=bucket,changed_at=new['row_start'],rev_id=new['rev_id'],editor=new['editor'],comment=new['comment']);changes.append(c);bins[bucket]+=1
        transitions.append(dict(page_id=k[0],title=new['title'],template=k[1],field=k[3],**c))
    if changes:changed.append(dict(page_id=k[0],title=history[-1]['title'],template=k[1],slot=k[2],field=k[3],changes=len(changes),max_absolute_days=max(c['absolute_days'] for c in changes),transitions=changes,timeline=[{x:r[x] for x in ('rev_id','editor','comment','raw_value','value','fact_date','precision','row_start','row_end')} for r in history]))
changed.sort(key=lambda r:(-r['max_absolute_days'],-r['changes'],r['page_id']))
dump('changed-dates.json','Twenty-five birth/death fields with largest parsed date shifts','days and changes',changed[:25],'uv run analyze.py; adjacent continuous day-precision lifetimes only; Gregorian arithmetic')
dump('date-changes.json','All parsed birth/death date changes','transitions',transitions,'uv run analyze.py; no year-only or ambiguous dates')
dump('typed-coverage.json','Typed parser results per field','lifetimes',[dict(field=f,result=t,lifetimes=n) for (f,t),n in sorted(typedcounts.items())],'uv run analyze.py')
dump('shape.json','Shape of the statement history','counts',[dict(statements=sum(templates.values()),distinct_fields=len(fields),distinct_templates=len(templates),field_slots=len(keycounts),lifetimes_per_field_slot=sum(keycounts.values())/len(keycounts),median_lifetimes_per_field_slot=statistics.median(keycounts.values()),observations=sum(r['observations'] for r in rates),raw_aba=aba,date_change_events=len(transitions),date_fields_changed=len(changed),date_articles_changed=len({r['page_id'] for r in changed}),date_shift_bins=dict(bins),templates=dict(templates.most_common()))],'uv run analyze.py')
print('done',len(transitions),'date changes',len(changed),'changed date fields',flush=True)
