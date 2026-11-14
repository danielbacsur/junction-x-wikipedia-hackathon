# /// script
# dependencies = ["mwparserfromhell"]
# ///
import json,re,pathlib,random,collections,datetime,hashlib
import mwparserfromhell as mw
B=pathlib.Path(__file__).parent
load=lambda n:json.loads((B/('cache' if n.endswith('input') else 'data')/f'{n}.json').read_text())['rows']
def out(n,title,unit,rows):
 (B/('cache' if n.endswith('input') else 'data')/f'{n}.json').write_text(json.dumps(dict(title=title,unit=unit,source='wtt snapshot 2026-10-01; parse.py; conservative explicit template dates',rows=rows),ensure_ascii=False,indent=2))
def clean(s):return str(mw.parse(str(s)).strip_code()).strip()
def norm(s):return re.sub(r'[\s_\-]','',str(s).strip().lower())
DATE_KEYS=['ajankohta','julkaistu','päiväys','päiväys','date','publicationdate','vuosi','year']
def refs(w):
 result=[]
 for tag in mw.parse(w).filter_tags():
  if str(tag.tag).strip().lower()!='ref':continue
  raw=str(tag); body=str(tag.contents or ''); d=dict(raw=raw,body=body,name=next((str(a.value).strip('"\' ') for a in tag.attributes if norm(a.name)=='name'),None),publication_year=None,publication_date=None,date_field=None,title=None,publisher=None,url=None,access_date=None)
  for t in mw.parse(body).filter_templates():
   name=norm(t.name)
   if name not in ['verkkoviite','lehtiviite','kirjaviite','citeweb','citenews','citebook','citejournal','verkkolähde']:continue
   p={norm(a.name):clean(a.value) for a in t.params}
   for field in DATE_KEYS:
    val=p.get(field,''); ys=re.findall(r'(?<!\d)(1[0-9]{3}|20[0-9]{2})(?!\d)',val)
    if len(set(ys))==1:
     d.update(publication_year=int(ys[0]),publication_date=val,date_field=field);break
   for dest,keys in [('title',['nimeke','nimike','otsikko','title']),('publisher',['julkaisija','julkaisu','publisher','work','journal']),('url',['osoite','url','www']),('access_date',['viitattu','luettu','accessdate'])]:
    d[dest]=next((p[k] for k in keys if p.get(k)),d[dest])
   if d['publication_year']:break
  result.append(d)
 # Resolve definitions only within the same paragraph, never from a future revision.
 defs={r['name']:r for r in result if r['name'] and r['body']}
 for r in result:
  if not r['body'] and r['name'] in defs:
   old=r['raw'];r.update(defs[r['name']]);r['raw']=old;r['resolved_within_paragraph']=True
 return result
def overlap(a,b):
 a=collections.Counter(re.findall(r'\w+',a.lower()));b=collections.Counter(re.findall(r'\w+',b.lower()))
 return 2*sum((a&b).values())/(sum(a.values())+sum(b.values())) if a and b else 0
pre={(r['page_id'],r['slot']):r for r in load('pre-reference-input')}
gaps={(r['page_id'],r['slot']):r for r in load('gap-input')}
rows=load('reference-input');counts=collections.Counter();deltas=collections.Counter();parsed=[];candidates=[];allfirst=[];citation_facts=[]
for i,r in enumerate(rows):
 current=refs(r['current_wikitext']);first=refs(r['first_ref_wikitext']);counts['current_reference_occurrences']+=len(current)
 for j,s in enumerate(current):citation_facts.append(dict(page_id=r['page_id'],slot=r['slot'],reference_index=j,written_year=int(r['written'][:4]),publication_year=s['publication_year'],unresolved_named=int(not s['body'] and not s.get('resolved_within_paragraph'))))
 for j,s in enumerate(current):
  counts['current_unresolved_named']+=int(not s['body'] and not s.get('resolved_within_paragraph'))
  if s['publication_year']:
   counts['current_parseable_occurrences']+=1;deltas[s['publication_year']-int(r['written'][:4])]+=1
   parsed.append(dict(page_id=r['page_id'],slot=r['slot'],article=r['title'],reference_index=j,**s))
 counts['paragraphs_with_parseable_current_date']+=int(any(s['publication_year'] for s in current))
 p=pre.get((r['page_id'],r['slot']))
 if not p or r['wait_days']<=0:continue
 if (r['page_id'],r['slot']) in gaps:
  counts['gained_slots_with_observation_gaps']+=1;continue
 before_sim=overlap(p['before_text'],r['after_text']);origin_sim=overlap(r['original_text'],r['after_text']);current_sim=overlap(r['after_text'],r['current_text'])
 for j,s in enumerate(first):
  if not s['publication_year']:continue
  counts['dated_first_attached_occurrences_in_gained_slots']+=1
  if s['publication_year']<=int(r['written'][:4]):continue
  counts['later_published_first_occurrences']+=1
  if s['publication_year']>int(r['referenced'][:4]):counts['future_publication_at_attachment']+=1;continue
  if min(before_sim,origin_sim,current_sim)<.8:continue
  identity=lambda x:(x.get('url') or x.get('title') or x['body']).strip()
  persists=any(identity(s)==identity(x) for x in current)
  if not persists:continue
  z={k:v for k,v in r.items() if k not in ['current_wikitext','first_ref_wikitext']}
  z.update(before_text=p['before_text'],before_rev=p['born_rev'],before_similarity=before_sim,origin_similarity=origin_sim,current_similarity=current_sim,source=s,coattached_references=first,source_still_present=persists,written_oldid=f"https://fi.wikipedia.org/?oldid={r['written_rev']}",reference_oldid=f"https://fi.wikipedia.org/?oldid={r['reference_rev']}",before_oldid=f"https://fi.wikipedia.org/?oldid={p['born_rev']}",publication_year_gap=s['publication_year']-int(r['written'][:4]))
  candidates.append(z)
out('citation-facts-input','Parsed reference occurrence facts for SQL aggregation','references',citation_facts)
# One paragraph per candidate, choose latest publication among simultaneously first-attached refs.
candidates.sort(key=lambda r:(-r['wait_days'],-r['source']['publication_year'],r['page_id'],r['slot']))
seen=set();unique=[]
for r in candidates:
 k=(r['page_id'],r['slot'])
 if k in seen:continue
 seen.add(k);unique.append(r)
counts['candidate_paragraphs']=len(unique);counts['current_paragraphs_parsed']=len(rows)
out('publication-summary','Publication date coverage','reference occurrences', [dict(counts)])
out('publication-year-gap','Publication year minus slot birth year, current dated refs','reference occurrences',[dict(year_gap=k,references=v) for k,v in sorted(deltas.items())])
out('candidates','First-source chronology candidates, not allegations','paragraphs',[dict(rank=i+1,**r) for i,r in enumerate(unique[:50])])
out('all-candidate-metrics','All qualifying candidate identifiers and overlaps','paragraphs',[{k:r[k] for k in ['page_id','slot','wait_days','before_similarity','origin_similarity','current_similarity','publication_year_gap']} for r in unique])
manifest=B/'data/parser-sample-manifest.json'
if manifest.exists():
 lookup={(r['page_id'],r['slot'],r['reference_index']):r for r in parsed}
 sample=[lookup[(r['page_id'],r['slot'],r['reference_index'])] for r in json.loads(manifest.read_text())['rows']]
else:
 random.Random(20261114).shuffle(parsed);sample=parsed[:50]
out('parser-audit-sample','Random parsed current references for manual review','references',sample)
print(json.dumps(dict(counts),indent=2));print('top',[(r['title'],r['wait_days']) for r in unique[:15]])
