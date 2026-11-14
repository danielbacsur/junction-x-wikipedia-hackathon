# /// script
# dependencies = []
# ///
import pathlib,json
B=pathlib.Path(__file__).parent
load=lambda n:json.loads((B/'data'/f'{n}.json').read_text())['rows']
s=load('summary')[0];p=load('publication-sql-summary')[0];w=load('wait-overall')[1];c=load('candidates');ps=load('publication-summary')[0];a=load('audit');tim=load('timings');old=load('oldest-unsourced');integ=load('integrity')[0]
f=lambda x:f'{x:,.0f}'
text=f'''# Claims before sources

## The question

Can paragraph histories find claims that stood in Finnish Wikipedia before the publication of their first attached source? This lab measures sourcing chronology in the supplied 19,742-article history-of-Finland collection, ending 1 October 2026. It produces an editor review queue, never an allegation of citogenesis.

## What we found

- **{f(s['referenced_today'])} / {f(s['current_paragraphs'])} ({100*s['referenced_today']/s['current_paragraphs']:.2f}%)** current prose paragraphs of at least 80 characters contain an inline `<ref>` marker. Among these, **{f(s['born_with_reference'])}** were born with one and **{f(s['gained_reference'])}** gained one later.
- **{w['median']:,.2f} days** is the median elapsed wait among paragraphs that gained a reference; quartiles **{w['p25']:,.2f}–{w['p75']:,.2f} days**. Including born-referenced paragraphs, all three quartiles are zero. These are observed waits among currently referenced survivors, not an estimate for all paragraphs ever written.
- **{f(s['no_reference_today'])}** paragraphs currently have no inline reference. **{f(s['unsourced_5_years'])} / {f(s['unsourced_10_years'])} / {f(s['unsourced_15_years'])}** have slot origins at least 5 / 10 / 15 years old. Of these, **29,551 / 25,631 / 19,021** have never had a detected inline reference. **1,507** current unreferenced paragraphs had one earlier.
- **{f(p['parsed_n'])} / {f(p['references_n'])} ({p['parsed_pct']:.2f}%)** current reference occurrences have an explicitly parseable publication-year field. **72,606 (37.22%)** are unresolved named uses outside their paragraph. **29,893** current paragraphs contain at least one parsed date. Coverage is deliberately incomplete.
- Among parsed current references, publication year minus paragraph-origin year has **median −5 years**, quartiles **−28 to 0**. **5,455 (11.26%)** have positive gaps, **9,387** zero, **33,616** negative. These are all current references, not necessarily first references. Five parsed occurrences have future years beyond the snapshot; raw coverage retains these as data-quality failures, while candidate screening rejects years after attachment.
- **{ps['candidate_paragraphs']}** paragraphs pass the stricter first-reference screen; the [top 50](data/candidates.json) are ranked by observed elapsed wait. The longest is **{c[0]['wait_days']:,.2f} days ({c[0]['wait_days']/365.2425:.2f} years)**: Herman Klaunpoika Fleming, a 2006 paragraph cited to a 2025 magazine article in 2026.
- **6 later-source / 8 updated-claim / 1 human-look / 0 parser-error** is the top-15 audit mix. The later-source judgments are provisional, not certifications of historical truth or independence. **Zero cases establish circular sourcing.** One university page's alleged publication year remains unverified.
- **50/50 (100%)** sampled years faithfully match the explicit wikitext publication-date field (Wilson 95% interval **92.87–100%**). One is an impossible future year and one dates an archival act rather than demonstrably dating its online publication. This is field-extraction precision; actual source-publication precision and parser recall were not estimated.
- Among all newly observed prose slots, including those later removed, the born-with-inline-reference share is **0/2,560 in 2004**, **459/10,882 (4.22%) in 2006**, and **4,036/4,537 (88.96%) in partial 2026**. This measures the adoption of this inline syntax and paragraph composition, not the absence of bibliographies in early Wikipedia.

### Annual sourcing cohorts

Denominator: first observed slot wording is prose and has at least 80 characters. A slot is an inferred paragraph lineage, not a semantic claim. 2026 is partial; 2003 is included for reconciliation. The current-survivor alternative is in [surviving-sourcing-by-year.json](data/surviving-sourcing-by-year.json).

| Year | New prose slots | Born with inline reference | Share % |
|---|---:|---:|---:|
'''
for r in load('sourcing-by-year'):text+=f"| {r['year']} | {f(r['paragraphs'])} | {f(r['born_referenced'])} | {r['born_referenced_pct']:.2f} |\n"
text+='''
### Oldest currently unreferenced paragraphs

These are current excerpts and first observed slot dates, not a guarantee of uninterrupted residence or that the exact current wording is that old. Oldid links open the originating edit; the editor attribution is in the JSON. No inline reference does not imply no article-level source.

| Article | Slot first written (UTC) | Originating version | Current excerpt |
|---|---|---|---|
'''
for r in old:text+=f"| {r['title']} | {r['written']} | [{r['born_rev']}]({r['oldid']}) | {r['excerpt'][:180].replace('|','/').replace(chr(10),' ')}… |\n"
text+='''
## How it was measured

Run sequentially from the repository root:

```sh
uv run labs/claims-before-sources/run.py --extract
uv run labs/claims-before-sources/refine.py
uv run labs/claims-before-sources/check.py
uv run labs/claims-before-sources/parse.py
uv run labs/claims-before-sources/publication_sql.py
uv run labs/claims-before-sources/audit.py
uv run labs/claims-before-sources/validate.py
uv run labs/claims-before-sources/report.py
```

One database connection at a time; one heavy SQL statement at a time. Only `lab_claims_before_sources` is written, using the provided local root credentials; `wtt` is read-only throughout. No commits. Re-extraction rebuilds only this lab's tables. `run.py` without `--extract` reuses the heavy extraction, but reruns result and first-version tables; use the full sequence for a clean reproduction. Raw inputs live in ignored `cache/`; compact chart/review artifacts live in `data/`. SQL files contain the exact executed statements; timings are local wall-clock observations, not benchmarks. All quantities are computed by the supplied scripts; manual labels are frozen observations regenerated by `audit.py`, not re-audited automatically.

1. **Population:** current `passage` joined to `passage_text`, `kind='prose' AND chars>=80`. All 133,201 have positive slots; there are no duplicate `(page_id,slot)` entries in the current population. Historical slot origins are not restricted to 80 characters, avoiding a spurious late birth when a paragraph grows.
2. **Single wikitext scan:** materialize `hash,kind,chars,has_ref` for every wording in one set-based pass. Detection uses `<ref` followed by whitespace, `/` or `>`, so `<references>` is excluded. All subsequent wikitext reads are targeted hash joins. The marker counts self-closing named uses, bare references and full templates. It does not prove the reference supports every sentence. General bibliographies, external links, source templates without `<ref>`, or sources inherited from a neighboring paragraph are outside this definition. Targeted checks found zero `{{sfn` or `{{harv` substrings in the current unreferenced subset.
3. **Lifetimes:** extract all positive-slot histories; partition `(page_id,slot,hash,dup)`, use running maximum preceding end and cumulative island labels, then merge overlapping/contiguous rows. Including slot protects against silently conflating lineage reassignment. This reduces 1,419,241 physical rows to 1,364,007 stays. Origins are the earliest start within each slot; first reference is the earliest stay with a marker. A separate running-maximum pass across slot wordings identifies periods with no observed wording. Candidate screening excludes gaps before attachment; ordinary wait statistics remain elapsed calendar time and can contain gaps.
4. **Dates and authors:** attach `born_rev` to `edit.rev_id` for both first wording and first-reference wording. The current-population integrity check found zero timestamp mismatches or missing edits for either event. The before-version is the most recently started unreferenced stay spanning attachment. Both before and first-reference versions, plus the original version, have oldid links. Original author attribution is not authorship of every later word.
5. **Publication parser:** `mwparserfromhell` handles nested templates. Accept only explicit fields in Verkkoviite, Lehtiviite, Kirjaviite, Verkkolähde, Cite web/news/book/journal. Normalize field casing, spaces, hyphens and underscores. Priority: Ajankohta, Julkaistu, Päiväys, Date, publication-date, Vuosi, Year. Accept exactly one distinct four-digit year (1000–2099), including Finnish dotted dates, ISO dates, month-and-year strings and year-only values. Preserve the raw date and selected field. Do not infer years from URLs, titles, page numbers, Wayback dates, Viitattu or Luettu. Access-date strings are retained for inspection but do not replace observed attachment dates. Years before 1000 and dates outside the supported templates are not parsed. Full calendar dates are not normalized or validated; comparisons use year precision only.
6. **Reference unit:** one `<ref>` occurrence in a current paragraph, including repeated named uses; not a distinct publication. Resolve named references only when their definition is in that same paragraph and same wording. Cross-paragraph named definitions, short footnotes pointing to bibliographies and plain-text citation dates are left unresolved. This avoids borrowing a definition from a later revision but lowers sensitivity. Publication results are conditional on parseability and are not representative of all references. The parser audit checks year extraction, not whole-source metadata, date truth or source independence.
7. **Candidates:** currently referenced, first reference later than origin, at least one explicitly dated source in that first attachment batch with `origin year < publication year <= attachment year`; no observed slot gaps before attachment; selected source still occurs today by exact parsed URL (else title, else body); multiset word Dice overlap at least **0.80** for original→first referenced, immediate predecessor→first referenced, and first referenced→current. Tokenization is lowercase Unicode `\\w+`; Dice is twice the shared token-count sum divided by total token counts. This is lexical, not semantic: a death date or corrected year can pass easily. Filtering the 21,876 gained-reference paragraphs excludes 1,727 with observation gaps. In the remaining predecessor-eligible set there are 4,005 dated first-attachment occurrences, including 1,154 with a later publication year before the final overlap/persistence filters.
8. **Ranking:** descending elapsed days from slot birth to first attachment, then descending selected publication year, page ID and slot. One result per paragraph; when several sources arrive together, select the latest publication year and preserve all coattached references. The score is waiting time until attachment, not time until publication; year-only sources cannot support an exact publication-day waiting time. Earlier sources can be coattached with a later one. A currently referenced paragraph whose original source was replaced may be absent from this conservative queue.
9. **Statistics:** MariaDB performs temporal merging, slot event detection, coverage, yearly cohorts and interpolated `PERCENTILE_CONT` wait estimates. Python parses citations and calculates lexical overlap. Parsed occurrence facts are loaded into the lab database; MariaDB aggregates coverage, year-gap counts and quartiles. Python independently checks wait quantiles and denominator reconciliation. Right-censored never-referenced paragraphs are counted, not included as completed waits; no survival estimate is claimed.

### Manual audit of the top 15

I read all original, pre-reference and first-reference texts and selected citation wikitext. These are research-agent judgments, not an independent human editorial review. “Later better source for an old true claim” means consistent with ordinary later sourcing; unless noted, the outside publication was not read and historical truth/independence is not established. “Possible circular sourcing” is a review priority, not evidence that copying occurred.

| Rank | Article | Wait days | Classification | Reading and reason |
|---|---|---:|---|---|
'''
for r in a:
 note=r['rationale']
 if r['external_sources']:note+=' Sources checked: '+', '.join(f'[link]({u})' for u in r['external_sources'])+'.'
 text+=f"| {r['rank']} | [{r['article']}]({r['reference_oldid']}) | {c[r['rank']-1]['wait_days']:,.2f} | {r['classification']} | {note} |\n"
text+='''
The strongest illustration of a false-positive risk is the unchanged Data-Sitra anecdote: its 2017 retrospective has interviews and archival material listed explicitly, including records predating the Wikipedia paragraph. The most useful unresolved lead is the Laitaatsilta thesis, whose metadata was accessible but whose PDF returned 403; its cited page and bibliography must be examined before any provenance conclusion. The earthquake page supports the historical account but does not establish the template's claimed 2025 publication date. Live external checks are supplemental notes dated 14 November 2026 and may not represent the exact source version seen by the Wikipedia editor.

### Parser audit

Simple random sample of 50 parsed **current occurrences**, deterministic seed 20261114, selected from the initial SQL extraction order. The committed parser-sample-manifest.json freezes occurrence identities so reruns reproduce the same random sample independently of SQL row ordering. The frozen sample and all 50 individual decisions are in [parser-audit.json](data/parser-audit.json); the selected raw citation, same-paragraph definition body where needed, expected year, result and note are retained. Three sampled self-closing uses were checked against their definition bodies. All 50 selected years match explicit publication fields; zero came from access or archive dates. One source has `Ajankohta=6.5.2028` with access in 2026, one has a malformed `2001--01-24` full date, and one has the date of a 1918 archival act. The parser extracts those strings faithfully but cannot certify their publication semantics. Do not advertise 100% publication-date accuracy. Sampling occurrences gives frequently repeated sources more weight; uncertainty is not adjusted for article/source clustering.

## The exact SQL

The central source scan is:

```sql
CREATE TABLE flags AS
SELECT hash,kind,chars,
       (wikitext REGEXP '<ref([[:space:]/>])') has_ref
FROM wtt.passage_text;
```

The event definition is:

```sql
CREATE TABLE origins AS
SELECT page_id,slot,MIN(a) written,
       MIN(IF(has_ref,a,NULL)) referenced
FROM stays GROUP BY page_id,slot;
```

Every executed statement, including the window-function merging and quantiles, is linked below. Insert parameters for parsed dates are regenerated in `cache/citation-facts-input.json`. The import statement is parameterized; no core table is changed. Result-row counts are zero for DDL even when it materializes many rows. The initial extraction scans 1,630,250 wording rows; timing excludes neither decompression nor server work, but Python JSON serialization is outside the recorded query time.

| SQL statement | Wall seconds | Returned/imported rows |
|---|---:|---:|
'''
for r in tim:text+=f"| [{r['query']}](sql/{r['query']}.sql) | {r['seconds']:.4f} | {r['rows']} |\n"
text+='''
## What did not work

- **Chronology is not causality.** Most audited cases are old history being sourced later or new details being added. Paragraph overlap does not isolate the particular sentence supported by a citation. No outside copying is demonstrated.
- **Named-reference resolution is incomplete.** A full page-and-revision citation-definition resolver is the main missing capability. The 191 candidates are a reproducible conservative screen, not an estimate of how much circular sourcing exists. Bare bibliographic dates are intentionally not guessed.
- **Publication metadata is user-entered.** Five current parsed occurrences contain years after 2026. Full dates can be malformed; web update dates and archive-record dates can masquerade as publication dates. Template dates require publisher verification before escalation.
- **Lineage is inferred.** Paragraph splits, merges, large rewrites, earlier copies in another article, missing historical revisions and slot reassignment may make a first observed slot different from the first appearance of the claim anywhere. The candidate gate checks endpoint wording similarity and gap-free slot residence, not every intermediate wording or uninterrupted survival of each sentence.
- **Current-survivor selection and partial 2026 matter.** Current wait distributions cannot describe all historical sourcing behavior. The annual birth chart instead includes removed slots, but still depends on inferred slot creation and the syntax measured. Early zero inline-ref rates do not mean early articles had no sources.
- **Age is not continuous unsourced exposure.** The old-currently-unreferenced table includes 1,507 lineages with historical references elsewhere in the population; separate never-referenced counts are given. Age thresholds use 1 October 2026 UTC calendar anniversaries.
- **Access dates do not date attachment.** Nailonsukkamurhat's saved template reports access in 2023, while the observed attachment is in 2024. Copying citation templates and metadata typos defeat treating access fields as exact event timestamps.
- **Development fixes:** duplicate `title` keys in initial audit export caused a Python error; an ambiguous SQL join needed explicit aliases. Both were fixed. Adding observed `Nimike` and `www` aliases corrected metadata coverage and changed exact source-persistence matching from 193 to 191 candidates. Final outputs use the corrected parser; no source rows were changed.

## What the product should do with it

Show a **“Claim before source?” review queue** with three separate clocks: first observed paragraph, first inline reference, and declared publication date/precision. Put the original, immediately preceding, first-referenced and current wording side by side, with sentence-level changes highlighted. Expose the selected date field, exact reference wikitext, coattached sources and oldid links. Display authors as revision provenance, never misconduct scores.

Default to the conservative candidate filter and show audit labels beside the ranking. Explain that a long wait is not suspicious by itself; new death dates and location/year corrections should be easy to dismiss. The publication-date coverage denominator, unresolved named uses, provisional publication dates and partial-2026 labels must be visible. Distinguish “currently no inline reference” from “never had one” and “article has no sources.”

The next research step is historical page-level named-reference resolution, followed by sentence-level citation scope and verified source publication dates. For any proposed citogenesis case, a human must inspect the external source's provenance and earlier editions/archives. This lab supplies an investigation queue and a measured limit on automation.
'''
(B/'README.md').write_text(text)
print('README written',len(text))
summary=json.loads((B/'data/summary.json').read_text())
summary['source']='wtt snapshot 2026-10-01; run.py, publication_sql.py, parse.py, audit.py; README definitions'
summary['rows'][0].update(publication_reference_occurrences=p['references_n'],publication_year_parsed=p['parsed_n'],publication_year_parsed_pct=float(p['parsed_pct']),candidate_paragraphs=ps['candidate_paragraphs'],top_candidates_delivered=len(c),gained_wait_p25_days=w['p25'],gained_wait_median_days=w['median'],gained_wait_p75_days=w['p75'],top15_audit_mix=load('audit-summary')[0]['mix'],parser_year_field_precision_pct=100,confirmed_circular_sourcing=0)
(B/'data/summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
