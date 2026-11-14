# /// script
# dependencies = []
# ///
import json,pathlib
P=pathlib.Path(__file__).parent
def rows(n):return json.loads((P/'data'/f'{n}.json').read_text())['rows']
s=rows('summary')[0];d=rows('delay-distribution')[0];v=rows('survival')[0];e=rows('event-summary')[0];b=rows('birth-summary')[0];co=rows('corroboration')[0]
def table(headers,values):
 def esc(v):return str(v).replace('|','\\|').replace('\n',' ')
 return '| '+' | '.join(headers)+' |\n|'+'|'.join(['---']*len(headers))+'|\n'+'\n'.join('| '+' | '.join(map(esc,r))+' |' for r in values)+'\n'
text=f'''# Sentence journeys

## The question

Where does a paragraph travel within the recorded histories of 19,742 Finnish Wikipedia articles? Measure exact paragraph reuse, bulk transfer candidates, survival, and repeated sentences. **First observed here is neither authorship nor first appearance on all Wikipedia.** “Source” below is chronological shorthand, not a proven copying source.

## What we found

- **{int(s['shared']):,} of {s['prose_wordings']:,} ({100*s['shared']/s['prose_wordings']:.3f}%)** qualifying prose hashes ever appear in at least two articles; **{int(s['five_plus'])}** reach five, **{int(s['twenty_plus'])}** reach twenty. **{int(s['current_shared'])}** stand in multiple articles at the dataset endpoint.
- **{d['median_seconds']/86400:.2f} days** is the median first-to-second delay; quartiles **{d['q25_seconds']/86400:.3f} and {d['q75_seconds']/86400:.2f} days**. **{100*d['within_hour']:.2f}%** spread within an hour, **{100*d['within_day']:.2f}%** within a day, **{100*d['within_year']:.2f}%** within 365 days. No tied first timestamps.
- **{e['events']} bulk transfer candidates**, with at least five qualifying wordings arriving in one destination revision from one earlier article: **{int(e['move_events'])}** have at least five near-synchronous removals; **{int(e['copy_events'])}** have at least five retained source wordings. These classifications can overlap or leave mixed events unclassified. The largest is **86 paragraphs**, Sortovuodet → Ensimmäinen sortokausi, 2009-03-07, comment “siirto tänne”. **{int(co['either_comment_matches'])}/{co['events']}** have transfer-related wording in a destination or near-removal source comment; **{int(co['destination_comment_matches'])}** in the destination comment alone.
- **{b['any_reused_at_birth']} articles ({100*b['any_reused_at_birth']/s['articles']:.2f}%)** contain at least one qualifying paragraph at their first recorded edit that was observed earlier in another sampled article; **{int(b['five_reused_at_birth'])}** contain at least five. This is evidence of text reuse at recorded birth, not proof of a split or true page creation.
- **{int(v['destination_outlives']):,} destinations outlast their first-observed source, versus {int(v['source_outlives'])} sources**, among **{v['overlapping_first_second']:,}** first/second pairs whose source still contains the text at destination arrival. **{int(v['both_censored'])}** pairs remain in both and cannot be ranked. Among **{int(v['eligible_year']):,}** pairs with a full year of follow-up, **{100*v['destination_survives_year']/v['eligible_year']:.2f}%** survive unchanged in the destination versus **{100*v['source_survives_year']/v['eligible_year']:.2f}%** in the source.

### Spread distribution

'''
text+=table(['Articles ever','Wordings','Of those, currently in ≥2'],[[x['articles'],x['wordings'],int(x['currently_shared'])] for x in rows('spread-distribution')])
text+='\n### Boilerplate and two additional findings\n\n'
sent=rows('boilerplate-sentences');lists=rows('list-scale')[0];clean=rows('same-reading-text')[0];con=rows('event-concentration')[0]
text+=f'''The leading sentence-like span is observed in **{sent[0]['articles']} articles**: “{sent[0]['sentence']}”. Sentence extraction is a separate reading-text analysis, not the paragraph-hash headline population. The top examples below show what actually repeats; hundreds-of-articles sentence reuse is not assumed.

'''
text+=table(['Articles','Sentence-like span'],[[x['articles'],x['sentence']] for x in sent[:10]])
text+=f'''
List items repeat much more widely: **{int(lists['shared']):,}** shared list hashes, **{int(lists['twenty_plus'])}** in at least twenty articles, maximum **{lists['max_articles']}**. “Jääkärimerkki” occurs under one hash in **482** articles. Repeated military decorations and bibliography entries dominate the block-level ranking. A nominal prose hash with empty cleaned text appears in **1,900** articles: a parser/markup artifact, not a repeated sentence. Raw blocks remain in [boilerplate.json](data/boilerplate.json); sentence results are in [boilerplate-sentences.json](data/boilerplate-sentences.json).

**Finding: identical reading text can have different hashes.** The **{clean['hashes']}** shared hashes collapse to **{clean['clean_texts']}** distinct exact clean strings. Inspection of `packages/ingest/passages.ts` shows SHA-1 truncated to eight bytes hashes the original block before cleaning. Markup-only changes can end a hash lifetime without changing what a reader sees. The top substantive evacuation paragraph has two clean-text-identical hashes travelling through eleven and nine articles, but only thirteen distinct articles in their union (see `evacuation-reading-text.json`); these are not independent ideas or proof of two separate copying campaigns.

**Finding: bulk restructuring accounts for much of exact reuse.** **{con['shared_wordings_in_bulk_events']} of {int(s['shared'])} shared hashes ({100*con['shared_wordings_in_bulk_events']/s['shared']:.1f}%)** participate in at least one five-paragraph transfer candidate. This supports a bulk-transfer explorer more strongly than a universal plagiarism detector.

### Thirty largest transfer candidates

“Moved” means source absence begins within ±1 hour of destination arrival; “retained” means source presence continues beyond that hour. A copied paragraph can be removed days later. Current titles label historical pages. Source removal editor/comments, where available, are also preserved in the JSON.

'''
text+=table(['Source → destination','UTC / revision','Paragraphs','Moved / retained','Destination editor','Destination comment'],[[x['source']+' → '+x['destination'],f"[{x['at']}]({x['link']})",x['paragraphs'],f"{int(x['moved'])} / {int(x['retained'])}",x['editor'],x['comment']] for x in rows('splits-and-merges')])
text+='\n### Thirty substantive journeys\n\nRanked by articles descending, then stored chars descending and hash. The explicit exclusions remove chart instructions, bibliography, table/navigation debris and repetitive noise; headline numbers retain all qualifying hashes. This is an editorial display screen, not a claim that `kind=prose` guarantees substantive writing. Separate hash variants remain separate. Full paths, editor metadata and excerpts are in [top-journeys.json](data/top-journeys.json).\n\n'
for i,x in enumerate(rows('top-journeys'),1):
 text+=f"**{i}. {x['articles']} articles · `{x['hash']}`**\n\n{x['excerpt']}\n\n"+' → '.join(f"[{z['title']}]({z['link']}) ({z['first_at']} UTC)" for z in x['path'])+'\n\n'
text+='''## How it was measured

Run sequentially from the repository root (no parallel execution):

```sh
uv run labs/sentence-journeys/run.py
uv run labs/sentence-journeys/extra.py
uv run labs/sentence-journeys/validate.py
uv run labs/sentence-journeys/report.py
```

Only `lab_sentence_journeys` is written. One connection per script, using the supplied local root credential to access the lab database. All source tables are read-only. No commits. The scripts regenerate their SQL files and chart JSON. `run.py --reports` reruns reports without rebuilding derived tables. Rerunning against changed core data changes results. Timings are local wall-clock observations under shared load, not a benchmark.

1. **Headline unit:** distinct eight-byte hash with `passage_text.kind='prose' AND chars>=120` and at least one recorded passage row. Characters use the supplied column; clean text, raw markup and character counts are not interchangeable. No inference of originality or copying intent. No near-match or sentence-level reuse included in these headline counts.
2. **Time:** UTC, half-open `[row_start,row_end)` lifetimes. Running maximum preceding end, then cumulative island grouping, merges touching/overlapping rows of `(page_id,hash,dup)`. A second union across duplicates measures presence anywhere in the page. This avoids falsely treating reorderings or disappearance of one duplicate as paragraph death. Ends beyond 2100 are the system-versioning sentinel, not observed survival into the future. The administrative cutoff is the maximum edit timestamp, **2026-10-01 10:59:12 UTC**.
3. **Firsts:** one earliest presence per hash/article. The earliest two articles define delay and paired survival. Stable page-ID ordering would break simultaneous timestamps, but no first/second ties occur. Paths list first observations, not every reintroduction. The earliest interval’s `born_rev` links the edit that introduced the hash. Titles are current, not historical.
4. **Transfer events:** for each destination’s first appearance of a shared hash, find every distinct earlier article whose presence began strictly earlier and ended no earlier than one hour before arrival. Group by source, destination and destination revision; require five distinct hashes. This requires no row-by-row SQL. Five reduces coincidental repeated sentences while still finding modest section transfers. Arrivals must be in the same revision, a stricter requirement than a one-hour arrival cluster. Events are candidates: several earlier sources can qualify. No claim is made that every bulk copy is a split or every move a merge. Source disappearance is local to the selected lifetime, not permanent deletion; reintroductions are allowed.
5. **Comments:** case-insensitive regex `siirr|siirt|yhdist|kopio|jaett|jakami|eriyt|split|merg|mov|cop` on destination introduction and matching source removal edits. This counts lexical corroboration, not manually certified intent. False positives and missed synonyms remain; absence of a matching comment is not disproof. Editor identifiers report metadata and are not authorship assignments.
6. **Birth:** first saved timestamp in the available edit table. Count qualifying hashes present then whose global-within-sample first time is strictly earlier. Five-hash birth counts may include more than one earlier article. Historical imports, deleted revisions and missing out-of-sample pages can alter interpretation.
7. **Survival:** first/second pairs only; exclude source already absent at destination arrival. Compare the uninterrupted presence interval containing that arrival with the destination’s first interval. Both censored pairs are unresolved; one censored and one ended pair is already orderable. No lifespan means or Kaplan–Meier estimate is claimed. One-year survival uses the same origin and excludes arrivals less than 365 days before cutoff. A wording change, including markup-only change, ends exact-hash survival. Pair observations are dependent within editing campaigns.
8. **Sentences:** Python splits every distinct prose clean text after `. ! ?` followed by whitespace and an uppercase Latin/Finnish letter; whitespace is collapsed, case retained. Keep terminal-punctuation spans of 40–1,000 characters. SHA-1 identifies these extracted strings. SQL joins the sentence map to distinct `(hash,page_id)` history pairs and counts distinct articles. This avoids counting repeated revisions as spread. Finnish abbreviations and quotations can mis-segment; these are explicitly sentence-like spans. Short lines, list items and template expansions are separate, so this is not a comprehensive linguistic sentence census.
9. **Validation:** `validate.py` independently unions all raw intervals for shared wordings in Python and compares every resulting page interval with SQL; direct current-table aggregation checks the current shared count. Integrity checks cover negative/zero durations, missing born revisions, birth timestamp/page mismatches and negative delays. Results are in [validation.json](data/validation.json), [integrity.json](data/integrity.json), and [edge-audit.json](data/edge-audit.json). No source data were repaired.

Threshold sensitivity (same event definition):

'''
text+=table(['Minimum paragraphs','Events'],[[x['threshold'],x['events']] for x in rows('threshold-sensitivity')])
text+='\nRemoval-window sensitivity among baseline candidate edges (does not add sources removed more than one hour before arrival):\n\n'+table(['Removal window, hours','Events with ≥5 removals'],[[x['hours'],x['events']] for x in rows('window-sensitivity')])
text+='''
## The exact SQL

Every statement is saved verbatim in [sql/](sql/); the complete execution sequence and timings are in [timings.json](data/timings.json). The primary analytical method is MariaDB: temporal history scans, window-function interval unions, distinct-article counts, `PERCENTILE_CONT`, temporal joins and grouped event detection. Python orchestrates SQL, segments text, checks interval unions and renders this report. Parameterized sentence inserts are generated by the reproducible `extra.py` mapping, with batch timing recorded separately.

Core SQL examples (full executable statements in linked files):

'''
for n in ['raw','lifetimes','presence','pairs','delay-distribution','edges','events','survival','sentence-counts']:
 text+=f'[{n}.sql](sql/{n}.sql)\n\n```sql\n'+(P/'sql'/f'{n}.sql').read_text()+'```\n\n'
last={x['query']:x for x in rows('timings')}
text+=table(['Statement (last execution)','Seconds','Returned rows'],[[f"[{n}](sql/{n}.sql)" if (P/'sql'/f'{n}.sql').exists() else n,r['seconds'],r['rows']] for n,r in last.items() if not n.startswith(('drop-','use','database','timezone','extra-use','extra-zone','validate-use','validate-zone'))])
text+='''
## What did not work

- Validation caught three source edges with a near-removal followed by a qualifying reintroduction. Move classification now uses the latest qualifying source interval end; the final edge audit has zero such inconsistencies.
- The premise of long exact paragraphs spreading to hundreds of articles is not supported here. Short decorations and bibliography entries spread far more widely. A short-list or empty-clean-text leaderboard would misrepresent paragraph journeys.
- `kind='prose'` includes table debris, navigation, repeated noise and empty cleaned strings. The requested length filter removes empty strings but not all artifacts. Only the displayed top thirty are screened; headline population is reproducible and unfiltered beyond the specified definition.
- Hash identity is stricter than reading-text identity. Equal cleaned paragraphs can have different hashes because underlying wikitext differs. The lab does not silently collapse these identities; sentence analysis is explicitly separate.
- The first birth-summary query used large unindexed joins and was cancelled after roughly 27 seconds while running. It was replaced by a small join of the shared-hash ranked table (the saved `birth-summary.sql`). Its interrupted run has no completed timing. All completed statements are recorded.
- Chronology cannot determine which of several earlier articles supplied a copy, distinguish independent use of a common source, or detect paraphrase. A move within an hour is a temporal signal; retained text can be removed later. Imported history and missing articles are unobserved.
- Full-history ranks pool differently aged articles. Current-row counts describe the recorded endpoint, not live Wikipedia today. The cutoff censors survival; historical identifiers and current titles need not reflect current account names or titles at the event.

## What the product should do with it

Show an **“Observed text journey”** with a chronological path of article titles, first-seen dates, revision links and lifetime bars. Label it “first observed in this collection.” Expose hash identity versus reading-text identity and explicitly mark right-censored bars. Show the source and destination together from the arrival time, including later reintroductions.

Offer a **bulk-transfer explorer** ranked by qualifying paragraph count, with the one-hour/five-paragraph thresholds visible, moved and retained counts, both sides’ comments and revision links. Call entries candidates until a reader inspects the history. Highlight the Sortovuodet split as a clear comment-supported example. Allow thresholds to change without implying that a copy establishes authorship.

Keep boilerplate and parser artifacts in separate views. Default the journey gallery to the screened substantive examples, while preserving raw counts and exclusions for audit. Never label an editor a plagiarist from this evidence. Charts can consume the six requested JSON objects plus sentence, survival and validation supplements directly.
'''
text=text.replace('- The first birth-summary query', '- MariaDB became unavailable after the main analyses. Docker reported `OOMKilled=true`, exit 137, at 2026-11-14 11:53:10 UTC. The existing container was restarted; crash recovery finished and the independent validation pass then completed. The cause cannot be assigned to one job on this shared laptop.\n- The first birth-summary query')
(P/'README.md').write_text(text)
summary=json.loads((P/'data/summary.json').read_text())
summary['rows'][0].update(delay=d,transfers=e,birth=b,survival=v,comment_corroboration=co,bulk_reused_wordings=con['shared_wordings_in_bulk_events'],top_sentence_articles=sent[0]['articles'])
summary['unit']='counts, seconds and proportions'
summary['source']='sql/summary.sql; sql/delay-distribution.sql; sql/event-summary.sql; sql/birth-summary.sql; sql/survival.sql; sql/corroboration.sql; sql/event-concentration.sql; sql/boilerplate-sentences.sql'
(P/'data/summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
boiler=json.loads((P/'data/boilerplate.json').read_text())
blocks=[x for x in boiler['rows'] if 'text' in x]
boiler.update(title='Repeated sentences, list items and raw block artifacts',source='sql/boilerplate.sql; sql/boilerplate-sentences.sql',unit='distinct articles',rows=[dict(category='sentence_like_span',**x) for x in sent]+[dict(x,category='raw_block') for x in blocks])
(P/'data/boilerplate.json').write_text(json.dumps(boiler,ensure_ascii=False,indent=2)+'\n')
print('Wrote README.md')
