# /// script
# dependencies = ["pymysql"]
# ///
import pymysql,json
c=pymysql.connect(host='127.0.0.1',port=3310,user='root',password='wtt',cursorclass=pymysql.cursors.DictCursor)
with c.cursor() as q:
 for s in ["SELECT r.page_id,r.rev_id,r.saved_at,r.bytes,r.sha1,r.comment,t.rev_id target_rev_id,t.bytes target_bytes,t.sha1 target_sha,t.saved_at target_at FROM wtt.edit r JOIN wtt.edit t ON t.page_id=r.page_id AND t.seq=r.restores WHERE r.seq-r.restores-1=1106", "SELECT YEAR(f.saved_at) year,COUNT(*) n,SUM(f.exposure_seconds)/3600 hours FROM lab_exposure_clock.fact f JOIN wtt.edit r ON r.page_id=f.page_id AND r.seq=f.revert_seq WHERE r.sha1 IS NULL GROUP BY year"]:
  q.execute(s);print(json.dumps(q.fetchall(),default=str,ensure_ascii=False))
