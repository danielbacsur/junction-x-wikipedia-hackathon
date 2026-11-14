# /// script
# dependencies = ["pymysql"]
# ///
from common import *
from collections import defaultdict
sql('validate-use','USE lab_sentence_journeys')
sql('validate-zone',"SET time_zone='+00:00'")
raw=sql('validate-raw','SELECT r.page_id,HEX(r.hash) hash,r.s,r.e FROM raw r JOIN spread t USING(hash) WHERE t.articles>=2 ORDER BY r.page_id,r.hash,r.s,r.e')
merged=defaultdict(list)
for r in raw:
 key=(r['page_id'],r['hash']);a=merged[key]
 if a and r['s']<=a[-1][1]:a[-1][1]=max(a[-1][1],r['e'])
 else:a.append([r['s'],r['e']])
actual=sql('validate-presence','SELECT p.page_id,HEX(p.hash) hash,p.s,p.e FROM presence p JOIN spread t USING(hash) WHERE t.articles>=2 ORDER BY p.page_id,p.hash,p.s')
expected=[(k[0],k[1],s,e) for k,v in sorted(merged.items()) for s,e in v]
assert expected==[(r['page_id'],r['hash'],r['s'],r['e']) for r in actual]
current=sql('validate-current',"SELECT COUNT(*) n FROM (SELECT p.hash FROM wtt.passage p JOIN wtt.passage_text t USING(hash) WHERE t.kind='prose' AND t.chars>=120 GROUP BY p.hash HAVING COUNT(DISTINCT p.page_id)>=2) x")[0]['n']
assert current==json.loads((P/'data/summary.json').read_text())['rows'][0]['current_shared']
out('edge-audit',"SELECT COUNT(*) edges,SUM(near_removal<>(ABS(TIMESTAMPDIFF(SECOND,src_end,at))<=3600)) ambiguous_removal FROM edges",unit='edges')
out('same-reading-text',"""SELECT COUNT(*) hashes,COUNT(DISTINCT SHA2(t.text,256)) clean_texts FROM spread s JOIN wtt.passage_text t USING(hash) WHERE s.articles>=2""",unit='wordings')
out('evacuation-reading-text',"""SELECT COUNT(DISTINCT f.page_id) articles,COUNT(DISTINCT f.hash) hashes FROM firsts f JOIN wtt.passage_text t USING(hash) WHERE t.text=(SELECT text FROM wtt.passage_text WHERE hash=UNHEX('DC4E2656304FF854')) COLLATE utf8mb4_bin""",unit='articles')
out('event-concentration',"""SELECT COUNT(DISTINCT x.hash) shared_wordings_in_bulk_events FROM edges x JOIN events e ON e.src=x.src AND e.dst=x.dst AND e.dst_rev=x.dst_rev""",unit='wordings')
out('list-scale',"""SELECT COUNT(*) list_wordings,SUM(a.articles>=2) shared,SUM(a.articles>=20) twenty_plus,MAX(a.articles) max_articles FROM all_spread a JOIN wtt.passage_text t USING(hash) WHERE t.kind='list'""",unit='wordings')
out('window-sensitivity',"""SELECT hours,COUNT(*) move_events FROM (SELECT 1 hours UNION ALL SELECT 24 UNION ALL SELECT 168) windows JOIN (SELECT x.src,x.dst,x.dst_rev,x.hash,MIN(ABS(TIMESTAMPDIFF(SECOND,p.e,x.at))) distance FROM edges x JOIN presence p ON p.hash=x.hash AND p.page_id=x.src AND p.s<x.at GROUP BY x.src,x.dst,x.dst_rev,x.hash) e ON e.distance<=hours*3600 GROUP BY hours,e.src,e.dst,e.dst_rev HAVING COUNT(*)>=5""",unit='event groups')
# Convert detailed sensitivity groups to a compact count without changing SQL primary calculation.
f=P/'data/window-sensitivity.json';v=json.loads(f.read_text());groups=defaultdict(int)
for r in v['rows']:groups[r['hours']]+=1
save('window-sensitivity','Removal-window sensitivity among baseline candidate edges','events',[dict(hours=k,events=n) for k,n in sorted(groups.items())],'sql/window-sensitivity.sql; validate.py counts qualifying groups')
save('validation','Independent interval and current-row crosschecks','checks',[dict(shared_raw_rows=len(raw),shared_presence_intervals=len(actual),independent_interval_merge_matches=True,current_shared_direct=current)],'sql/validate-raw.sql; sql/validate-presence.sql; sql/validate-current.sql; validate.py')
c.close()
