# Infobox time machine

## The question

What can a reader or editor ask when infobox fields become MariaDB rows,
with Wikipedia's actual edit times as system time?

## What we found

**211,379 field lifetimes, from 19,742 articles scanned.
150 continuous changes of a parsed birth or death date,
across 119 articles.** These are statements in article
source, not independently verified facts or a complete reconstruction of the
rendered infobox.

| Measure | Result |
|---|---|
| Parquet versions read | 862,076 |
| Versions skipped using core reverted_by | 54,741 |
| Accepted versions | 807,335 |
| Versions with a recognized infobox, before filtering | 360,294 |
| Accepted versions with a recognized infobox | 329,887 |
| Articles with a recognized infobox | 8,222 |
| Named field observations, including empty | 7,649,662 |
| Nonempty field observations | 5,066,851 |
| Raw-value lifetime rows | 211,379 |
| Distinct field names / template names | 2,900 / 281 |
| Distinct article/template/instance/field slots | 140,227 |
| Mean / median lifetimes per field slot | 1.51 / 1.0 |
| Mean repeated observations per lifetime | 23.97 |
| Extraction wall time | 253.67 s |
| MariaDB load wall time | 7.53 s |
| Table data + index allocation | 129,318,912 bytes (123.33 MiB) |
| Current statement rows | 110,129 |
| Continuous raw A → B → A returns | 2,257 |

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

| Field | Replacements | Clean-value changes | Raw-only changes | Per 1,000 observations |
|---|---|---|---|---|
| kuva | 2446 | 2132 | 314 | 15.49 |
| kuvateksti | 1891 | 1690 | 201 | 16.60 |
| virassa | 1877 | 1560 | 317 | 34.08 |
| väkiluku | 1445 | 1285 | 160 | 43.46 |
| sijainti | 1441 | 1045 | 396 | 20.96 |
| puolue | 956 | 528 | 428 | 14.41 |
| virassa2 | 905 | 757 | 148 | 27.20 |
| nimi | 901 | 771 | 130 | 4.71 |
| syntymäpaikka | 863 | 468 | 395 | 8.62 |
| arvo | 859 | 616 | 243 | 15.47 |

The lowest measured replacement rates in the same group are:

| Field | Field slots | Replacements | Per 1,000 observations |
|---|---|---|---|
| johtajan_arvonimi1 | 214 | 0 | 0.000 |
| coord_display | 197 | 0 | 0.000 |
| raiteita | 61 | 0 | 0.000 |
| latNS | 812 | 3 | 0.247 |
| longEW | 812 | 3 | 0.247 |

These rates are per saved observation, not per year. They depend on editing
frequency. A low rate does not certify accuracy.

### How long values stand

The twenty most frequently observed field names are ranked by nonempty
version-level observations. Durations below include only completed
lifetimes. Current rows are right-censored and excluded from quantiles.
Changes of markup, references, and spelling can close a raw lifetime.
Disappearance, an unreadable box, or a template migration can also close it.
This measures extracted-statement persistence, not time until a factual correction.

| Field | Completed | Current/censored | Median days | 90th percentile days |
|---|---|---|---|---|
| nimi | 1795 | 4856 | 313.79 | 2781.15 |
| kuva | 3424 | 4086 | 381.29 | 2596.91 |
| kuvateksti | 2510 | 3217 | 369.24 | 2616.21 |
| syntymäpaikka | 1287 | 2360 | 435.49 | 3093.90 |
| syntymäaika | 871 | 1763 | 211.71 | 2648.90 |
| sijainti | 2100 | 1476 | 330.13 | 2748.14 |
| puolue | 1212 | 958 | 306.56 | 2385.71 |
| arvo | 999 | 781 | 309.72 | 2032.30 |
| virassa | 2015 | 769 | 152.04 | 1471.97 |
| edeltäjä | 834 | 674 | 341.37 | 2430.50 |
| kotisivu | 1120 | 737 | 881.89 | 3103.45 |
| kuolinpaikka | 829 | 1768 | 379.40 | 2813.63 |
| puoliso | 842 | 731 | 359.67 | 2287.56 |
| seuraaja | 790 | 694 | 313.11 | 2723.94 |
| vuosi | 962 | 454 | 257.85 | 971.45 |
| koordinaatit | 1162 | 787 | 574.99 | 2168.31 |
| vaakuna | 1036 | 294 | 179.76 | 912.81 |
| vaalipiiri | 329 | 1330 | 946.67 | 3934.48 |
| kuolinaika | 700 | 1407 | 229.85 | 2206.28 |
| maakunta | 725 | 359 | 268.58 | 1558.11 |

### Birth and death dates

There are 150 direct full-date replacements across
126 article/template/instance/field slots. Absolute
Gregorian day differences are binned as follows. “Month” and “year” here are
bounded day ranges, not claims about the editor's intention.

| Absolute shift | Events |
|---|---|
| 1 day | 13 |
| 2–31 days | 53 |
| 32–365 days | 29 |
| >365 days | 55 |

The twenty-five slots with the largest single shifts are listed below;
ties use change count then page id. `data/changed-dates.json` contains each
slot's complete extracted timeline, raw values, editors, revision ids,
edit summaries and periods, including unreadable intervals.

| Article | Field | Changes | Largest shift in days |
|---|---|---|---|
| Jarmo Viinanen | syntymäpäivä | 1 | 644287 |
| Terttu Savola | syntymäpäivä | 1 | 638078 |
| Jouko Skinnari | kuolinaika | 1 | 328718 |
| Oskari Arjanne | kuolinpäivä | 1 | 36524 |
| Bruno Jalander | syntymäaika | 1 | 34440 |
| Urho Kiukas | syntymäaika | 1 | 33968 |
| Mikko Juva | syntymäaika | 1 | 31086 |
| Arseni Zakrevski | syntymäaika | 1 | 28610 |
| Fabian Steinheil | syntymäaika | 1 | 24967 |
| Aleksanteri II (Venäjä) | kuolinaika | 3 | 22964 |
| Anders Fabian Orrhjelm | kuolinaika | 1 | 19725 |
| Heikki Ritavuori | kuolinaika | 1 | 15302 |
| Heikki Ritavuori | syntymäaika | 1 | 15302 |
| Veikko Vennamo | syntymäaika | 1 | 13409 |
| Uuno Suni | syntymäpäivä | 1 | 13149 |
| Lauri Aho | syntymäaika | 1 | 12783 |
| Sylvi-Kyllikki Kilpi | kuolinaika | 1 | 10957 |
| Anders Chydenius | kuolinpäivä | 1 | 9862 |
| Keijo Liinamaa | syntymäaika | 1 | 9497 |
| Nikolai Adlerberg | kuolinaika | 1 | 8683 |
| Väinö Tanner | kuolinaika | 1 | 5806 |
| Rafael Paasio | kuolinaika | 2 | 5498 |
| Marjatta Väänänen | syntymäaika | 1 | 5155 |
| Väinö Tanner | syntymäaika | 1 | 4975 |
| Kyösti Kallio | syntymäaika | 2 | 3703 |

### Manual read: evidence and interpretation

I read the largest transition in each of the first sixteen entries (fifteen distinct articles), with
the before, after, and next field-lifetime revision when available. The read
covered the infobox value, edit summary, and lead excerpts.
Full local source is retained in `cache/audit-source.json`; reproducible
excerpts are in `cache/audit-reading.txt`. I did not consult external sources,
talk pages, or every intermediate edit. Classifications describe that limited
read and cannot establish the historically correct date.

| Article / field | Classification | Reason |
|---|---|---|
| Jarmo Viinanen / syntymäpäivä | correction | The editor added an infobox with year 195, then restored the missing final digit. The lead says 1959 in both inspected revisions. This looks like a typing repair. |
| Terttu Savola / syntymäpäivä | correction | The new infobox used year 194 while the lead already said 1941. The replacement appends the missing digit; its summary says “ikä fix” (age fix). |
| Jouko Skinnari / kuolinaika | correction | The same editor changes death year 2916 to 2016 immediately. The lead already reports 21 April 2016. This looks like a mistyped digit. |
| Oskari Arjanne / kuolinpäivä | correction | The added infobox says death in 1862, while the existing lead and its cited biography say 1962. The replacement agrees with that lead; the edit summary is “1962”. |
| Bruno Jalander / syntymäaika | correction | The birth field contains a death-date-and-age template whose death date is 14 December 1966. It is replaced with 28 August 1872, already the birth date in both leads. This repairs a misplaced template. |
| Urho Kiukas / syntymäaika | correction | The same editor replaces a death-date-and-age template in the birth field with the lead’s 19 November 1902 birth date. The lead is unchanged. |
| Mikko Juva / syntymäaika | correction | The editor first inserts a death-date-and-age template into the birth field, then replaces it with the lead’s 22 November 1918 date. The insertion summary says “malline lisätty” (template added). |
| Arseni Zakrevski / syntymäaika | correction | The birth field initially contains 23 January 1865, which both leads identify as the death date. The replacement is the existing lead’s 24 September 1786 birth date. |
| Fabian Steinheil / syntymäaika | correction | The birth field says 22 February 1831, close to the death date (23 February 1831) in the lead. The replacement is the lead’s 14 October 1762 birth date. The one-day death discrepancy is not resolved by this read. |
| Aleksanteri II (Venäjä) / kuolinaika | calendar or format change | A conversion from plain date links to a death-date-and-age template reverses birth and death arguments. The next inspected revision by the same editor fixes their order. Both leads keep the same dates. This is a formatting conversion with a transient error, not evidence of a historical date dispute. |
| Anders Fabian Orrhjelm / kuolinaika | correction | The death field initially repeats the lead’s 30 November 1762 birth date. Its replacement agrees with the lead’s 2 December 1816 death date and adds an age. |
| Heikki Ritavuori / kuolinaika | correction | The two fields were swapped. The summary explicitly says “ajat väärinpäin + fix” (dates reversed + fix), and the replacement death field agrees with the unchanged lead. |
| Heikki Ritavuori / syntymäaika | correction | The same edit repairs the paired birth field. The prior death-date-and-age template is replaced by 23 March 1880, matching the unchanged lead. This is the second field in one repair, not a second independent incident. |
| Veikko Vennamo / syntymäaika | correction | The newly added infobox gives 26 February 1950, while the lead already gives 11 June 1913. The replacement makes the field agree with the lead. The source of the incorrect date is not established. |
| Uuno Suni / syntymäpäivä | correction | The same editor changes the birth field from 14 May 1962 to 14 May 1926. Both leads already give 1926. A later formatting edit retains that date. |
| Lauri Aho / syntymäaika | correction | The birth field gives 18 July 1866, while the lead gives 18 July 1901. The later field agrees with the lead. No edit summary explains the original mismatch or intent. |

Class counts: {'correction': 15, 'calendar or format change': 1}.
This is a deliberately extreme, nonrandom sample. No classification is
extrapolated to the rest of the corpus. “Correction” means the local evidence
suggests a repair, not that the replacement date has been verified.

### MariaDB finding

On MariaDB 12.3.3-MariaDB-ubu2404, the same article-as-of query took
2.397 ms with `FORCE INDEX (article_asof)` and
72.645 ms with `IGNORE INDEX (article_asof)` (seven runs each).
The index is `(page_id,row_end,row_start)`. `EXPLAIN` is recorded in
`data/index-experiment.json`. This is one article and one date on a shared,
warm server; it is not a claim about all historical selectivity patterns.

`SHOW CREATE TABLE` also shows MariaDB adding `row_end` to the primary key.
The declared `PRIMARY KEY(id)` becomes `(id,row_end)`. A lifetime id is an
import identity, not a cross-history uniqueness constraint. The separate
integrity query checks logical-field period overlap.

Current rows omit `row_end` on insertion. The observed current sentinel is
`2106-02-07 06:28:15.999999`. Hardcoding the old 2038 timestamp would turn
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

| Outcome | Lifetimes |
|---|---|
| day | 6397 |
| invalid_date_template | 19 |
| unread_number | 375 |
| number | 2921 |
| year | 2129 |
| ambiguous_or_unread_date | 822 |
| empty | 28 |

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

**Validation.** `data/validation.json` reports 0 invalid
periods, 0 overlapping logical-field periods,
0 missing or reverted origin revisions, and
0 origin page/time mismatches. Current and
end-of-corpus snapshot counts are 110129 and 110129.
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
CREATE TABLE statement (
 id BIGINT UNSIGNED NOT NULL,
 page_id INT UNSIGNED NOT NULL,
 title VARCHAR(255) NOT NULL,
 template VARCHAR(255) NOT NULL,
 slot SMALLINT UNSIGNED NOT NULL,
 field VARCHAR(255) NOT NULL,
 raw_value MEDIUMTEXT NOT NULL,
 value MEDIUMTEXT NOT NULL,
 unresolved BOOLEAN NOT NULL,
 fact_date DATE NULL,
 fact_number DOUBLE NULL,
 `precision` VARCHAR(40) NULL,
 rev_id INT UNSIGNED NOT NULL,
 editor VARCHAR(255) NULL,
 editor_kind VARCHAR(8) NOT NULL,
 comment TEXT NULL,
 versions INT UNSIGNED NOT NULL,
 row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START,
 row_end TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
 PERIOD FOR SYSTEM_TIME (row_start,row_end),
 PRIMARY KEY(id),
 KEY article_asof(page_id,row_end,row_start),
 KEY field_time(field,row_start),
 KEY typed_date(field,fact_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin WITH SYSTEM VERSIONING;
```

The queries below each run as one statement and explicitly use
`FOR SYSTEM_TIME`. Article id 1275 is Urho Kekkonen. The monthly query asks
for birth-field replacements in May 2010. Raw A→B→A uses SHA-256 equality;
its collision probability is negligible but it is still a hash comparison.

### a-asof.sql — 1.265 ms

Result rows: 32.

```sql
SELECT title,template,slot,field,value,raw_value,rev_id,editor,row_start
FROM statement FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59'
WHERE page_id = 1275
ORDER BY template,slot,field;
```

### b-field-history.sql — 1.776 ms

Result rows: 5.

```sql
SELECT title,template,slot,field,value,rev_id,editor,comment,row_start,row_end
FROM statement FOR SYSTEM_TIME ALL
WHERE page_id = 1275 AND field = 'syntymäaika'
ORDER BY row_start;
```

### c-changed-dates.sql — 58.928 ms

Result rows: 93.

```sql
WITH history AS (
 SELECT page_id,title,template,slot,field,fact_date,`precision`,row_start,
 LAG(fact_date) OVER w AS previous_date,
 LAG(`precision`) OVER w AS previous_precision,
 LAG(row_end) OVER w AS previous_end
 FROM statement FOR SYSTEM_TIME ALL
 WHERE field IN ('syntynyt','syntymäaika','kuollut','kuolinaika','perustettu')
 WINDOW w AS (PARTITION BY page_id,template,slot,field ORDER BY row_start)
)
SELECT page_id,title,field,COUNT(*) AS changes,MAX(ABS(DATEDIFF(fact_date,previous_date))) AS largest_days
FROM history WHERE `precision`='day' AND previous_precision='day'
 AND previous_end=row_start AND fact_date<>previous_date
GROUP BY page_id,title,field ORDER BY changes DESC,page_id,field LIMIT 100;
```

### d-returned-values.sql — 2945.947 ms

Result rows: 100.

```sql
WITH history AS (
 SELECT page_id,title,template,slot,field,value,rev_id,row_start,
 SHA2(raw_value,256) AS hash,
 LAG(SHA2(raw_value,256),1) OVER w AS previous_hash,
 LAG(SHA2(raw_value,256),2) OVER w AS older_hash,
 LAG(row_end,1) OVER w AS previous_end,
 LAG(row_end,2) OVER w AS older_end,
 LAG(row_start,1) OVER w AS previous_start
 FROM statement FOR SYSTEM_TIME ALL
 WINDOW w AS (PARTITION BY page_id,template,slot,field ORDER BY row_start)
)
SELECT page_id,title,template,field,value,rev_id,row_start
FROM history WHERE hash=older_hash AND hash<>previous_hash
 AND previous_end=row_start AND older_end=previous_start
ORDER BY row_start DESC,page_id,template,slot,field LIMIT 100;
```

### e-month.sql — 2.375 ms

Result rows: 37.

```sql
SELECT b.page_id,b.title,b.field,a.value AS before_value,b.value AS after_value,
 b.row_start AS changed_at,b.rev_id,b.editor
FROM statement FOR SYSTEM_TIME ALL a
JOIN statement FOR SYSTEM_TIME ALL b
 ON b.page_id=a.page_id AND b.template=a.template AND b.slot=a.slot
 AND b.field=a.field AND b.row_start=a.row_end
WHERE b.field='syntymäaika' AND b.row_start>='2010-05-01' AND b.row_start<'2010-06-01'
ORDER BY b.row_start,b.page_id;
```

## What did not work

- Infobox recognition cannot be complete without historical template
  definitions and expansion. `data/recognition.json` lists the most frequent
  unrecognized candidates with examples; many are citations, navigation,
  or diagram helpers. The inline `Albumi` helper is excluded; the actual
  `Musiikkialbumi` infobox is included. Prefix helpers with slashes are excluded
  unless explicitly listed. A named template is not automatically an infobox.
- Refusals/diagnostics across accepted versions:
  `{"positional_parameter": 34646, "unclosed_infobox": 63, "duplicate_last_wins": 2668, "invalid_field_name": 38, "unreadable_template": 33}`. Positional parameters are
  not silently assigned field names. Duplicate-last-wins is a diagnostic,
  not a refused value. Example revisions are in `data/refusal-samples.json`.
- 365,066 nonempty field observations contain
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
