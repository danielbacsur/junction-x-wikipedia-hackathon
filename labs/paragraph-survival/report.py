# /// script
# dependencies = []
# ///
from pathlib import Path
import json
P=Path(__file__).parent
get=lambda n:json.loads((P/'data'/f'{n}.json').read_text())['rows']
s=get('summary')[0];i=get('summary')[1];m=get('medians');old=get('oldest-standing');ret=get('retraction-index');authors=get('authors')
def med(ep,dim='overall',grp='all'):return next(r for r in m if r['endpoint']==ep and r['dimension']==dim and r['grp']==grp)
def fmt(v):return 'not reached' if v is None else f'{v:,.2f}'
def table(rows,cols):
 return '| '+' | '.join(label for k,label in cols)+' |\n| '+' | '.join('---' for _ in cols)+' |\n'+'\n'.join('| '+' | '.join(('not reached' if r.get(k) is None else (f'{r[k]:,.0f}' if k in ('n','deaths','entering','wording_stays','still_standing','rows') else fmt(r[k]))) if r.get(k) is None or isinstance(r.get(k),(int,float)) else str(r.get(k,'')).replace('|','\\|').replace('\n',' ') for k,label in cols)+' |' for r in rows)+'\n'
h=get('hazard-by-age');curves=get('survival-overall');contain=get('containment')[0]
text=f'''# Paragraph survival

## The question

How long does an exact prose wording survive in the Finnish Wikipedia history-of-Finland sample, and how does that differ from the final disappearance of an inferred paragraph? This is a within-sample analysis, not an estimate for all Finnish Wikipedia or a claim of literature novelty.

## What we found

- **{fmt(med('wording')['median_days'])} days**: Kaplan–Meier median exact-wording survival, from **{s['prose_stays']:,}** prose stays of at least 80 clean characters. **{s['censored_removals']:,.0f}** observed endings are censored in this analysis. The raw-ending sensitivity median is **{fmt(med('wording_raw')['median_days'])} days**.
- **{fmt(med('slot')['median_days'])}**: median time (days) from first appearance to final disappearance of a qualifying inferred slot, including rewordings and gaps. Sample size **{med('slot')['n']:,.0f}**. This is a different estimand, not continuous wording residence.
- **{fmt(med('wording','editor','named')['median_days'])} versus {fmt(med('wording','editor','anonymous')['median_days'])} days** for named versus anonymous introductions. Anonymous includes IP and temporary accounts. These are unadjusted descriptive associations, not author-quality effects.
- Of **{s['standing']:,.0f}** current qualifying prose occurrences, **{s['before_2010_pct']:.2f}%** began their present uninterrupted stay before 2010, **{s['before_2015_pct']:.2f}%** before 2015 and **{s['before_2020_pct']:.2f}%** before 2020.
- The oldest uninterrupted current wording is in **{old[0]['title']}**, since **{old[0]['written_at']} UTC**, **{old[0]['days']:,.2f} days**. “Today” always means the dataset cutoff, not the present calendar date.
- **{authors[0]['author']}** leads the named-account residence totals with **{authors[0]['wording_days']:,.0f} wording-days**, across **{authors[0]['wording_stays']:,}** stays; **{authors[0]['still_standing']:,.0f}** still stand. This counts public account identifiers, not people or verified authorship of every word.

- **15.67%** of wording stays die by one hour on the adjusted KM curve; **23.83%** by one day and **34.72%** by 30 days. The first-hour rate is **{h[0]['deaths_per_1000_days']:,.2f} deaths per 1,000 wording-days**, versus **{h[1]['deaths_per_1000_days']:,.2f}** during the rest of day one.
- **56.99 → 676.59 days**: the 2004 versus 2024 cohort medians (n=6,385 and 38,670); observational, with different article/editor composition. Wordings ≥1,000 characters have median **67.09 days**, versus **274.59** for 80–199 characters; list items ≥80 characters have median **1,039.88 days** (n=69,547).
- **4 of the top 30 “removed” paragraphs still have their complete reading text in the article immediately afterward; 3 still do at cutoff.** Slot absence does not prove semantic removal. The leader is a **7,372.70-day** map-link paragraph; rank 2 is a paragraph merger, rank 6 a citation addition. Full contextual review is below.

### Endpoint and subgroup medians

Null/not reached means the estimated curve has not crossed 0.5. Every estimate includes n; no independence-based confidence intervals are claimed because wordings cluster within articles, edits and authors.

'''
for dim in ['overall','editor','length','kind','cohort']:
 text+='### '+dim.capitalize()+'\n\n'+table([r for r in m if r['dimension']==dim],[('endpoint','Endpoint'),('grp','Group'),('n','n'),('deaths','Deaths'),('median_days','Median days'),('max_followup_days','Maximum follow-up days')])+'\n'
text+='### Risk by age\n\nDisjoint intervals [start, end); rates divide deaths by actual observed time at risk in that band. A first-day probability is not the same as a per-day hazard.\n\n'+table(get('hazard-by-age'),[('from_days','Start day'),('to_days','End day'),('entering','Entering'),('deaths','Deaths'),('at_risk_days','Observed wording-days'),('deaths_per_1000_days','Deaths / 1,000 wording-days')])
text+='\n### Oldest standing wordings\n\nFull text, author, date and oldid links for all 25 are in [oldest-standing.json](data/oldest-standing.json).\n\n'+table(old,[('title','Article'),('written_at','Uninterrupted since UTC'),('author','Introducing account'),('days','Days'),('url','Revision')])
text+='\n### Removal candidates, not proven retractions\n\nThe SQL meets the requested slot-no-successor rule, but manual reading falsifies its stronger “truly removed” interpretation. **4/30** complete clean texts survive immediately after their supposed removal; **3/30** survive at cutoff. All 30 full texts, remover identifiers, comments and oldid links are in [retraction-index.json](data/retraction-index.json). See [manual-review.md](manual-review.md) for contextual reading of the leaders. A matching slot absent today does not establish that a factual claim was withdrawn: splits, mergers, article moves and unmatched rewrites can all qualify.\n\n'+table(ret,[('title','Article'),('days','Uninterrupted days'),('remover','Removing account'),('removal_comment','Edit comment'),('url','Removing revision')])
text+='\n### Author residence counts\n\nTop 100 named accounts are in [authors.json](data/authors.json); totals are additive wording-days, not unique article-days or reader exposure.\n\n'+table(authors[:20],[('author','Account'),('wording_stays','Stays'),('wording_days','Wording-days'),('still_standing','Still standing')])
text+=f'''
## How it was measured

Run from the repository root:

```sh
uv run labs/paragraph-survival/run.py
uv run labs/paragraph-survival/validate.py
uv run labs/paragraph-survival/review.py
uv run labs/paragraph-survival/containment.py
uv run labs/paragraph-survival/report.py
uv run labs/paragraph-survival/chart.py
```

`run.py` uses one sequential connection and writes only `lab_paragraph_survival` and this folder. `review.py` adds contextual excerpts for manual interpretation. Root uses the supplied local password; source tables remain read-only. No commits. Run these commands sequentially. `run.py drop-km` resumes from the KM calculation using existing intermediate tables; normal reproduction uses the full command. `inspect_schema.py` and `status.py` are optional diagnostics, not necessary for reproduction.

1. **Observation unit:** `(page_id, hash, dup)` continuous stay, merged using `LAG(row_end)` and a cumulative island ID when the preceding end differs from the next start. All positive-length source states participate before prose/list and length filters. {i['raw_rows']:,} source rows become {i['merged_stays']:,} stays across {i['pages']:,} pages; {i['zero_or_negative_rows']:,} zero/nonpositive source intervals are omitted. Hashes identify exact **wikitext**, including reference and formatting edits, not just rendered wording. Eight-byte truncated hashes have an untested collision risk.
2. **Returns:** a positive gap starts another stay, even if the wording is identical. There are {i['return_stays']:,} return stays across all kinds. No gap is credited as alive in wording-days or oldest-standing ranks. The introducing account is the stay's `born_rev` author, which can be a restorer rather than the original composer. Cohort uses the start of the uninterrupted stay.
3. **Endpoints:** first wording absence ends a stay, whether deletion or rewording. If the removing edit is itself labeled `undone_by`, censor at this end rather than call it a real death. Missing removing edits are also censored. There are {i['missing_removers']:,} missing removers, {s['missing_author']:,} prose stays with null author, {s['slot_changes_within_stay']:,} prose stays whose slot changes during continuity, and {i['duplicate_timestamp_edits']:,} surplus same-page/same-timestamp edits. Ties use the largest sequence number at that timestamp. Raw-ending sensitivity treats every observed absence as a death.
4. **Administrative censoring:** all remaining stays end observation at **2026-10-01 10:59:12 UTC**. The 2106 sentinel is never used as a survival duration. This cutoff assumes complete follow-up through the snapshot; excluded/deleted pages outside the source may create selection bias.
5. **Slot estimand:** `(page_id, slot>0)` from first appearance to final disappearance, retaining all kinds and lengths for follow-up. Qualify only slots whose first wording is prose/list and at least 80 characters. Rewordings and returns preserve the slot; time between returns is included in elapsed time to final extinction. The implementation uses token similarity threshold **0.4**, greedy pairing and revival of a previous unused slot. This is an interpretation, not evidence of semantic identity. A very different rewrite can receive a new slot. Ending edits marked undone are censored. This outcome uses hindsight about returns and is not a prospective first-removal survival curve.
6. **KM:** aggregate exits and deaths by exact duration; `n(t)` is the reverse cumulative sum of exits, including censors tied with deaths. `S(t)=product(1-d(t)/n(t))`, evaluated by a window sum of natural logs, with explicit zero handling. Double arithmetic avoids MariaDB decimal-division rounding. A median is the earliest event age with S≤0.5. Fixed chart ages run from one hour to 20 years; values beyond a group's observed support are null, never extrapolated. Cohorts 2004–2024 are shown; overall includes all years, including 2003 and partial 2026.
7. **Censoring limits:** KM is a proper censoring-aware estimator, but its usual independent-censoring assumption is questionable here. Undo-based censoring is informative, and source `undone_by` labels can be broad identity-restore labels rather than reliable vandalism annotations. The raw sensitivity curve is essential. No claim is made that every undone removal was malicious. Recent cohorts have less follow-up; survival differences also reflect topic, account, bot, length and period composition. Do not infer causal effects.
8. **Retraction candidates:** event=1, slot>0, this stay ends at the slot's final end, and no identical hash returns in the same page (any duplicate occurrence). Thus no later wording occupies that slot, no exact wording returns, and the final remover is not labeled undone. This is absence from this article, not proof of disappearance elsewhere. Earlier versions and neighboring prose require manual reading.
9. **Validation:** independent NumPy cumulative products check all three overall KM curves; Python interval merging checks 200 deterministic keys; SQL verifies conservation of interval microseconds and absence of remaining overlapping/touching stays. See [validation.json](data/validation.json). This checks computation, not the truth of ingestion's lineage or undo interpretation.

## The exact SQL

All executed analysis statements are saved verbatim in [sql/](sql/). The principal reproducible chain is `build-raw.sql` → `build-islands.sql` → `build-stays.sql` → `build-facts.sql`, and separately `build-slots.sql` → `build-slot-origin.sql` → `build-slot-facts.sql`; `build-event_counts.sql` → `build-risk.sql` → `build-km.sql` implements Kaplan–Meier entirely in MariaDB. Review query timings are in `review-context.json`; containment timing is in `containment.json`; validation timings are in `validation.json`. Python orchestrates queries and serializes results; no survival fitting is delegated to Python.

The key movement correction is:

```sql
SELECT r.*,
       SUM(new_stay) OVER (
         PARTITION BY page_id,hash,dup ORDER BY a,b
         ROWS UNBOUNDED PRECEDING) island
FROM (
  SELECT raw.*,
         IF(LAG(b) OVER (
           PARTITION BY page_id,hash,dup ORDER BY a,b)=a,0,1) new_stay
  FROM raw WHERE b>a
) r;
```

The exact KM statement is:

```sql
{(P/'sql/build-km.sql').read_text().strip()}
```

Timings below are wall-clock seconds under competing laptop/database workloads, not performance benchmarks. Repeated names record an explicitly resumed calculation during development.

'''
text+=table(get('timings'),[('query','SQL filename stem'),('seconds','Seconds'),('rows','Returned rows')])
text+='''
## What did not work

- Treating each versioned row as a lifetime overcounts deaths caused solely by changing order or whitespace gap. The interval merge corrects this.
- A simple median of completed lifetimes discards standing text and biases survival downward. The SQL KM includes administrative and undo-related censoring.
- Equating hashes with clean visible prose is too strong: the hash uses wikitext. This lab cannot separate typo, citation, formatting and substantive wording changes without a second identity definition.
- A removed slot is not a verified retraction. Similarity matching misses some rewrites, and cross-article copying is not tracked.
- Integer division inside the SQL log product initially lost precision. The final SQL forces double division; independent NumPy validation guards this error.
- A broad exploratory passage-text kind count was stopped to keep the primary pipeline sequential under load. It is not used for any result.

## What the product should do with it

The interactive [survival chart](survival.html) renders the JSON series, connecting sampled ages rather than displaying every KM step.

Show an exact-wikitext survival curve with n, event count, risk-set size, cutoff and a raw-versus-undo-censored toggle. Provide cohort, editor and length filters; blank unsupported tails. Label anonymous associations descriptively and avoid author quality rankings. Author residence totals may be shown as public contribution counts with the restoration-attribution caveat.

Offer a separate “inferred paragraph final disappearance” view with a visible slot interpretation warning, distinct from continuous survival. Pair oldest-standing cards with full text, UTC birth date, author and oldid link. Call the deletion list “long-lived removal candidates”, show edit comments and revision context, and require human review before describing any as a factual retraction. Never imply these records prove misinformation or misconduct.
'''
(P/'README.md').write_text(text)

headline_rows=[dict(headline='oldest_standing',**old[0]),dict(headline='leading_author',**authors[0]),dict(headline='containment_audit',**contain),dict(headline='first_hour_hazard',**h[0])]
(P/'data/summary.json').write_text(json.dumps(dict(title='Headline survival estimates, counts and caveats',unit='days, counts, percentages',source='sql/summary.sql; sql/integrity.sql; sql/medians.sql; oldest-standing.json; authors.json; containment.json; hazard-by-age.json',rows=[s,i]+m+headline_rows),ensure_ascii=False,indent=2))
