# /// script
# dependencies = ["pymysql"]
# ///
import pathlib
p=pathlib.Path(__file__).parent
exec((p/'run.py').read_text().split("q('database'")[0])
timings=json.loads((BASE/'data'/'timings.json').read_text())['rows']
q('use-check','USE lab_claims_before_sources')
out('event-integrity','Birth and first-reference revision timestamp checks','slots',q('event-integrity',"SELECT COUNT(*) slots,SUM(e.saved_at<>v.a) birth_timestamp_mismatch,SUM(er.saved_at<>fr.a) reference_timestamp_mismatch,SUM(e.rev_id IS NULL) missing_birth_edit,SUM(fr.a IS NOT NULL AND er.rev_id IS NULL) missing_reference_edit FROM first_versions v JOIN current n USING(page_id,slot) LEFT JOIN wtt.edit e ON e.rev_id=v.born_rev LEFT JOIN first_refs fr ON fr.page_id=v.page_id AND fr.slot=v.slot LEFT JOIN wtt.edit er ON er.rev_id=fr.born_rev"))
out('current-reference-markers','Current inline marker coverage diagnostics','paragraphs',q('current-reference-markers',"SELECT COUNT(*) n,SUM(t.wikitext LIKE '%{{sfn%') sfn,SUM(t.wikitext LIKE '%{{harv%') harv FROM current n JOIN wtt.passage_text t ON t.hash=n.hash WHERE NOT n.has_ref"))
c.close()
