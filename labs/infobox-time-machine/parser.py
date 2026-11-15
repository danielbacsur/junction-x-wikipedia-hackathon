"""Balanced candidate extraction; mwparserfromhell handles parameter grammar.
No template expansion or claim that cleaned text equals rendered Wikipedia.
"""
import re,html,json
from pathlib import Path
from functools import lru_cache
from datetime import date
import mwparserfromhell as mw
TOKEN=re.compile(r'<!--[\s\S]*?(?:-->|$)|<(ref|nowiki|pre|source|syntaxhighlight)\b[^>]*?(?:/>|>[\s\S]*?</\1\s*>)|\{{2,}|\}{2,}',re.I)
def norm(s): return re.sub(r'\s+',' ',str(s).replace('_',' ')).strip().lower().removeprefix('malline:')
ALLOW=set()
def configure():
    global ALLOW
    ALLOW=set(json.loads((Path(__file__).parent/'templates.json').read_text()))
def boxes(text, all_templates=False):
    stack=[]; start=0
    for m in TOKEN.finditer(text):
        t=m.group()
        if t.startswith('{{'):
            if not stack:start=m.start()
            n=len(t)
            while n>=2:
                width=3 if n==3 else 2;stack.append(width);n-=width
        elif t.startswith('}}') and stack:
            # A triple close can close a template and leave one literal brace.
            n=len(t)
            while stack and n>=stack[-1]:n-=stack.pop()
            if not stack:
                raw=text[start:m.end()-n]
                name=norm(re.split(r'[|\n]',raw[2:-2],maxsplit=1)[0])
                if all_templates or name in ALLOW or (name.startswith(('tietolaatikko','infobox')) and '/' not in name):yield name,raw,False
    if stack:
        raw=text[start:];name=norm(re.split(r'[|\n]',raw[2:],maxsplit=1)[0])
        if all_templates or name in ALLOW or (name.startswith(('tietolaatikko','infobox')) and '/' not in name):yield name,raw,True
@lru_cache(maxsize=20000)
def clean(raw):
    s=re.sub(r'<!--.*?(?:-->|$)|<ref\b[^>]*?(?:/>|>.*?(?:</ref\s*>|$))',' ',raw,flags=re.S|re.I)
    # Keep unresolved template contents visibly marked; do not silently erase facts.
    unresolved=bool(mw.parse(s).filter_templates())
    for t in mw.parse(s).filter_templates(recursive=False):
        s=s.replace(str(t),'⟦'+str(t)[2:-2]+'⟧')
    return re.sub(r'\s+',' ',html.unescape(mw.parse(s).strip_code())).strip(),unresolved
@lru_cache(maxsize=4000)
def fields(raw):
    parsed=mw.parse(raw).filter_templates(recursive=False)
    if not parsed:return (),('unreadable_template',)
    out={};errors=[]
    for p in parsed[0].params:
        key=str(p.name).strip() # MediaWiki parameter names are case sensitive.
        if not p.showkey:errors.append('positional_parameter');continue
        if not key or len(key)>255:errors.append('invalid_field_name');continue
        if key in out:errors.append('duplicate_last_wins')
        value=str(p.value).strip()
        out[key]=(value,*clean(value))
    return tuple((k,*v) for k,v in out.items()),tuple(errors)
MONTHS=['tammi','helmi','maalis','huhti','touko','kesä','heinä','elo','syys','loka','marras','joulu']
def kind(field):
    f=norm(field).replace(' ','_')
    if f in ('syntynyt','syntymäaika','syntymäpäivä','born','birth_date','kuollut','kuolinaika','kuolinpäivä','died','death_date','perustettu','perustamisaika','perustamisvuosi','founded','established'):return 'date'
    if f in ('väkiluku','asukasluku','population','pinta-ala','pinta_ala','area'):return 'number'
    return None
def typed(field,raw,value):
    k=kind(field)
    if not k:return None,None,None
    if not value:return None,None,'empty'
    if k=='number':
        s=value.replace('\xa0',' ').strip()
        m=re.fullmatch(r'([+-]?\d[\d ]*(?:[.,]\d+)?)\s*(?:km[²2]|m[²2]|asukasta)?',s)
        return (None,float(m[1].replace(' ','').replace(',','.')),'number') if m else (None,None,'unread_number')
    # Finnish templates use D,M,Y; death-age puts birth first, death second.
    for t in mw.parse(raw).filter_templates():
        name=norm(t.name)
        if name in ('syntymäaika ja ikä','kuolinaika ja ikä','syntymäaika','kuolinaika','birth date','birth date and age','death date and age'):
            try:
                ids=(4,5,6) if name=='kuolinaika ja ikä' else (1,2,3)
                parts=[int(str(t.get(str(i)).value)) for i in ids]
                if name.startswith(('syntymä','kuolin')):parts.reverse()
                return date(*parts).isoformat(),None,'day'
            except (ValueError,TypeError):return None,None,'invalid_date_template'
    s=value.lower()
    for i,m in enumerate(MONTHS,1):s=re.sub(m+r'kuu(?:ta|n)?',str(i)+'.',s)
    matches=re.findall(r'(?<!\d)(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{3,4})(?!\d)',s)
    if len(matches)==1:
        try:
            d,m,y=map(int,matches[0]);return date(y,m,d).isoformat(),None,'day'
        except ValueError:return None,None,'invalid_date'
    if re.fullmatch(r'\d{4}',s):return s+'-01-01',None,'year'
    return None,None,'ambiguous_or_unread_date'
