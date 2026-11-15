# /// script
# dependencies = ["pymysql"]
# ///
"""Chunked read-only scan. Cache contains derived events, not full article history."""
import collections as C, datetime as D, decimal, gzip, hashlib, json, pathlib, re, sys
import pymysql
ROOT=pathlib.Path(__file__).resolve().parent
CUT=D.datetime(2026,10,1,10,59,12)
MONTHS='tammikuuta|helmikuuta|maaliskuuta|huhtikuuta|toukokuuta|kesäkuuta|heinäkuuta|elokuuta|syyskuuta|lokakuuta|marraskuuta|joulukuuta'
NUM=re.compile(r'(?<!\w)(?:\d{1,2}\.\s*\d{1,2}\.\s*\d{3,4}|\d{1,2}\.\s*(?:'+MONTHS+r')\s+\d{3,4}|[+−-]?(?:\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:,\d+)?)(?!\d)',re.I)
def parse(text):
 matches=list(NUM.finditer(text)); literals=[]; last=0; vals=[]; kinds=[]
 for m in matches:
  literals.append(text[last:m.start()]); s=m.group(); last=m.end()
  if '.' in s:
   parts=re.findall(r'\d+',s)
   month=next((i+1 for i,m in enumerate(MONTHS.split('|')) if m in s.lower()),None)
   day=int(parts[0]); year=int(parts[-1]); month=month or int(parts[1])
   vals.append(f'{year:04d}-{month:02d}-{day:02d}'); kinds.append('date')
  else:
   n=re.sub(r'[ \u00a0\u202f]','',s).replace(',','.').replace('−','-')
   vals.append(str(decimal.Decimal(n).normalize())); kinds.append('year' if re.fullmatch(r'\d{4}',s) and 1000<=int(s)<=2099 and not re.match(r'\s*(?:ihmis|asuk|henk|sotila|miest|naist|euro|markk|doll|kilom|metri|km|m²|ha\b|kpl|prosent|%|vuoti|vuotta)',text[last:],re.I) else 'quantity')
 literals.append(text[last:]); return tuple(literals),tuple(vals),tuple(kinds),[m.group() for m in matches],[(m.start(),m.end()) for m in matches]
def sentence(text,span):
 # Do not cut on periods inside dates or on Finnish day ordinals.
 a,b=span
 left=list(re.finditer(r'(?<=[.!?])\s+(?=[A-ZÅÄÖ])',text[:a])); start=left[-1].end() if left else 0
 right=re.search(r'(?<=[.!?])\s+(?=[A-ZÅÄÖ])',text[b:]); end=b+right.start() if right else len(text)
 return text[start:end]
def iso(x):return x.isoformat(sep=' ') if isinstance(x,D.datetime) else x
def dump(name,title,unit,rows):
 (ROOT/'data'/name).write_text(json.dumps(dict(title=title,unit=unit,source='wtt; run.py; cutoff 2026-10-01 10:59:12 UTC',rows=rows),ensure_ascii=False,indent=2,default=iso)+'\n')
def union(rows):
 out=[]
 for r in sorted(rows,key=lambda r:(r['a'],r['b'],r['rev'])):
  if out and r['a']<=out[-1]['b']:
   out[-1]['b']=max(out[-1]['b'],r['b'])
  else:out.append(dict(r))
 return out
SQL={
 'titles':'SELECT page_id,title FROM revision ORDER BY page_id',
 'edits':'SELECT page_id,rev_id,saved_at,ended_at,user,editor,comment,reverted_by FROM edit WHERE page_id BETWEEN %s AND %s',
 'passages':'''SELECT p.page_id,p.slot,HEX(p.hash),p.born_rev,p.row_start,LEAST(p.row_end,'2026-10-01 10:59:12'),t.text
FROM passage FOR SYSTEM_TIME ALL AS p
JOIN passage_text AS t ON t.hash=p.hash
WHERE p.page_id BETWEEN %s AND %s AND t.kind='prose'
AND p.row_start < '2026-10-01 10:59:12' ''',
}
for n,s in SQL.items():(ROOT/'sql'/f'{n}.sql').write_text(s+';\n')
def process(pages,edits,titles):
 events=[]; figures=[]; stats=C.Counter()
 at_edit={(e[0],e[2]):e for e in edits.values()}
 for pid,rows in pages.items():
  stats['prose_rows']+=len(rows); slots=C.defaultdict(list)
  for slot,h,rev,a,b,text in rows:
   if slot==0:stats['slot_zero_rows']+=1;continue
   if b<=a:stats['nonpositive_rows']+=1;continue
   p=parse(text)
   actual=at_edit.get((pid,a))
   if actual is None:stats['missing_start_edit_rows']+=1
   if rev not in edits:stats['missing_born_edit_rows']+=1
   slots[slot].append(dict(a=a,b=b,text=text,parse=p,rev=actual[1] if actual else rev,born_rev=rev,hash=h))
  for slot,raw in slots.items():
   bytext=C.defaultdict(list)
   for r in raw:bytext[r['text']].append(r)
   stays=sorted([s for rs in bytext.values() for s in union(rs)],key=lambda r:(r['a'],r['b']))
   # Retain only unambiguous touching adjacent wordings. Filter counts require both endpoints unflagged.
   used=C.defaultdict(list)
   for i,(old,new) in enumerate(zip(stays,stays[1:])):
    if old['b']>new['a']:stats['overlapping_adjacent_stays']+=1;continue
    if old['b']!=new['a']:continue
    if i and stays[i-1]['b']>old['a']:continue
    if i+2<len(stays) and stays[i+2]['a']<new['b']:continue
    op,np=old['parse'],new['parse']
    if not op[1] or op[0]!=np[0]:continue
    if not any(c.isalpha() for part in op[0] for c in part):
     stats['numeric_only_same_skeleton_edges']+=1;continue
    diffs=[j for j,(a,b) in enumerate(zip(op[1],np[1])) if a!=b]
    if not diffs:stats['formatting_only_edges']+=1;continue
    if len(diffs)!=1:stats['multiple_number_edges']+=1;continue
    j=diffs[0]; oe=edits.get(old['rev']); ne=edits.get(new['rev'])
    if oe is None or ne is None:stats['missing_edit_edges']+=1;continue
    # All other numbers must also have identical surface form.
    if any(a!=b for k,(a,b) in enumerate(zip(op[3],np[3])) if k!=j):continue
    fid=f'{pid}:{slot}:'+hashlib.sha256(('\x00'.join(op[0])+'\x01'+str(j)).encode()).hexdigest()[:16]
    ev=dict(figure_id=fid,page_id=pid,article=titles[pid],slot=slot,position=j,at=new['a'],old=op[3][j],new=np[3][j],old_value=op[1][j],new_value=np[1][j],kind=op[2][j] if op[2][j]==np[2][j] else 'mixed',before=sentence(old['text'],op[4][j]),after=sentence(new['text'],np[4][j]),old_rev=old['rev'],rev_id=new['rev'],old_born_rev=old['born_rev'],new_born_rev=new['born_rev'],old_hash=old['hash'],new_hash=new['hash'],user=ne[4],editor=ne[5],comment=ne[6],old_comment=oe[6],old_reverted_by=oe[7],new_reverted_by=ne[7],clean=oe[7] is None and ne[7] is None)
    events.append(ev);used[(op[0],j,fid)].append(ev)
   for (literals,j,fid),evs in used.items():
    byval=C.defaultdict(list)
    for s in stays:
     if s['parse'][0]==literals:
      v=s['parse'][1][j]; e=edits.get(s['rev']);
      if e is None:continue
      byval[v].append(dict(a=s['a'],b=s['b'],rev=s['rev'],value=v,display=s['parse'][3][j],user=e[4],editor=e[5],comment=e[6],reverted_by=e[7]))
    timeline=sorted([r for rs in byval.values() for r in union(rs)],key=lambda r:r['a'])
    clean_timeline=sorted([r for rs in byval.values() for r in union([s for s in rs if s['reverted_by'] is None])],key=lambda r:r['a'])
    for ev in evs:
     before=[r for r in timeline if r['value']==ev['old_value'] and r['a']<ev['at']<=r['b']]
     after=[r for r in timeline if r['value']==ev['new_value'] and r['a']<=ev['at']<r['b']]
     ev['old_days']=round((ev['at']-min(r['a'] for r in before)).total_seconds()/86400,6) if before else None
     ev['new_days']=round((max(r['b'] for r in after)-ev['at']).total_seconds()/86400,6) if after else None
     ev['new_censored']=any(r['b']==CUT for r in after)
     ev['value_standing']=any(r['value']==ev['new_value'] and r['b']==CUT for r in timeline)
    for r in clean_timeline:r['censored']=r['b']==CUT
    vals=[r['value'] for r in clean_timeline]; collapsed=[v for i,v in enumerate(vals) if i==0 or vals[i-1]!=v]
    ce=[e for e in evs if e['clean']]
    figures.append(dict(figure_id=fid,page_id=pid,article=titles[pid],slot=slot,position=j,kind=evs[0]['kind'],sentence=evs[-1]['after'],distinct_values=len(set(vals)),flips=len(ce),returns=sum(v in collapsed[:i-1] for i,v in enumerate(collapsed) if i>=2),timeline=clean_timeline,events=ce))
 return events,figures,stats

def scan():
 conn=pymysql.connect(host='127.0.0.1',port=3310,user='wtt',password='wtt',database='wtt',charset='utf8mb4',autocommit=True)
 with conn.cursor() as q:q.execute("SET time_zone='+00:00'");q.execute(SQL['titles']);titles=dict(q.fetchall())
 ids=list(titles)
 for k in range(0,len(ids),100):
  chunk=ids[k:k+100]; dest=ROOT/'cache'/f'{chunk[0]:07d}-{chunk[-1]:07d}.json.gz'
  if dest.exists():continue
  edits={};pages=C.defaultdict(list)
  with conn.cursor(pymysql.cursors.SSCursor) as q:
   q.execute(SQL['edits'],(chunk[0],chunk[-1]))
   for row in q:edits[row[1]]=row
   q.execute(SQL['passages'],(chunk[0],chunk[-1]))
   for pid,*row in q:pages[pid].append(row)
  result=process(pages,edits,titles)
  result[2]['pages_scanned']+=len(chunk)
  with gzip.open(dest,'wt',encoding='utf8') as f:json.dump(result,f,ensure_ascii=False,default=iso)
  print(k+len(chunk),len(ids),'events',len(result[0]),flush=True)
 conn.close()

def report():
 events=[];figures=[];stats=C.Counter()
 for f in sorted((ROOT/'cache').glob('*.json.gz')):
  with gzip.open(f,'rt') as z:e,g,s=json.load(z)
  events+=e;figures+=g;stats.update(s)
 clean=[e for e in events if e['clean']]
 summary=[dict(metric='all_substitutions',value=len(events)),dict(metric='both_endpoints_not_reverted',value=len(clean)),dict(metric='new_endpoint_not_reverted',value=sum(e['new_reverted_by'] is None for e in events)),dict(metric='articles_with_substitutions',value=len({e['page_id'] for e in events}))]
 for pop,es in [('all',events),('clean',clean)]:
  for kind,n in sorted(C.Counter(e['kind'] for e in es).items()):summary.append(dict(metric=f'{pop}_{kind}',value=n))
 unsettled=[f for f in figures if f['flips']>=2 and (f['distinct_values']>=3 or f['returns']>0)]
 top=sorted(unsettled,key=lambda f:(-f['distinct_values'],-f['flips'],f['figure_id']))[:25]
 summary += [dict(metric='unsettled_figures',value=len(unsettled)),dict(metric='figures_with_return',value=sum(f['returns']>0 and f['flips']>=2 for f in figures))]
 summary += [dict(metric=k,value=v) for k,v in sorted(stats.items())]
 dump('summary.json','Number substitutions in prose','count',summary)
 dump('unsettled.json','Figures with returns or at least three values; unflagged origins','figure',top)
 dump('unsettled-quantities.json','Quantity-only unsettled positions; same ranking rules','figure',sorted([f for f in unsettled if f['kind']=='quantity'],key=lambda f:(-f['distinct_values'],-f['flips'],f['figure_id']))[:25])
 sizes=[]
 for pop,es in [('all',events),('clean',clean)]:
  es=[e for e in es if e['kind']=='quantity']; counts=C.Counter(); typos=C.Counter()
  for e in es:
   a,b=decimal.Decimal(e['old_value']),decimal.Decimal(e['new_value'])
   ratio=abs(b-a)/abs(a) if a else None
   band='zero baseline' if ratio is None else 'under 1%' if ratio<decimal.Decimal('.01') else '1–10%' if ratio<=decimal.Decimal('.1') else 'over 10%'
   counts[band]+=1
   if a and b and max(abs(a),abs(b))/min(abs(a),abs(b))>=10:counts['at least tenfold (overlapping)']+=1
   x,y=re.sub(r'\D','',e['old']),re.sub(r'\D','',e['new'])
   diff=[i for i,(p,q) in enumerate(zip(x,y)) if p!=q]
   typo='other'
   if len(x)==len(y) and len(diff)==2 and x[diff[0]]==y[diff[1]] and x[diff[1]]==y[diff[0]]:typo='digit transposition shape'
   elif len(x)==len(y) and len(diff)==1:typo='single digit replacement shape'
   if typo=='other' and abs(len(x)-len(y))==1:
    longer,shorter=(x,y) if len(x)>len(y) else (y,x)
    if any(longer[:i]+longer[i+1:]==shorter for i in range(len(longer))):typo='single digit insertion/deletion shape'
   typos[typo]+=1
  sizes += [dict(population=pop,classification='relative change',band=k,count=v,denominator=len(es),share=v/len(es)) for k,v in sorted(counts.items())]
  sizes += [dict(population=pop,classification='digit pattern (not inferred intent)',band=k,count=v,denominator=len(es),share=v/len(es)) for k,v in sorted(typos.items())]
 dump('size-of-change.json','Quantity substitutions only; tenfold overlaps percentage bins','substitution',sizes)
 durations=[];editors=[]
 for pop,es in [('all',events),('clean',clean)]:
  for side in ['old','new']:
   ns=sorted(e[side+'_days'] for e in es if e[side+'_days'] is not None)
   bands=C.Counter('<1 day' if x<1 else '1–30 days' if x<30 else '30–365 days' if x<365 else '1–5 years' if x<1826.25 else '5+ years' for x in ns)
   durations.append(dict(population=pop,side=side,n=len(ns),median_observed_days=(ns[(len(ns)-1)//2]+ns[len(ns)//2])/2 if ns else None,censored=sum(e['new_censored'] for e in es) if side=='new' else 0,bands=dict(bands)))
  for editor in ['named','ip','temp','hidden']:
   subset=[e for e in es if e['editor']==editor]
   editors.append(dict(population=pop,editor=editor,n=len(subset),value_standing=sum(e['value_standing'] for e in subset),uninterrupted_new_stay_at_cutoff=sum(e['new_censored'] for e in subset),standing_share=sum(e['value_standing'] for e in subset)/len(subset) if subset else None))
 dump('durations.json','Observed contiguous figure stays; new durations include right censoring','days',durations)
 dump('editors.json','Introducing editor type; standing means same value in same text skeleton','substitution',editors)
 with gzip.open(ROOT/'cache'/'events.ndjson.gz','wt') as out:
  for e in events:out.write(json.dumps(e,ensure_ascii=False)+'\n')
 print(json.dumps(summary,ensure_ascii=False,indent=2));print('Top:',[(f['article'],f['distinct_values'],f['flips']) for f in top])
if __name__=='__main__':
 if len(sys.argv)==1 or sys.argv[1]=='scan':scan()
 report()
