# /// script
# dependencies = []
# ///
"""Frozen manual judgments made after reading all 50 raw refs and 15 before/after pairs.
Regeneration checks identities/expected years; it does not perform a new manual audit.
"""
import json,pathlib,collections
B=pathlib.Path(__file__).parent
load=lambda n:json.loads((B/'data'/f'{n}.json').read_text())['rows']
def out(n,title,unit,rows):
 (B/'data'/f'{n}.json').write_text(json.dumps(dict(title=title,unit=unit,source='Manual reading by research agent, 2026-11-14; frozen judgments in audit.py; not an independent human audit',rows=rows),ensure_ascii=False,indent=2))
OLD='later better source for an old true claim'
NEW='claim was updated with new information'
LOOK='possible circular sourcing worth a human look'
ERROR='parser error'
notes=[
('Herman Klaunpoika Fleming',OLD,'Identical before/after description of Louhisaari architecture; 2025 magazine article added in 2026 to a 2006 lineage. Ordinary retrospective sourcing is plausible; magazine contents and historical truth not independently verified.'),
('Maria Tschetschulin',OLD,'Family relationships and occupations retained; removes summer 1852 and changes punctuation. A 2017 biographical retrospective is attached in 2026. Low concern; publisher contents not independently read.'),
('Esko Seppänen',NEW,'Citation accompanies the newly appended comparison with Jörg Haider. High paragraph overlap hides a new claim; old political-orientation text is not evidence that the new comparison preceded its source.'),
('Pohjanmaan maanjäristys 1626',OLD,'Identical text at attachment. University seismology page supports the old earthquake/magnitude/damage account. Its fetched page shows no publication date: template year 2025 is unverified, potentially an update/access-year mistake. Do not present as confirmed later publication.'),
('Laatokan Karjalan valtaus 1941',NEW,'First sentence is localized from Korpiselkä to Ristikangas northeast of Korpiselkä at attachment. The 2021 book can support that new precision, even though the long paragraph is mostly unchanged.'),
('Pirkko Ikonen',NEW,'The 2026 obituary arrives with a newly added 9 January 2026 death date and present-to-past tense. This is a new event, not evidence of copying a 2007 death claim.'),
('Valter Valli',NEW,'Adds the specific regiment number 126 when citing a 2014 book. Much older battle narrative remains, but citation scope may be the newly specified unit.'),
('Venäjän kenttälinnoitukset Suomessa ensimmäisen maailmansodan aikana',OLD,'Word-identical rationale for Russian wartime fortifications; later 2018 history book attached in 2025. Ordinary historical sourcing is plausible; book text not independently verified.'),
('Outokummun rata',NEW,'Changes demolition year from 2004 to 2005, removes the 2000 closure claim, and qualifies opening of the complete route. The 2009 railway reference accompanies factual corrections.'),
('Suomen ensimmäiset tietokoneet',OLD,'Unchanged 2005 paragraph includes the sauna-origin anecdote. Archived Sitra article confirms 24 October 2017 and has a source list naming Sarmanto/Tunkelo interviews, 1971/1972 records and older material. Evidence favors a later researched retrospective; direct dependence of this individual anecdote is not fully traced.'),
('Nailonsukkamurhat',NEW,'Adds exact death day/month at attachment; older crime narrative remains. The template says 23 June 2023, accessed 24 June 2023, but attachment is 24 June 2024. Access dates cannot substitute for observed attachment times; source metadata could also contain a typo.'),
('Sinikka Hurskainen',NEW,'Changes spouse from secretary general to former secretary general; cited 2014 article announces a successor. Also removes child name. New status update explains why a later source is relevant.'),
('Lauri Nurminen',OLD,'Rephrases last surviving into longest lived while preserving identity/date claim. The dated 2023 association report cites its own anniversary book and describes a grave visit. Evidence favors later retrospective sourcing; does not prove every detail independently.'),
('Laitaatsillan taistelu',LOOK,'Unchanged, detailed earthwork dimensions and trench account predates a 2015 tourism thesis by eight years. Theseus confirms thesis year; PDF fetch was blocked, so its page 20 and bibliography remain unchecked. A focused provenance check is worthwhile; no evidence that the thesis copied Wikipedia has been established.'),
('Hietamäki (Inkeri)',NEW,'Changes the historical church village and memorial location from Alakylä to Jälkylä while attaching a 2017 church magazine. This is a substantive location correction despite 93% origin overlap.')]
external={4:['https://www.helsinki.fi/fi/seismologian-instituutti/maanjaristykset/perustietoa-maanjaristyksista'],10:['https://arkisto.sitra.fi/caset/data-sitra/','https://arkisto.sitra.fi/artikkelit/tarinoita-tulevaisuudesta-lahdeluettelo/'],13:['https://vapaussodanperinne.yhdistysavain.fi/uutiset/yhdistys-laski-havukukat-viimeisen/'],14:['https://www.theseus.fi/handle/10024/99666']}
a=[]
cs=load('candidates')
for i,(title,category,note) in enumerate(notes,1):
 c=cs[i-1];assert c['title']==title,(i,c['title'],title)
 a.append(dict(rank=i,page_id=c['page_id'],slot=c['slot'],article=title,classification=category,rationale=note,provisional=True,written_oldid=c['written_oldid'],reference_oldid=c['reference_oldid'],external_sources=external.get(i,[])))
 cs[i-1]['manual_audit']=a[-1]
out('audit','Manual triage of the 15 longest waits','candidates',a)
obj=json.loads((B/'data/candidates.json').read_text());obj['rows']=cs;(B/'data/candidates.json').write_text(json.dumps(obj,ensure_ascii=False,indent=2))
expected=[1994,2020,2018,2028,2024,1929,2020,2018,2006,2016,1870,1984,1979,1992,2015,2007,2013,1966,2017,1988,2020,1937,2011,1909,1980,2022,2001,1907,1970,1926,1983,2024,2009,2017,2013,2014,2023,2014,2020,2024,2023,1923,2018,2017,2023,2016,1918,2026,2022,2013]
pa=[]
for i,(r,y) in enumerate(zip(load('parser-audit-sample'),expected),1):
 assert r['publication_year']==y,(i,r['publication_year'],y)
 note='Manually read explicit '+r['date_field']+'='+r['publication_date']+'; year matches and is not taken from accessed/archive fields.'
 if i in [34,43,47]:note+=' Read the same-paragraph named definition body as well as the self-closing occurrence.'
 if i==4:note+=' SOURCE DATA ERROR: 2028 is after snapshot/access time; faithful extraction, unusable as an established publication date.'
 if i==27:note+=' Malformed double hyphen in full date; year 2001 remains unambiguous.'
 if i==47:note+=' SEMANTIC LIMIT: 1918 dates an archival act, not necessarily online publication; no claim of digital publication year.'
 pa.append(dict(sample=i,**r,expected_year=y,year_extraction_correct=True,note=note))
out('parser-audit','Manual year-field extraction checks, seed 20261114','references',pa)
mix=collections.Counter(x['classification'] for x in a)
out('audit-summary','Manual triage and parser audit results','counts and percent',[dict(top_candidates_audited=15,mix=dict(mix),parser_errors_in_top15=0,parser_sample_size=50,correct_year_field_extractions=50,year_field_precision_pct=100,precision_wilson95_low_pct=92.865,precision_wilson95_high_pct=100,future_year_data_errors=1,archival_date_semantics_flags=1,publication_truth_precision=None,confirmed_circular_sourcing=0)])
