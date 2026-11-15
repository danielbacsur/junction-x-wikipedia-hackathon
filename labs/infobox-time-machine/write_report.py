# /// script
# dependencies = []
# ///
import json,collections
from pathlib import Path
B=Path(__file__).resolve().parent
D=lambda n:json.loads((B/'data'/n).read_text())['rows']
c=D('coverage.json')[0];s=D('shape.json')[0];l=D('load.json')[0];v=D('validation.json')[0];a=D('all-version-coverage.json')[0];times=D('query-timings.json');idx=D('index-experiment.json');rates=D('change-rates.json');audit=D('manual-audit.json');changed=D('changed-dates.json')
common=[r for r in rates if r['observations']>=1000 and r['field_slots']>=50]
def table(headers,rows):return '\n'.join(['| '+' | '.join(headers)+' |','|'+'|'.join(['---']*len(headers))+'|']+['| '+' | '.join(str(x).replace('|',' / ').replace('\n',' ') for x in row)+' |' for row in rows])
text=f'''# Infobox time machine

## The question

What can a reader or editor ask when infobox fields become MariaDB rows,
with Wikipedia's actual edit times as system time?

## What we found

**{s['statements']:,} field lifetimes, from {c['articles_read']:,} articles scanned.
{s['date_change_events']:,} continuous changes of a parsed birth or death date,
across {s['date_articles_changed']:,} articles.** These are statements in article
source, not independently verified facts or a complete reconstruction of the
rendered infobox.

{table(['Measure','Result'],[
('Parquet versions read',f"{c['versions_read']:,}"),
('Versions skipped using core reverted_by',f"{c['reverted_versions_skipped']:,}"),
('Accepted versions',f"{c['accepted_versions']:,}"),
('Versions with a recognized infobox, before filtering',f"{a['with_recognized_infobox']:,}"),
('Accepted versions with a recognized infobox',f"{c['accepted_versions_with_recognized_infobox']:,}"),
('Articles with a recognized infobox',f"{c['articles_with_recognized_infobox']:,}"),
('Named field observations, including empty',f"{c['fields_parsed_including_empty']:,}"),
('Nonempty field observations',f"{s['observations']:,}"),
('Raw-value lifetime rows',f"{s['statements']:,}"),
('Distinct field names / template names',f"{s['distinct_fields']:,} / {s['distinct_templates']:,}"),
('Distinct article/template/instance/field slots',f"{s['field_slots']:,}"),
('Mean / median lifetimes per field slot',f"{s['lifetimes_per_field_slot']:.2f} / {s['median_lifetimes_per_field_slot']:.1f}"),
('Mean repeated observations per lifetime',f"{s['observations']/s['statements']:.2f}"),
('Extraction wall time',f"{c['parse_seconds']:.2f} s"),
('MariaDB load wall time',f"{l['load_seconds']:.2f} s"),
('Table data + index allocation',f"{l['data_bytes']+l['index_bytes']:,} bytes ({(l['data_bytes']+l['index_bytes'])/2**20:.2f} MiB)"),
('Current statement rows',f"{l['current_rows']:,}"),
('Continuous raw A → B → A returns',f"{s['raw_aba']:,}"),
])}

The full corpus was scanned. This is not a most-edited-article sample.
Recognition is bounded by `templates.json` plus names beginning with
`tietolaatikko` or `infobox` without a slash. The list is based on a corpus
survey, not historical template definitions. Infoboxes nested inside other
templates, handmade tables, unknown aliases, and facts supplied solely by
Wikidata or template expansion are outside coverage. An empty result is
**no extracted statement**, not proof that Wikipedia lacked the information.

The manual read below classifies fifteen examined field cases as apparent
corrections and one as a format conversion with a transient error. This is
sixteen field cases in fifteen articles, selected for extreme shifts. The
large shifts often come from missing year digits or a death date placed in
a birth field. They are not evidence that historians revised a biography.

### Which fields move

Among fields with at least 1,000 observations and 50 distinct field slots,
the largest counts of direct replacements are:

{table(['Field','Replacements','Clean-value changes','Raw-only changes','Per 1,000 observations'],[(r['field'],r['direct_replacements'],r['clean_changes'],r['raw_only_changes'],f"{r['changes_per_1000_observations']:.2f}") for r in sorted(common,key=lambda x:-x['direct_replacements'])[:10]])}

The lowest measured replacement rates in the same group are:

{table(['Field','Field slots','Replacements','Per 1,000 observations'],[(r['field'],r['field_slots'],r['direct_replacements'],f"{r['changes_per_1000_observations']:.3f}") for r in sorted(common,key=lambda x:x['changes_per_1000_observations'])[:5]])}

These rates are per saved observation, not per year. They depend on editing
frequency. A low rate does not certify accuracy.

### How long values stand

The twenty most frequently observed field names are ranked by nonempty
version-level observations. Durations below include only completed
lifetimes. Current rows are right-censored and excluded from quantiles.
Changes of markup, references, and spelling can close a raw lifetime.
Disappearance, an unreadable box, or a template migration can also close it.
This measures extracted-statement persistence, not time until a factual correction.

{table(['Field','Completed','Current/censored','Median days','90th percentile days'],[(r['field'],r['closed'],r['right_censored'],f"{r['median_days']:.2f}" if r['median_days'] is not None else '—',f"{r['p90_days']:.2f}" if r['p90_days'] is not None else '—') for r in D('durations.json')])}

### Birth and death dates

There are {s['date_change_events']} direct full-date replacements across
{s['date_fields_changed']} article/template/instance/field slots. Absolute
Gregorian day differences are binned as follows. “Month” and “year” here are
bounded day ranges, not claims about the editor's intention.

{table(['Absolute shift','Events'],[(k,s['date_shift_bins'].get(k,0)) for k in ('1 day','2–31 days','32–365 days','>365 days')])}

The twenty-five slots with the largest single shifts are listed below;
ties use change count then page id. `data/changed-dates.json` contains each
slot's complete extracted timeline, raw values, editors, revision ids,
edit summaries and periods, including unreadable intervals.

{table(['Article','Field','Changes','Largest shift in days'],[(r['title'],r['field'],r['changes'],r['max_absolute_days']) for r in changed])}

### Manual read: evidence and interpretation

I read the largest transition in each of the first sixteen entries (fifteen distinct articles), with
the before, after, and next field-lifetime revision when available. The read
covered the infobox value, edit summary, and lead excerpts.
Full local source is retained in `cache/audit-source.json`; reproducible
excerpts are in `cache/audit-reading.txt`. I did not consult external sources,
talk pages, or every intermediate edit. Classifications describe that limited
read and cannot establish the historically correct date.

{table(['Article / field','Classification','Reason'],[(r['title']+' / '+r['field'],r['classification'],r['reason']) for r in audit])}

Class counts: {dict(collections.Counter(r['classification'] for r in audit))}.
This is a deliberately extreme, nonrandom sample. No classification is
extrapolated to the rest of the corpus. “Correction” means the local evidence
suggests a repair, not that the replacement date has been verified.

### MariaDB finding

On MariaDB {v['server_version']}, the same article-as-of query took
{idx[0]['median_ms']:.3f} ms with `FORCE INDEX (article_asof)` and
{idx[1]['median_ms']:.3f} ms with `IGNORE INDEX (article_asof)` (seven runs each).
The index is `(page_id,row_end,row_start)`. `EXPLAIN` is recorded in
`data/index-experiment.json`. This is one article and one date on a shared,
warm server; it is not a claim about all historical selectivity patterns.

`SHOW CREATE TABLE` also shows MariaDB adding `row_end` to the primary key.
The declared `PRIMARY KEY(id)` becomes `(id,row_end)`. A lifetime id is an
import identity, not a cross-history uniqueness constraint. The separate
integrity query checks logical-field period overlap.

Current rows omit `row_end` on insertion. The observed current sentinel is
`{v['current_end_sentinel'][0]}`. Hardcoding the old 2038 timestamp would turn
current facts into historical rows on this server. Historical rows supply
both endpoints under `SET SESSION system_versioning_insert_history=1`.

## How it was measured

Run from the repository root. Only this lab folder and database are written.
`uv` installs the inline Python dependencies. No server or external API is used.

```sh
uv run labs/infobox-time-machine/survey.py
uv run labs/infobox-time-machine/test_parser.py
uv run labs/infobox-time-machine/recognition.py
uv run labs/infobox-time-machine/build.py
uv run labs/infobox-time-machine/analyze.py
uv run labs/infobox-time-machine/load.py
uv run labs/infobox-time-machine/verify.py
uv run labs/infobox-time-machine/benchmark.py
uv run labs/infobox-time-machine/audit_context.py
uv run labs/infobox-time-machine/audit.py
uv run labs/infobox-time-machine/write_report.py
uv run labs/infobox-time-machine/report.py
```

`load.py` rebuilds **only** `lab_infobox_time_machine.statement`. Root is used
only for database creation and grants. All table work uses `wtt`. The loader
checks Docker memory before it starts; above 6.5 GiB it exits without loading,
and must be rerun after memory falls. Inserts commit in batches of 500.
There is at most one active database connection in each script. Run the steps
sequentially as above. No global server settings or core tables are changed.
The table remains available for the product.

All measurement JSON has `title`, `unit`, `source`, and `rows`. `report.py`
prints the measurements; `write_report.py` regenerates this README from them.
`audit_notes.json` is the manual interpretation input. Rebuilding extracts
cannot recreate human judgement; `audit.py` validates its revision ids and
joins it to reproducible source evidence.

**Source and ordering.** Parquet fields `page_id`, `title`, `rev_id`, `user`,
`comment`, and `text` supply the source. `wtt.edit` supplies `saved_at`,
`editor` and `reverted_by`. Reverted versions are skipped entirely. The
preceding accepted statement continues across skipped edits. This is the
standing-revert-filtered history, not a literal snapshot of every edit ever
served. Revisions are streamed in the dataset's article order; split article
blocks are rejected. All SQL times are UTC. Core saved_at is used because
the core loader already separates same-second revisions by microseconds.

**Parsing.** A balanced scanner protects comments, reference tags and literal
markup. It handles double and triple braces. `mwparserfromhell` splits named
parameters while respecting nested templates, links, and tags. Multiple
infoboxes are identified by normalized template name and occurrence number.
Reordering equal-name boxes can change that identity. Parameter names retain
case. Template names are lowercased and underscores become spaces; template
redirects are not resolved. Duplicate parameters use the last value.

Raw values retain their internal markup; outer whitespace is stripped.
Cleaned values drop references, comments and presentation markup and retain
link labels. Unexpanded templates are shown with `⟦...⟧` markers and an
`unresolved` flag. Cleaned text is a readable approximation, not MediaWiki
rendering. Nonempty raw fields produce rows; blank fields do not.

**Collapsing.** A logical field is `(page_id,template,slot,field)`. Exact raw
value equality merges consecutive accepted observations. A row records the
first revision/editor, repeat count, and the first accepted timestamp that no
longer extracts that raw value. Raw reference-only changes remain visible.
`change-rates.json` separates replacements where the cleaned value changed
from raw-only changes. Typed-date comparisons ignore formatting changes.

**Typed-parser outcomes on raw field lifetimes:**

{table(['Outcome','Lifetimes'],list(c['typed_lifetimes'].items()))}

The `day`, `year`, and `number` outcomes are successes; all other outcomes
retain the raw value but leave the typed value null. “Empty” means the
nonempty raw field becomes blank after stripping references and markup.

**Typing.** Finnish numeric and month-name dates, several explicit birth/death
templates, and bare four-digit years are recognized. Finnish date templates
use day, month, year; `Kuolinaika ja ikä` carries birth first and death second.
English date templates use year, month, day. Year precision uses January 1 as
a storage placeholder and is never compared as a full birth/death date.
Population and area accept plain numbers, Finnish decimal commas, grouping
spaces and a small unit suffix set. Dynamic municipality templates, ranges,
ambiguous dates and complex number expressions are refused. Exact per-field
success/refusal counts are in `data/typed-coverage.json`.

The birth/death comparison requires two adjacent rows in the same logical
field with matching period endpoints and full-day precision. It does not
bridge missing fields, parse failures, template changes or field renames.
A parsed calendar date is not independently validated historical evidence.
Calendar-valid years are deliberately not limited to plausible human
lifetimes: the missing-digit years 195 and 194, and the future year 2916,
remain visible source errors in the audit. A death-date template in a birth
field is interpreted by its template arguments, not repaired to fit the field.

**Validation.** `data/validation.json` reports {v['bad_periods']} invalid
periods, {v['overlapping_field_periods']} overlapping logical-field periods,
{v['reverted_or_missing_origin']} missing or reverted origin revisions, and
{v['wrong_origin_page_or_time']} origin page/time mismatches. Current and
end-of-corpus snapshot counts are {v['current_rows']} and {v['rows_at_cutoff']}.
The Parquet/core version and article counts agree. No core corruption was
established by these checks; parser refusals are not core database errors.

**Timings and size.** Showcase timings are client wall time including result
fetching, median of seven sequential runs, with no cache flush. The table
size is InnoDB data/index allocation from `information_schema.tables` after
`ANALYZE TABLE`; it excludes shared redo/binlogs and is not a row-byte sum.
Load time covers inserts and commits, excluding schema creation and final
statistics collection. Extraction time includes metadata reading and parsing.

## The exact SQL

Database: `lab_infobox_time_machine`. Table: `statement`.

```sql
{(B/'sql/schema.sql').read_text().strip()}
```

The queries below each run as one statement and explicitly use
`FOR SYSTEM_TIME`. Article id 1275 is Urho Kekkonen. The monthly query asks
for birth-field replacements in May 2010. Raw A→B→A uses SHA-256 equality;
its collision probability is negligible but it is still a hash comparison.

'''
for t in times:
 text+=f"### {t['query']} — {t['median_ms']:.3f} ms\n\nResult rows: {t['result_rows']}.\n\n```sql\n"+(B/'sql'/t['query']).read_text().strip()+'\n```\n\n'
text+=f'''## What did not work

- Infobox recognition cannot be complete without historical template
  definitions and expansion. `data/recognition.json` lists the most frequent
  unrecognized candidates with examples; many are citations, navigation,
  or diagram helpers. The inline `Albumi` helper is excluded; the actual
  `Musiikkialbumi` infobox is included. Prefix helpers with slashes are excluded
  unless explicitly listed. A named template is not automatically an infobox.
- Refusals/diagnostics across accepted versions:
  `{json.dumps(c['refusals'],ensure_ascii=False)}`. Positional parameters are
  not silently assigned field names. Duplicate-last-wins is a diagnostic,
  not a refused value. Example revisions are in `data/refusal-samples.json`.
- {c['unexpanded_template_observations']:,} nonempty field observations contain
  unresolved nested templates. Source-only history cannot reconstruct
  changes made to Wikidata or a template while the article itself stayed still.
- A broken or unknown box can close extracted lifetimes. There is no claim
  that every such close is a deliberate field deletion. Absence needs an
  uncertainty label in the product.
- Field identity is syntactic. Names and template migrations are not reconciled.
  A person can appear in several templates, so date-event counts are field
  events, not deduplicated real-world corrections.
- Initial tests exposed greedy handling of self-closing refs and the wrong
  parameter order for Finnish date templates. Both were fixed before these
  published measurements and have regression checks in `test_parser.py`.
- Full-text DuckDB aggregation/filtering exceeded the 512 MB working budget.
  Streaming columns in batches and filtering in Python worked. No database
  wikitext scans were used.
- `precision` requires quoting in MariaDB SQL. The initial schema creation
  failed until it was quoted. No core tables were involved.
- No vector index was added. These questions have exact field/time predicates;
  this lab does not establish a benefit from semantic retrieval.

## What the product should do with it

1. Put a “facts as of a date” panel beside an article. Each value should link
   to its originating revision and show the editor, time, and raw-source view.
   Label the standing-revert filter and source-only coverage.
2. Add a birth/death-date history view using typed changes, with before/after
   values and the complete timeline. Use the audit as examples for review,
   not as automatic labels for editors' intent.
3. Show unresolved templates and parse gaps as unknown. Do not present an
   empty field or a year-only January 1 placeholder as a known fact.
4. Keep the article/time index for the panel. Treat the all-history A→B→A
   query as an analytical view; its measured cost is in the timing file.
5. Resolve aliases and template/Wikidata history before advertising complete
   historical infobox rendering. This table already supports useful,
   revision-cited answers within its explicitly measured source coverage.
'''
summary={**c,**{k:v for k,v in s.items() if k!='templates'},'load':l,'validation':v}
(B/'data/summary.json').write_text(json.dumps(dict(title='Infobox time machine summary',unit='counts, seconds and bytes',source='uv run write_report.py; coverage, shape, load and validation JSON',rows=[summary]),ensure_ascii=False,indent=2))
(B/'README.md').write_text(text)
