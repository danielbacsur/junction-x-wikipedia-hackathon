# /// script
# dependencies = []
# ///
import json,pathlib,collections
R=pathlib.Path(__file__).resolve().parent
read=lambda f:json.loads((R/'data'/f).read_text())['rows']
s={r['metric']:r['value'] for r in read('summary.json')};d=read('durations.json');sizes=read('size-of-change.json');eds=read('editors.json');top=read('unsettled.json');audit=read('manual-audit.json')
fmt=lambda n:f'{n:,}'
text=f'''# Numbers that moved

## The question

Which figures changed while the words around them stayed the same? This lab measures strict, single-number replacements in prose in the Finnish history sample. It does not decide which number is true.

## What we found

- **{fmt(s['all_substitutions'])} strict substitutions** across **{fmt(s['articles_with_substitutions'])} articles**. **{fmt(s['both_endpoints_not_reverted'])}** have neither endpoint's introducing edit marked `reverted_by`. **{fmt(s['new_endpoint_not_reverted'])}** have an unflagged new endpoint alone.
- The conservative unflagged set contains **{fmt(s.get('clean_quantity',0))} quantities**, **{fmt(s.get('clean_year',0))} year-shaped tokens**, **{fmt(s.get('clean_date',0))} dates**, and **{fmt(s.get('clean_mixed',0))} changes between categories**. Year-shaped means an ungrouped integer from 1000 through 2099 without a recognized following quantity unit; it is not a semantic guarantee.
- **{fmt(s['unsettled_figures'])} positions** qualify for the unsettled queue: at least two strict unflagged substitutions and either three distinct unflagged values or a return to an earlier value. **{fmt(s['figures_with_return'])} positions** have a return and at least two strict unflagged substitutions.
- The Winter War example is detected: **26 600 → 26662**, **2009-08-22 10:30:30 UTC**, revision **7215959**, editor **84.251.13.236**. Neither endpoint is flagged. Its exact-context preceding stay is **290.798125 days** and the successor's observed stay is **1829.256863 days**. These are not the total ages of the death-toll claim through every rewrite.

These are within-sample observations. “Standing” always means the dataset cutoff, **2026-10-01 10:59:12 UTC**, not the present calendar date.

### Size of quantity changes

Percent bins are disjoint. The tenfold row overlaps them. Digit patterns are separate descriptive classes, not proof of a typo. Dates and year-shaped tokens are excluded.

| Population | Classification | Band | Count | Share |
|---|---|---|---:|---:|
'''
for r in sizes:text+=f"| {r['population']} | {r['classification']} | {r['band']} | {fmt(r['count'])} | {100*r['share']:.2f}% |\n"
text+='''
### How long the figures stood

These are observed stay lengths, not Kaplan–Meier estimates. A censored new stay has only a lower bound on its eventual duration. Changes are the unit of analysis, so recurrent positions can contribute repeatedly.

| Population | Side | n | Median observed days | Right-censored |
|---|---|---:|---:|---:|
'''
for r in d:text+=f"| {r['population']} | {r['side']} | {fmt(r['n'])} | {r['median_observed_days']:.2f} | {fmt(r['censored'])} |\n"
text+='''
Full duration bins are in [durations.json](data/durations.json).

### Who changes numbers

“Value standing” allows a later return of the same value in the same slot and exact nonnumeric text skeleton. “Unbroken” requires the new continuous stay to reach cutoff. These measures undercount semantic survival through prose rewrites. Account type is not a quality judgment; no adjustment for edit year or topic is made.

| Population | Editor | Changes | Value standing | Unbroken | Standing share |
|---|---|---:|---:|---:|---:|
'''
for r in eds:text+=f"| {r['population']} | {r['editor']} | {fmt(r['n'])} | {fmt(r['value_standing'])} | {fmt(r['uninterrupted_new_stay_at_cutoff'])} | {100*r['standing_share']:.2f}% |\n" if r['n'] else f"| {r['population']} | {r['editor']} | 0 | 0 | 0 | — |\n"
text+='''
### The 25 least settled positions

Ranked by distinct unflagged values, then strict unflagged substitutions. Other simultaneous numeric changes can appear in the value history but are not counted as strict substitutions. Returns can span intervening prose rewrites or gaps; they are not necessarily consecutive edit wars. The quantity-only counterpart is [unsettled-quantities.json](data/unsettled-quantities.json). Each value interval, date, editor and revision is in [unsettled.json](data/unsettled.json). “Flips” below means strict substitutions, not every transition in that broader timeline.

| Rank | Article | Kind | Distinct values | Flips | Returns |
|---|---|---|---:|---:|---:|
'''
for i,r in enumerate(top,1):text+=f"| {i} | {r['article']} | {r['kind']} | {r['distinct_values']} | {r['flips']} | {r['returns']} |\n"
text+='''
### Manual audit

I read the earliest strict unflagged substitution in each of the top 20 figures: the before and after sentences, both edit summaries, and the paragraph wikitext. These are research-agent judgments, not an independent human audit. I did not read outside sources or all transitions in each timeline. A source present in wikitext does not verify its contents. Labels apply only to the displayed change. No other cases are manually classified.

'''
counts=collections.Counter(r['classification'] for r in audit)
text+='Audit labels: '+', '.join(f'{n} {label}' for label,n in sorted(counts.items()))+'. No reviewed change is classified as a source dispute or surviving vandalism. This is not a random sample.\n\n'
for r in audit:
 text+=f"#### {r['rank']}. {r['article']}: {r['old']} → {r['new']}\n\nBefore: {r['before']}\n\nAfter: {r['after']}\n\nOld summary: {r['old_comment'] or '(empty)'}\n\nNew summary: {r['comment'] or '(empty)'}\n\n**{r['classification']}** — {r['reason']}\n\nEvidence: [revision {r['rev_id']}](https://fi.wikipedia.org/?oldid={r['rev_id']}), {r['at']} UTC.\n\n"
text+='''## How it was measured

Run from the repository root, sequentially:

```sh
uv run labs/numbers-that-moved/run.py
uv run labs/numbers-that-moved/audit.py
uv run labs/numbers-that-moved/core_audit.py
uv run labs/numbers-that-moved/validate.py
uv run labs/numbers-that-moved/publish.py
uv run labs/numbers-that-moved/report.py
```

`run.py` resumes completed compressed chunks. To repeat the extraction from source, remove only `labs/numbers-that-moved/cache/*.json.gz` and `labs/numbers-that-moved/cache/audit-input.json`, then run the commands again. To recompute outputs from the cache without database reads: `uv run labs/numbers-that-moved/run.py report`. Manual labels are retained in `audit-labels.json`; they must be reviewed if the selected cases change. The Winter War evidence can be reproduced with `uv run labs/numbers-that-moved/evidence.py`.

One connection reads 100 current page IDs per range, then their edit metadata and all historical prose rows. It streams the SQL result and holds only that chunk in Python. All prose lengths are eligible, but the nonnumeric surrounding text must contain at least one letter. Pure numeric map fragments are excluded. Slots equal to zero and nonpositive intervals are excluded. No giant history join, core writes, core indexes, external network requests or servers are used. The only database write is the tiny summary table in `lab_numbers_that_moved`. Extracted candidate evidence is cached locally; full revision text is never selected.

Number rules:

- Grouped thousands accept ordinary, no-break and narrow no-break spaces: `26 662`, `26 662`, `26 662`. Decimal comma is parsed as a decimal separator. Signs are retained. Formatting-only numeric equivalence does not count.
- Full numeric dates (`13.3.1940`) and Finnish day/month/year expressions (`13. maaliskuuta 1940`) are single date tokens, normalized to year-month-day. The twelve Finnish partitive month names are supported. A date change is not a percentage change.
- Standalone, ungrouped four-digit values in 1000–2099 are **year-shaped**, a transparent heuristic. Recognized following Finnish units (including people, inhabitants, soldiers, currency, distance and percent) override this to quantity. Other quantities of that shape can still be misclassified. Years outside that range, partial dates, clock times, identifiers and ranges need more contextual parsing. Spelled-out numbers are excluded. A token embedded after a letter is not recognized.
- Literal text outside numeric tokens must match exactly, including whitespace and punctuation. Exactly one numeric value and one surface-form token may differ. All other numbers must have identical written forms. This excludes a number correction accompanied by any prose rewrite, even a small one.

Within page and nonzero slot, identical visible wordings are unioned across overlapping and touching rows, regardless of hash, duplicate or ordinal position. Only adjacent, touching, nonoverlapping wording stays qualify as direct changes. Neighbour overlaps are rejected conservatively. This avoids counting a moved block as a new numerical assertion. The transition revision is looked up by page and start timestamp, falling back to `born_rev` only when missing. Merged stays keep their first introducing edit.

The conservative clean population requires both introducing edits to have `reverted_by IS NULL`. It removes a flagged number and the repair transition back out of it. It does not fabricate an A → C substitution across a discarded B. The additional new-endpoint-only count makes that choice visible. This is an origin-based filter; it does not infer the correctness of unflagged versions or remove every second of exposure in a reverted whole-page version.

A figure position is `(page_id, slot, nonnumeric literal skeleton, numeric index)`. Other numbers may change over its timeline. For each value in that position, overlapping and touching intervals are unioned again. The old duration runs from the start of its containing union interval to the substitution. The new duration runs from the substitution to the end of its containing interval; values reaching cutoff are right-censored. Disjoint returns are listed separately, never bridged into a continuous lifetime. These are exact-context figure durations; substantial surrounding rewrites end observation even when the historical claim persists.

Size is `abs(new-old)/abs(old)`. The bins are below 1%, 1% through 10% inclusive, and above 10%; an old zero has its own denominator category. Tenfold means the ratio of the larger absolute nonzero value to the smaller is at least ten. A transposition shape swaps exactly two digit positions; a single-digit replacement shape differs at one position with unchanged digit length. Signs and decimal punctuation are ignored by this digit-shape screen. One inserted or deleted digit is a third shape class. None of these classes proves intent.

## The exact SQL

Every query is saved under [sql/](sql/). The only scan join is bounded by page ID:

```sql
SELECT p.page_id,p.slot,HEX(p.hash),p.born_rev,p.row_start,
       LEAST(p.row_end,'2026-10-01 10:59:12'),t.text
FROM passage FOR SYSTEM_TIME ALL AS p
JOIN passage_text AS t ON t.hash=p.hash
WHERE p.page_id BETWEEN %s AND %s AND t.kind='prose'
  AND p.row_start < '2026-10-01 10:59:12';
```

[edits.sql](sql/edits.sql) supplies timestamps, authors, comments and revert flags. [titles.sql](sql/titles.sql) reads only current page IDs and titles. [audit.sql](sql/audit.sql) reads the selected paragraph wikitext by hash. [database.sql](sql/database.sql) and [summary-store.sql](sql/summary-store.sql) create and populate only the lab database. The session timezone is set with `SET time_zone='+00:00'`. Normalization, temporal unions and aggregation are in [run.py](run.py); manual decisions are in [audit-labels.json](audit-labels.json).

## What did not work

Strict identity trades recall for interpretable evidence. It misses simultaneous wording corrections, paragraph splits and merges, and lineages that the inferred slot system fails to join. The same number in rephrased prose can survive while this lab records an endpoint. Do not label these endpoints as factual retractions.

A missing revert flag is not evidence that a number was accepted. Surviving mistakes, partial reverts and disagreements can remain. Year-shaped quantities and partial dates need semantic review before presenting quantity-only percentages as exact. Many leading “unsettled” figures are evolving population or infection counts and dates of statistical snapshots; repeated changes alone do not establish disagreement.

The core parser labels bare coordinate fragments in Kyllikki Saaren murha as prose. Two inspected positions are reproduced in [core-data-audit.json](data/core-data-audit.json). The Finnish numeric parser splits their period decimals into separate integers, creating absurd changes. The final surrounding-letter gate excludes these fragments. Decimal points within actual prose remain a parser limitation. No core data was repaired.

The first development pass kept `born_rev` as transition attribution and did not normalize zero-padded dates. It was discarded and rerun with timestamp-based edit attribution and normalized dates. Formatting-only changes and multi-number changes remain outside the strict headline count. A later pass added the surrounding-letter gate and quantity-unit override after the manual audit. Counts of skipped cases and structural anomalies are in [summary.json](data/summary.json).

## What the product should do with it

Show a “Numbers that changed” page with a default filter for quantities and unflagged transitions. Let readers switch to dates and years. Put old and new sentences, edit summaries, authors and revision links beside each change. A timeline should show gaps and censoring explicitly.

A reader marker can say “this number changed N times in otherwise identical prose.” It should open the evidence, not call the figure disputed. Use the manually reviewed labels only for those reviewed changes. Separate ordinary updates from possible source disagreements. Avoid editor rankings: the unadjusted survival shares mix topic, cohort, account age and parser coverage.
'''
(R/'README.md').write_text(text)
print('Wrote README.md')
