# Round 2: measured facts and a proposed synthesis (written by the lead)

Both round-1 proposals are in this folder: `r1-fable.md`, `r1-astra.md`.
Read both. They agree on far more than they disagree. Below is what has been
measured on the actual machine since round 1, then a synthesis to attack.

## Measured since round 1 (MariaDB 12.3.3 in Docker, Apple M5)

1. **A system-versioned table can carry a VECTOR INDEX.**
   `SELECT ... FROM t FOR SYSTEM_TIME AS OF TIMESTAMP '2012-06-01' ORDER BY
VEC_DISTANCE_COSINE(emb, ?) LIMIT k` returns history rows, and EXPLAIN
   names the vector key. Tested only on a toy table so far: recall under
   heavy filtering (many dead near-duplicates) is NOT yet measured.
2. **FULLTEXT does not see history rows.** `MATCH ... AGAINST` with
   `FOR SYSTEM_TIME ALL` returns current rows only (both for rows written by
   UPDATE and by `system_versioning_insert_history`). `LIKE` does see them.
3. **All of M is already loaded as whole copies**: 862,076 versions of
   19,742 articles with real timestamps in a system-versioned `revision`
   table (`MEDIUMTEXT COMPRESSED`, `KEY(page_id,row_start)`), in 103 seconds
   (about 8,000 versions/s, four files at a time). 5.9 GB on disk.
4. **S is loaded**: 29,460 articles + bge-m3 vectors + HNSW (M=16) in 31 s.
   Vector search plus join: 7 to 11 ms. L (568,416 articles, FULLTEXT) loads
   at about 2,400 rows/s, done in about four minutes.
5. **Embedding throughput is 3x the README's**: bge-m3 through Ollama on
   this M5 does about 4,000 tokens/s in batches of 64, about 57 short
   passages per second. So about 200,000 passages per hour. All current
   Finnish S paragraphs fit in roughly 75 minutes; all history does not
   (order of 1 to 2 million distinct paragraph wordings).
6. M facts: median 18 versions per article, p90 95, p99 437, max 3,357;
   median version 6 KB, p99 115 KB; 20 same-second edit pairs; one Parquet
   row group per article, time-ordered.
7. `gemma4:e2b` reports tools, vision, audio and thinking, 131k context.

## Proposed synthesis

**Name**: Palimpsest (working name).

**Thesis** (Fable's, with Astra's discipline): every paragraph is a row
with a lifetime (system versioning) and a meaning (vector). Readers ask what
Wikipedia said on any date; editors see which claims were added, reworded,
fought over or retracted. Every statement shown is tied to an exact
`oldid`, and the UI always separates deterministic textual evidence from
model interpretation, and discovery mode from evidence.

**Tables**

- `revision`: whole copies, system-versioned (done). The authoritative
  source for "the article exactly as saved", diffs and the storage baseline.
- `edit`: one slim row per version, derived in SQL with window functions:
  revert flags (identity reverts by sha1), reverted-by, exposure seconds,
  editor class (named / ip / temporary account).
- `passage`: system-versioned, one row per paragraph **slot**
  `(page_id, slot)`. The current row is the current wording; each history
  row is one earlier wording with its lifetime. The loader diffs consecutive
  versions block by block, pairs replaced blocks by similarity so a slot
  survives rewording, and gives each slot a fractional order key so
  `SELECT ... FOR SYSTEM_TIME AS OF t ORDER BY ord` rebuilds the article.
  Acceptance gate: for every version, the passage table as of that
  version's timestamp must reproduce that version's block sequence exactly.
- `passage_text`: each distinct cleaned wording once, keyed by hash, with
  FULLTEXT (because of finding 2).
- `passage_vector`: one vector per distinct wording, keyed by the same hash.
  Open question for you: plain table + temporal join (safe), or ALSO a
  system-versioned vector table so that as-of semantic search is one
  index-driven statement (finding 1)? A lab will measure recall of both
  against exact search.

**Retrieval**

- Stage 1 always works: S article vectors + FULLTEXT fused with RRF in one
  statement, filtered to articles that existed at the date.
- Stage 2: passages of the candidate articles that were alive at the date,
  exact cosine scan (small sets), with write-through embedding on first
  touch and a background queue ordered by edit count. Coverage is shown.
- Global passage search over the embedded corpus through the HNSW index,
  over-fetching and falling back to exact when under-filled.
- `SET system_versioning_asof` pins a whole agent session to a date.

**Product surfaces**: Ask (then / now / what changed), article time machine
with timeline and semantic diff, claim biography (one slot's wordings,
authors, restore cycles), findings atlas (survival curves, exposure clock,
the naming of the 1918 war over time, contested claims), SQL drawer with
timings and rows read on every panel, an eve agent on local Gemma, an MCP
endpoint so other agents can time-travel Wikipedia, and a `validate`
command that reprints every number quoted.

**Labs running in parallel** (each under two hours, findings to a README):
temporal ANN recall; paragraph half-life; history-of-history heat map and
the 1918 naming series; exposure clock and the 2025 temporary-account
switch; retraction index ("resurrect a vanished explanation"); sentence
journeys across articles; hindsight contamination.

## What I want from you now

Write at most 600 words to the output file named in your task:

1. **Attack the synthesis**: the two or three things most likely to be
   wrong or to fail, with the specific failure you expect.
2. **Slots vs content hashes**: Fable proposed stable slots that survive
   rewording; Astra proposed content-addressed passages with occurrence
   intervals and warned that alignment can manufacture change. Given the
   exact-reconstruction gate above, which should be the primary model? If
   you held the other view in round 1, say whether you now concede, and what
   condition would change your mind.
3. **Versioned vector table**: build it as a first-class path, keep it as a
   lab, or drop it?
4. **One amendment** you insist on before you sign, and the one feature you
   would cut first if time runs short.
5. End with exactly one line: `VERDICT: SIGN` or `VERDICT: SIGN WITH
AMENDMENT` or `VERDICT: BLOCK` plus a ten-word reason.
