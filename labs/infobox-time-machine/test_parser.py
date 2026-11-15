# /// script
# dependencies = ["mwparserfromhell"]
# ///
import parser as p
p.configure()
s='<!-- {{Henkilö|nimi=ghost}} -->{{Henkilö|nimi=[[A|B]]|x={{a|b={{c|d}}}}|ref=<ref>abc|x=y {{cite|foo}}</ref>|comment=one<!-- |x=no -->two|nimi=last|date={{{x|fallback}}}}}'
b=list(p.boxes(s));assert len(b)==1 and not b[0][2],b
fs,es=p.fields(b[0][1]);d={r[0]:r[1] for r in fs}
assert d['nimi']=='last' and d['x']=='{{a|b={{c|d}}}}' and d['ref']=='<ref>abc|x=y {{cite|foo}}</ref>' and 'duplicate_last_wins' in es,(d,es)
assert p.typed('syntynyt','[[1. tammikuuta]] [[1900]]','1. tammikuuta 1900')[0]=='1900-01-01'
assert p.typed('syntynyt','31.2.1900','31.2.1900')[2]=='invalid_date'
assert p.typed('väkiluku','1 234','1 234')[1]==1234
assert list(p.boxes('{{Henkilö|nimi=x'))[0][2]
print('Nested templates, triple arguments, comments, refs, links, duplicate parameters, invalid dates: passed')

s='{{Henkilö|a=first<ref name="a"/>|b=second}} prose <ref>later</ref>'
b=list(p.boxes(s));assert len(b)==1 and not b[0][2] and b[0][1].endswith('second}}')
assert p.typed('kuollut','{{Kuolinaika ja ikä|6|1|1915|23|7|2003}}','x')[0]=='2003-07-23'
assert p.typed('syntynyt','{{Syntymäaika ja ikä|11|2|1955}}','x')[0]=='1955-02-11'

assert list(p.boxes('{{Henkilö}}'))[0][0]=='henkilö'
assert not list(p.boxes('{{Albumi|1990|example}}'))
