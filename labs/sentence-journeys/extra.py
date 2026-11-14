# /// script
# dependencies = ["pymysql"]
# ///
from common import *
import hashlib,collections
sql('extra-use','USE lab_sentence_journeys')
sql('extra-zone',"SET time_zone='+00:00'")
# Curated exclusions from the ordered top 100; all other ties retain SQL order.
excluded={
'0DBFFD3517F997BF':'chart instructions','3BF651D34D522BF7':'table markup','13759AA786686C34':'table markup','12FFE54C46256791':'chart instructions','FC05E7E659561FD2':'navigation list','63FFE880BE7EF322':'bibliography','B0D464E2A8311558':'editing instructions','1CC5C8B619A89AD7':'repeated hoof text unrelated to articles','947DE933E72F8167':'table instructions','8412B70DA1EC387F':'list introduction','324B060D135AC77E':'table instructions','43991FDC6D1FEBAF':'list instructions','096ACE29204E279B':'list introduction','B01257D09173EBD1':'table markup','4308997987152707':'navigation list','E595FE7F938EDFB9':'repeated noise','625EAFEEDFF03AB8':'navigation list','0FED0DF0329A2009':'list introduction','D309343EB03FD4C6':'table markup','027E5EC011B1E903':'table markup','443D88FCD3B7DEB1':'list introduction','2400E0D3B1CEF82A':'bibliography','407F3EA76124BFAE':'bibliography','2CE791AEBBB5983C':'chart instructions'}
candidates=json.loads((P/'data/journey-candidates.json').read_text())['rows']
# More transparent automatic exclusions of obvious non-narrative blocks.
for r in candidates:
 if r['text'].count('|')>=3 or r['text'].startswith('! style='):excluded[r['hash']]='markup/navigation'
 if r['text'].startswith(('Seuraavassa kuvaajassa','Seuraavassa taulukossa','Lähteet kappaleeseen','ISBN','Seuraava taulukko','Tämä artikkeli')):excluded[r['hash']]='boilerplate/instructions'
chosen=[r for r in candidates if r['hash'] not in excluded][:30]
save('journey-exclusions','Editorial exclusions from substantive ranking','wordings',[dict(hash=k,reason=v) for k,v in excluded.items()],'extra.py explicit screen')
hashes=','.join("UNHEX('"+r['hash']+"')" for r in chosen)
paths=sql('journey-paths',f"""SELECT HEX(r.hash) hash,r.page_id,t.title,r.first_at,r.born_rev,r.current,e.user editor,e.comment,CONCAT('https://fi.wikipedia.org/?oldid=',CAST(r.born_rev AS UNSIGNED)) link FROM ranked r JOIN titles t USING(page_id) LEFT JOIN wtt.edit e ON e.rev_id=r.born_rev WHERE r.hash IN ({hashes}) ORDER BY r.hash,r.first_at,r.page_id""")
for r in chosen:r['path']=[v for v in paths if v['hash']==r['hash']];r['excerpt']=r.pop('text')[:650]
save('top-journeys','Thirty most-travelled substantive paragraphs after explicit screening','articles',chosen,'sql/journey-candidates.sql; sql/journey-paths.sql; data/journey-exclusions.json')
# Corroboration on source removal as well as destination birth; keep source edit metadata per event.
sql('drop-removals','DROP TABLE IF EXISTS removals')
sql('removals',"""CREATE TABLE removals AS SELECT DISTINCT v.src,v.dst,v.dst_rev,s.src_end,e.rev_id,e.user,e.comment FROM events v JOIN edges s ON s.src=v.src AND s.dst=v.dst AND s.dst_rev=v.dst_rev JOIN wtt.edit e ON e.page_id=v.src AND e.saved_at=s.src_end WHERE s.near_removal=1""")
removals=sql('removal-details','SELECT * FROM removals ORDER BY src,dst,dst_rev,src_end')
r=json.loads((P/'data/splits-and-merges.json').read_text())['rows']
for v in r:v['source_removal_edits']=[e for e in removals if e['src']==v['src'] and e['dst']==v['dst'] and e['dst_rev']==v['dst_rev']]
save('splits-and-merges','Thirty largest exact-text transfer candidates','paragraphs',r,'sql/splits-and-merges.sql; sql/removal-details.sql')
out('corroboration',"""SELECT COUNT(*) events,SUM(COALESCE(e.comment,'') REGEXP 'siirr|siirt|yhdist|kopio|jaett|jakami|eriyt|split|merg|mov|cop') destination_comment_matches,SUM(COALESCE(e.comment,'') REGEXP 'siirr|siirt|yhdist|kopio|jaett|jakami|eriyt|split|merg|mov|cop' OR EXISTS(SELECT 1 FROM removals r WHERE r.src=v.src AND r.dst=v.dst AND r.dst_rev=v.dst_rev AND COALESCE(r.comment,'') REGEXP 'siirr|siirt|yhdist|kopio|jaett|jakami|eriyt|split|merg|mov|cop')) either_comment_matches FROM events v LEFT JOIN wtt.edit e ON e.rev_id=v.dst_rev""",unit='events')
out('threshold-sensitivity',"""SELECT n.threshold,COUNT(*) events FROM (SELECT 3 threshold UNION ALL SELECT 5 UNION ALL SELECT 10) n JOIN (SELECT src,dst,dst_rev,COUNT(*) paragraphs FROM edges GROUP BY src,dst,dst_rev) e ON e.paragraphs>=n.threshold GROUP BY n.threshold""",unit='events')
if '--journeys-only' in sys.argv:
 c.close();sys.exit(0)
# Independent sentence segmentation is deliberately modest: punctuation followed by whitespace and an uppercase letter.
# SQL does all article-frequency aggregation. Python supplies text->sentence mapping only.
sql('drop-sentence-map','DROP TABLE IF EXISTS sentence_map')
sql('sentence-map-schema','CREATE TABLE sentence_map (hash BINARY(8), sentence_hash BINARY(20), PRIMARY KEY(hash,sentence_hash), INDEX(sentence_hash))')
sql('drop-sentence-text','DROP TABLE IF EXISTS sentence_text')
sql('sentence-text-schema','CREATE TABLE sentence_text (sentence_hash BINARY(20) PRIMARY KEY, sentence TEXT)')
blocks=sql('sentence-input',"SELECT hash,text FROM wtt.passage_text WHERE kind='prose'")
texts={};mapping=[]
for r in blocks:
 for sentence in set(re.split(r'(?<=[.!?])\s+(?=[A-ZÅÄÖ])',re.sub(r'\s+',' ',r['text']).strip())):
  if len(sentence)<40 or len(sentence)>1000 or not sentence.endswith(('.','!','?')):continue
  h=hashlib.sha1(sentence.encode()).digest();texts[h]=sentence;mapping.append((r['hash'],h))
del blocks
t=time.monotonic()
with c.cursor() as q:
 for i in range(0,len(mapping),5000):q.executemany('INSERT IGNORE INTO sentence_map VALUES (%s,%s)',mapping[i:i+5000])
 ts=list(texts.items())
 for i in range(0,len(ts),5000):q.executemany('INSERT IGNORE INTO sentence_text VALUES (%s,%s)',ts[i:i+5000])
timings.append(dict(query='sentence-mapping-python-and-inserts',seconds=round(time.monotonic()-t,4),rows=len(mapping)))
save('sentence-extraction','Sentence extraction inventory','rows',[dict(mapping_rows=len(mapping),distinct_sentences=len(texts))],'extra.py')
sql('drop-hash-pages','DROP TABLE IF EXISTS hash_pages')
sql('hash-pages',"CREATE TABLE hash_pages AS SELECT DISTINCT p.hash,p.page_id FROM wtt.passage FOR SYSTEM_TIME ALL p JOIN wtt.passage_text t ON t.hash=p.hash WHERE t.kind='prose'")
sql('hash-pages-index','ALTER TABLE hash_pages ADD PRIMARY KEY(hash,page_id)')
sql('drop-sentence-counts','DROP TABLE IF EXISTS sentence_counts')
sql('sentence-counts',"CREATE TABLE sentence_counts AS SELECT s.sentence_hash,COUNT(DISTINCT p.page_id) articles FROM sentence_map s JOIN hash_pages p ON p.hash=s.hash GROUP BY s.sentence_hash")
out('boilerplate-sentences',"""SELECT HEX(c.sentence_hash) hash,c.articles,t.sentence FROM sentence_counts c JOIN sentence_text t USING(sentence_hash) ORDER BY articles DESC,t.sentence LIMIT 40""",'Most repeated sentence-like spans in prose','distinct articles')
c.close()
