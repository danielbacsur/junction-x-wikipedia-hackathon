# /// script
# dependencies = []
# ///
from pathlib import Path
import json,html
P=Path(__file__).resolve().parent;D=P/'data'
def rows(n):return json.loads((D/(n+'.json')).read_text())['rows']
def one(n):return rows(n)[0]
def table(headers,values):
 return '| '+' | '.join(headers)+' |\n|'+'|'.join(['---']*len(headers))+'|\n'+''.join('| '+' | '.join(str(x).replace('|','\\|').replace('\n',' ') for x in r)+' |\n' for r in values)+'\n'
def fmt(x):return f'{x:,.0f}'
s=one('summary');o=one('overall');v=next(r for r in rows('identity-sensitivity') if r['identity_valid']);inv=next(r for r in rows('identity-sensitivity') if not r['identity_valid']);cs=one('cluster-summary');u=rows('uncertainty');union=sum(r['article_hours'] for r in rows('exposure-union-by-year'));pop=rows('exposure-by-population');long=sum(r['version_hours'] for r in pop if r['population']=='long_range')
text=f'''# Exposure clock

## The question

How long do edits later labeled undone remain exposed in these Finnish Wikipedia histories, how did recorded durations change from 2004 to 2026, and what changed around temporary accounts? Can metadata distinguish patrol-like corrections from long-range restores and named-user revert clusters?

## What we found

- **{v['median_seconds']/60:.2f} minutes** is the median among {fmt(v['n'])} undone versions whose recorded restoring revision has a known hash; **{o['median_seconds']/60:.2f} minutes** using all {fmt(s['undone_versions'])} supplied undo labels. The distinction matters: {fmt(inv['n'])} labels point to restores with missing hashes.
- **24.81% → 31.91%**: anonymous edits undone by someone else within seven days before versus after the first temporary account. The increase is **{u[0]['estimate']:.2f} percentage points**, article-cluster bootstrap 95% interval **{u[0]['lower']:.2f}–{u[0]['upper']:.2f}**. This supports an observed association, not a causal effect of the switch.
- **2,350 → 1,573 anonymous edits** in the selected six-month windows, a **{100*(1-1573/2350):.1f}%** fall. Named edits fell **{100*(1-9976/15603):.1f}%**. Conditional seven-day median exposure moved **640 → 974.5 seconds**, but its difference interval **{u[1]['lower']:.0f} to {u[1]['upper']:.0f} seconds** includes zero: no clear evidence of changed exposure time.
- **{fmt(s['over_one_year'])} versions exceed one year** in the supplied labels. The longest is **{s['longest_days']:,.2f} days**, an empty-page restore spanning 1,106 edits, not evidence of persistent vandalism.
- **{fmt(cs['named_nonself_revert_events'])} known-hash named-versus-named revert events** across **{fmt(cs['article_months'])} article-months**. The largest cluster has **{rows('revert-clusters')[0]['revert_events']} events**, {rows('revert-clusters')[0]['title']} in {rows('revert-clusters')[0]['month']}.

### Yearly exposure

The following table deliberately reproduces the supplied `undone_by` population. Units for quantiles are minutes; hours are overlapping **version-hours attributed to the edit's year**. The separate union column is **article-hours allocated to the calendar year in which the interval occurs**; those columns are not the same quantity. All threshold shares are percentages and inclusive. 2003 is in JSON but omitted here because the question begins in 2004. 2026 is partial, ending {s['last_edit']} UTC, and especially vulnerable to right censoring.

'''
unions={r['year']:r['article_hours'] for r in rows('exposure-union-by-year')}
text+=table(['Year','n','Median min','p75 min','p90 min','p99 min','≤1m %','≤1h %','≤1d %','≤1w %','Version-hours','Union article-hours'],[[r['year'],fmt(r['n']),*[f"{r[k]/60:,.2f}" for k in ['median_seconds','p75_seconds','p90_seconds','p99_seconds']],*[f"{r[k]*100:.2f}" for k in ['within_minute','within_hour','within_day','within_week']],fmt(r['version_hours']),fmt(unions[r['year']])] for r in rows('exposure-by-year') if r['year']>=2004])
text+='The yearly medians do not show a steady improvement. Known-hash results and the narrower anonymous short-local population are shown below; population composition and follow-up duration still differ. The local proxy selects on restore-target age, so its seven-day upper bound is built into its definition.\n\n'
clean={r['year']:r for r in rows('valid-exposure-by-year')}
text+=table(['Year','Known-hash n','Known-hash median min','Anonymous short-local n','Short-local median min'],[[r['year'],fmt(clean[r['year']]['n']),f"{clean[r['year']]['median_seconds']/60:.2f}",fmt(r['n']),f"{r['median_seconds']/60:.2f}"] for r in rows('patrol-year')])
text+=f'''### What “exposure” does and does not mean

The supplied labels sum to **{s['version_hours']:,.0f} version-hours**, versus **{union:,.0f} article-hours** after merging overlapping undo-to-revert intervals on each article. Neither is reader exposure or proven survival of particular inserted text. **{fmt(one('integrity')['replaced_before_revert'])}** versions were replaced before their recorded revert. The sum of their exact saved-version lifetimes (including all undone versions) is **{s['exact_version_hours']:,.0f} hours**. Subsequent versions may preserve or remove any part of the text; metadata cannot tell.

Long-range restores contribute **{100*long/s['version_hours']:.2f}%** of supplied version-hours. Missing-hash restore labels alone contribute **{100*inv['version_hours']/s['version_hours']:.2f}%**. These populations overlap and must not be added. There are **{fmt(s['self_reverts'])} same-identifier self-corrections**, separated from other-user undos throughout.

'''
text+=table(['Population','Self','n','Median min','p90 min','Version-hours'],[[r['population'],r['self_revert'],fmt(r['n']),f"{r['median_seconds']/60:,.2f}",f"{r['p90_seconds']/60:,.2f}",fmt(r['version_hours'])] for r in pop])
text+='### Editor and reverter split\n\nThese are supplied-label results, not comparisons of editor quality. Named edits have a much longer historical tail; temporary accounts only exist at the end of the sample. The full cross-tab by editor × reverter (named/anonymous/hidden) × self × restore range is in [exposure-by-editor.json](data/exposure-by-editor.json); [valid-exposure-by-editor.json](data/valid-exposure-by-editor.json) excludes missing restoring hashes.\n\n'
text+=table(['Editor','Self','n','Median seconds','Within hour %'],[[r['editor'],r['self_revert'],fmt(r['n']),r['median_seconds'],f"{r['within_hour']*100:.2f}"] for r in rows('editor-summary')])
text+='### Temporary accounts: an observational before/after comparison\n\n'
text+=f"First appearance in this sample: **{s['first_temp']} UTC**. This is a sample observation, not independently verified deployment timing. Before = March–August 2025; after = October 2025–March 2026; omit September's transition. The seasonal reference is October 2024–March 2025. All are six complete months; the seasonal reference overlaps the before window in March and is not an independent control.\n\n"
text+=table(['Window','Editor','Edits','Observed undone, any lag/self','Nonself ≤7d','Share %','Conditional median seconds','Conditional p90 seconds'],[[r['period'],r['editor_group'],fmt(r['edits']),fmt(r['observed_undone']),fmt(r['other_undone_7d']),f"{100*r['other_undone_7d']/r['edits']:.2f}",r['median_7d_seconds'],round(r['p90_7d_seconds'],1)] for r in rows('temp-comparison')])
text+='Anonymous seven-day outcomes are unchanged when missing-hash restores are excluded. Anonymous share of all edits is 13.13% before versus 13.62% after: a drop in anonymous counts alone is weak evidence about the account switch. The previous autumn/winter anonymous median was 933.5 seconds, close to the post-switch 974.5 seconds. The full monthly series preserves IP and temporary accounts separately in [temp-accounts.json](data/temp-accounts.json). September 2026 ends at the seven-day eligibility cutoff; October has no eligible edits.\n\n'
text+='The article-cluster bootstrap resamples the union of 1,549 articles with replacement, using the same article weight in both periods, 2,000 repetitions and seed 20261114. It quantifies article concentration but does not model calendar shocks, editor dependence across articles, seasonality, or selection into this topic set. Exposure medians condition on a nonself undo within seven days: they are truncated outcome distributions, not an unconditional survival estimate. The available exposure results do not support claiming slower patrol from these data.\n\n'
text+='### Time of day and weekday\n\nKnown-hash anonymous nonself short-local restores only; Europe/Helsinki local time, historical DST included. These are descriptive durations among observed undo outcomes, not confirmed vandalism, and not a staffing recommendation. Low overnight counts and changing year/article composition can affect comparisons.\n\n'
text+=table(['Local hour','n','Median minutes','p90 hours'],[[r['local_hour'],r['n'],f"{r['median_seconds']/60:.2f}",f"{r['p90_seconds']/3600:.2f}"] for r in rows('exposure-by-hour')])
text+=table(['Weekday','n','Median minutes','p90 hours'],[[['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][r['local_weekday']],r['n'],f"{r['median_seconds']/60:.2f}",f"{r['p90_seconds']/3600:.2f}"] for r in rows('exposure-by-weekday')])
text+='### Twenty longest-lived undone versions\n\nAll twenty belong to **Vanhoillislestadiolaisuus**, and all are classified long-range. On 2021-05-14, revision **19772752** repeated the empty-text hash of revision **831633** from 2006-02-24; both have zero bytes. Its comment is “Ak: Sivu tyhjennettiin” (“page was blanked”). These are historical intervening edits swept into the span of a later blanking. Their comments include anti-vandalism restores, section edits, wording discussion and reference ordering. This is demonstrably a long-range empty-text identity match, not evidence that those old edits were vandalism. Intent of the later blanking is not established. No text was read. Full reverter metadata and comments are in [longest-lived.json](data/longest-lived.json).\n\n'
text+=table(['Rev ID','Exposure days','Exact version days','Original edit comment'],[[r['rev_id'],f"{r['exposure_days']:,.2f}",r['exact_version_days'],r['comment'] or '(none)'] for r in rows('longest-lived')])
text+='### Named-versus-named revert clusters\n\nCount each known-hash restoring revision once per article/month if its full restored span includes at least one differently named account. Unlike exposure, this uses **every restore span**, including repeated reversals of already undone versions. One revert can touch several users; pair counts therefore need not sum to unique event totals. This is activity clustering, not a judgment of intent. Missing-hash exclusions remove 26 candidate events.\n\n'
clusters=[];seen=set()
for r in rows('revert-clusters'):
 k=(r['page_id'],r['month'])
 if k not in seen:clusters.append(r);seen.add(k)
text+=table(['Article','Month','Distinct reverts','Event-user edges','Undo associations'],[[r['title'],r['month'],r['revert_events'],r['event_user_edges'],fmt(r['undone_versions'])] for r in clusters])
text+='Who reverted whom appears only as directed counts in [revert-clusters.json](data/revert-clusters.json) and [cluster-pairs.md](cluster-pairs.md), without allegations.\n\n'
pairs='# Directed counts in the top twenty revert clusters\n\n'
for r in clusters:
 pairs+=f"## {r['title']} — {r['month']}\n\n"+table(['Reverter','Reverted account','Revert events','Undo associations'],[[x['reverter'],x['reverted_user'],x['pair_revert_events'],fmt(x['pair_undone_versions'])] for x in rows('revert-clusters') if x['page_id']==r['page_id'] and x['month']==r['month']])
(P/'cluster-pairs.md').write_text(pairs)
text+=f'''## How it was measured

Run from the repository root:

```sh
uv run labs/exposure-clock/run.py
uv run labs/exposure-clock/validate.py
uv run labs/exposure-clock/report.py
```

MariaDB at `127.0.0.1:3310`, local root password `wtt`, is used because user `wtt` cannot read newly created lab tables. Only `lab_exposure_clock` is written. Source tables are read-only. One sequential connection per script; validation closes its connection before bootstrap. No text queries, no text scans, no web sources, no commits. Re-running rebuilds only this lab's tables and artifacts. `inspect_schema.py` is optional schema inspection. `audit.py` is optional targeted metadata inspection.

1. **Unit:** one supplied undone version. Join `(page_id, undone_by)` to its recorded restoring revision. Exposure = `TIMESTAMPDIFF(SECOND, saved_at, revert_at)`, whole seconds. Quantiles use interpolated `PERCENTILE_CONT`; all shares include equality. Year is the undone edit's UTC year. Values rounded in tables are presentation only; JSON retains query precision.
2. **Identity validity:** the source computes `LAG(seq)` partitioned by page and SHA1, including NULLs. A NULL match is not proof of identity. Raw requested files retain supplied labels for reconciliation; valid variants remove rows whose assigned restoring hash is NULL. They do not seek a later valid revert after an invalid first label. There are {fmt(one('source-audit')['missing_hash_edits'])} missing-hash edits and {fmt(one('source-audit')['null_sha_reverts'])} such restoring revisions. Empty-string hash matches are different: an actual empty-text hash is valid identity but may describe repeated blanking.
3. **Self:** exact binary equality of available user identifiers, excluding hidden identities in the fact table. Shared IPs can conflate people; changed IPs or temporary identifiers can split them. Named does not mean human: bot status is unavailable. Anonymous = IP or temporary account; hidden is separate.
4. **Restore populations:** short-local = at most 5 intervening versions and restored target at most 7 days old at revert; long-range = more than 50 intervening versions OR target more than 365 days old; intermediate = remainder. Boundaries are heuristic. These classify span geometry, never vandalism intent. All durations over 365 days necessarily fall in long-range.
5. **Hours:** raw sum is version-hours. Merge overlapping half-open `[saved_at,revert_at)` intervals by article using running maximum end, then clip to calendar years for article-hours. Exact-version lifetime ends at `ended_at`. Both interval aggregates are retrospective proxies, not pageviews or inserted-text residence time.
6. **Temporary accounts:** compare equal six-month edit cohorts, anonymous denominators include all IP/temp edits; outcome is a recorded nonself undo within 604800 seconds. Eligibility ends seven days before the sample's maximum saved time. Month-level series begins January 2024. The sample maximum is an administrative observation endpoint, not a guarantee of completeness on every article. Observed-any-lag undo counts are also provided but have unequal follow-up.
7. **Local time:** Python's IANA `Europe/Helsinki` zone produces a small offset interval table; all duration/grouping analysis runs in plain SQL. Frozen offsets are in `sql/timezone.sql`; hours and weekdays attach to the original edit. Monday = 0.
8. **Clusters:** group all named/nonself known-hash restore-span associations by revert's UTC month; count distinct restoring rev IDs. SQL sequence expansion is bounded at 10,000; the audited maximum span is {one('source-audit')['max_restore_span']}. The source ingestion's 5,000 expansion cap does not truncate this dataset.
9. **Checks:** all {fmt(one('integrity')['source_undone'])} source undone rows join successfully; zero backward reverts, out-of-span versions or negative durations; three zero-second durations. NumPy independently matches all four SQL yearly quantiles across 24 years; independent Python interval merging also matches all yearly SQL article-hour totals. No independence assumption is needed for the descriptive SQL values.

## The exact SQL

Every executed analysis statement is saved verbatim under [sql/](sql/), in execution order below. `run.py` regenerates it and writes chart objects with `title`, `unit`, `source`, `rows`. Wall-clock times are local warm-cache observations, not benchmarks. Core metadata results use SQL; Python only orchestrates, constructs timezone intervals, checks quantiles, estimates uncertainty and formats the report.

'''
text+=table(['SQL file','Seconds','Result rows'],[[f"[{r['query']}.sql](sql/{r['query']}.sql)",r['seconds'],r['rows']] for r in rows('timings')])
text+='The independent read used for quantile checks is [quantile-crosscheck.sql](sql/quantile-crosscheck.sql). Its wall time is recorded in [validation.json](data/validation.json). Bootstrap inputs come from [comparison-observations.sql](sql/comparison-observations.sql); seed and repetition count are recorded in [uncertainty.json](data/uncertainty.json).\n\n'
text+='''## What did not work

- Treating `saved_at → undone_by` as uninterrupted text exposure is not defensible: intervening versions and long-range blankings inflate the tail. Metadata cannot recover fragment-level lifetimes or intent.
- The supplied hash derivation includes NULL hashes. Clean and raw totals disagree substantially; reporting only the supplied aggregate would exaggerate exposure. This lab does not modify ingestion or repair the shared table.
- Counting revert clusters from `undone_by` misses later repeated reverts because it stores only the earliest remover. Full restore-span expansion fixes that for the cluster output.
- A causal “natural experiment” is not identified by this dataset. Calendar trends, article composition, changes in anonymous identity, and detection behavior remain confounders. A before/after median difference is not supported by the clustered interval; the undo-share association is supported descriptively.
- Self-reversion is identifier-based, not person-based. Neither anonymous nor nonself means vandalism. Comment interpretation is limited to the selected top twenty; comments are not used as outcome labels.
- The initial helper name `inspect.py` shadowed Python's standard library; it was renamed. Reading the lab DB with the source-only `wtt` user failed; scripts now use the provided local root credentials. Neither failure changed source data.

## What the product should do with it

Show an **“Identity-revert clock”**, labeled “time until recorded restore”, with sample size, period, and a known-hash default. Offer raw supplied labels as an explicit audit view. Keep self-corrections, short-local, intermediate and long-range restores selectable; do not call the local subset vandalism.

Show annual median/p75/p90/p99 and threshold shares, with a visible partial-2026 marker. Offer version-hours and union article-hours as separately explained metrics. Always display the restored target date, intervening edit count, original version lifetime and known-hash status on extreme cases; repeated blanking deserves its own annotation.

Show the temporary-account transition as an observational comparison with fixed follow-up and sample sizes: undo share rose, total anonymous activity declined alongside named activity, and exposure-time change is inconclusive. Avoid claiming that temporary accounts caused any of these outcomes.

Use local-time charts as exploration with counts, not a ranking of vandalism risk. Show named-user **revert clusters** as article-month event counts; pair tables contain directed counts only. Link revision IDs so readers can investigate context. Do not turn usernames into misconduct scores.
'''
(P/'README.md').write_text(text)
# Compact, self-contained chart, rendered in the task thread and saved for review.
a=[r for r in rows('valid-exposure-by-year') if r['year']>=2004]
chart='''<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:var(--font-sans);color:var(--foreground)}h3{font-size:16px;margin:16px 0 6px}p{font-size:12px;color:var(--muted-foreground)}svg{width:100%;height:230px}text{fill:var(--foreground);font-size:11px}.axis{stroke:var(--border)}.line{fill:none;stroke:var(--chart-1);stroke-width:2}.bar{fill:var(--chart-2)}</style></head><body><h3>Known-hash undo duration by edit year</h3><p>Median minutes • observed undone versions • 2026 partial; unequal follow-up</p><svg viewBox="0 0 680 230" role="img" aria-label="Annual median undo duration">'''
maximum=max(r['median_seconds']/60 for r in a)*1.1
for tick in range(5):
 value=maximum*tick/4;y=190-160*tick/4;chart+=f'<line class="axis" x1="48" x2="665" y1="{y}" y2="{y}"/><text x="0" y="{y+4}">{value:.0f}m</text>'
pts=[]
for i,r in enumerate(a):
 x=48+i*617/(len(a)-1);y=190-r['median_seconds']/60/maximum*160;pts.append(f'{x:.1f},{y:.1f}')
 if r['year'] in [2004,2010,2015,2020,2026]:chart+=f'<text x="{x-14}" y="215">{r["year"]}</text>'
chart+='<polyline class="line" points="'+' '.join(pts)+'"/></svg><h3>Anonymous edits undone by another identifier within seven days</h3><p>Six-month cohorts • association, not a causal effect • difference +7.1 percentage points (95% article-cluster interval +1.5 to +12.7)</p><svg viewBox="0 0 680 230" role="img" aria-label="Before versus after anonymous undo share">'
for x,rate,label,n in [(150,583/2350,'Before: Mar–Aug 2025',2350),(450,502/1573,'After: Oct 2025–Mar 2026',1573)]:
 h=rate*430;chart+=f'<rect class="bar" x="{x-60}" y="{180-h}" width="120" height="{h}"/><text x="{x-28}" y="{170-h}">{rate*100:.2f}%</text><text x="{x-80}" y="202">{label}</text><text x="{x-25}" y="220">n={n:,}</text>'
chart+='</svg><p>Source: labs/exposure-clock/sql • Exposure median change remains inconclusive.</p></body></html>'
(P/'chart.html').write_text(chart)
print('Wrote README.md, cluster-pairs.md and chart.html')
