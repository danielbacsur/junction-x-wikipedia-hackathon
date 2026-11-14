# Round 1 proposal: Fable

Working name: **Palimpsest**. Every number marked _(hyp.)_ is a hypothesis to measure, not a claim.

## 1. Thesis

Palimpsest is a semantic time machine for Wikipedia in which every paragraph is a row with a _lifetime_ (system versioning) and a _meaning_ (vector), so readers can ask what Wikipedia said on any date and editors can see which claims were added, reworded, fought over or silently retracted. It needs both halves: only versioning knows when a claim lived and died, and only vectors can tell a reworded claim from a retracted one.

## 2. Hero demo (2:00)

1. **0:00** Date dial at 2008. Ask in English: "What was the 1918 war called, and who started it?" (_Suomen sisällissota_: 3,357 versions, the README's most edited article.) Gemma answers from 2008 passages. Each citation is a `?oldid=` permalink plus "said from 2006-03 to 2011-09, first written by X".
2. **0:25** Drag the dial to 2026. Same statement, new parameter, about 10 ms _(hyp.)_; the answer re-ranks live. A then-vs-now panel sorts claims into reworded, added, and **retracted** (live six years, removed 2014, edit comment shown).
3. **0:50, the moment.** "Show SQL": one statement holds an HNSW subquery and a stemmed FULLTEXT match fused by RRF, `JOIN passage FOR SYSTEM_TIME AS OF ?`, and a recursive category CTE. Then we delete the clause and run `SET system_versioning_asof = '2008-06-01'`: the whole app, agent tools included, now lives in 2008 and cannot leak the future. Then the reveal: the versioned tables hold no article text. Their history rows _are_ paragraph lifetimes, and all 862,076 versions rebuild byte-exact against Wikipedia's own `sha1`.
4. **1:20** Click the retracted claim. Its biography is `FOR SYSTEM_TIME ALL` on one key: seven rewordings, each with a semantic delta computed in SQL (`VEC_DISTANCE_COSINE(embedding, LAG(embedding) OVER …)`), and four delete/restore cycles between named editors.
5. **1:40** Zoom out: a heat map of "year of Finnish history described × year Wikipedia wrote it", then the numbers slide.

## 3. Feature set

**Must-have (the validated platform)**

1. **Full-M load with real timestamps**: all 19,742 articles, 27× the baseline's 31,848 versions, with a `validate` command that checks every reconstructed version against `sha1` and reprints every number we quote.
2. **Ask as of**: hybrid retrieval (vector + stemmed FULLTEXT, RRF) in one statement, answered by local `gemma4:e2b` through an eve agent, with time-pinned citations and a "then / now / what changed" mode.
3. **Article time machine at scale**: timeline, as-of read, and a _semantic diff_ between two dates (reworded vs added vs retracted).
4. **Claim biography**: lifetime, authors, rewordings and restore cycles of one paragraph slot.
5. **SQL drawer on every panel**: the statement, latency, and `Handler_read%` rows read.
6. **Evaluation**: MariaDB's own 37 questions (article vector baseline 76% hit@5, against our passage + hybrid), plus an auto-built temporal set: a passage alive only in [a, b] must be found inside the window and never outside it.

**Should-have**

- Retraction index: long-lived claims that vanished with no surviving semantic neighbour.
- Contested-claims radar, counting only named-vs-named reverts as the README does.
- Bitemporal heat map (experiment 4).
- Cross-language gap: a Finnish passage as of date X against today's en/sv article vectors from S.
- L scale: stemmed FULLTEXT over 568,416 articles, with vectors only if a Verda GPU appears (that is also the Verda entry). Gemma is already core. Nemotron or Oxylabs only if keys arrive.

**Cut**

Multi-turn chat memory, embedding every version, a second embedding model, faithful template rendering, Toolforge or gadget deployment (roadmap slide only), knowledge-graph extraction, accounts.

## 4. Data model and architecture

| Table            | Shape                                                                                                                   | MariaDB features                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `article`        | one row per article; history rows are versions: metadata + `manifest` (ordered line hashes)                             | `WITH SYSTEM VERSIONING`, `system_versioning_insert_history`, `BLOB COMPRESSED`, `KEY(page_id,row_start)` |
| `line_text`      | each distinct wikitext line once, keyed by hash                                                                         | content addressing, `COMPRESSED`                                                                          |
| `passage`        | one row per live prose paragraph `(page_id, slot)`; a history row is one lifetime of one wording; `about_from/about_to` | system versioning + application-time `PERIOD` (bitemporal)                                                |
| `passage_text`   | cleaned and stemmed text per hash                                                                                       | `FULLTEXT`                                                                                                |
| `passage_vector` | `vec_id`, `VECTOR(1024)`                                                                                                | `VECTOR INDEX M=16 DISTANCE=cosine`                                                                       |
| `article_vector` | the ready S vectors                                                                                                     | same                                                                                                      |
| `revision_fact`  | revert flag, exposure seconds, editor class                                                                             | window functions (the README's `LAG`/`MIN OVER`)                                                          |

**Decision A: text once, time in the versioned table.** The README says whole copies cost 1.2 GB for 50 articles, projects 5–7 GB for M, and itself notes that Wikipedia-sized history "wants text stored once". Parquet's 12.2 GB → 315 MB shows the redundancy exists. Target under 1.5 GB _(hyp.)_, gated by the sha1 check. No partitioning: the README measured no speed-up and 25% more disk, and partitions block vector indexes.

**Decision B: the unit is the wikitext paragraph with a stable slot.** The loader diffs consecutive line-hash sequences and pairs replaced lines by similarity, so a slot survives rewording. This fixes the README's "one vector finds the topic, not the fact" (3 of 5 president questions missed) and keeps Gemma's context to about eight passages.

**Decision C: vectors on immutable content, time by join.** `passage_vector` is neither versioned nor partitioned, so it works whatever experiment 1 finds. `passage.vec_id` points at a representative: a light rewording reuses its ancestor's vector, which saves budget and stops near-duplicates crowding the top-k. As-of search over-fetches in the README's index-friendly subquery shape, then joins `AS OF`; when scoped to one article it scans exactly (README: 14 ms for 104 articles).

**Embedding budget is the scarce resource.** 73 MB of Finnish text at 1,400 tokens/s is roughly four hours for _current_ paragraphs alone _(hyp., about 3.5 chars/token)_; all history is out of reach locally. So three tiers: S article vectors route every question from minute one; full passage history for about 1,000 most-edited articles plus MariaDB's 50; then write-through embedding on first touch and an overnight queue by edit count. "Has a vector row" means "embedded", and the UI shows coverage.

## 5. Wild experiments

1. **Can a versioned table carry a `VECTOR INDEX`, and does FULLTEXT see history rows?** _Proves:_ the brief's two unknowns. _Test (30 min):_ a 10k-row versioned table, updates, `AS OF` with `ORDER BY distance LIMIT`, checked with `EXPLAIN`, `Handler_read%` and recall against exact. _Show:_ a "what we found" table; either answer is news to the judges.
2. **System versioning as a paragraph-lifetime store.** _Proves:_ history rows can be intervals of meaning, not row copies, losslessly. _Test (90 min):_ one of the 16 Parquet files; measure rows, GB, sha1 match rate, as-of latency against a whole-row table of the same data. _Show:_ storage bars and "N / N versions verified".
3. **Half-life of a Wikipedia paragraph.** _Proves:_ survival analysis is plain SQL over `row_end − row_start`. _Test (1 h):_ survival curves by year written and by named vs anonymous author; vectors separate rewording from death. _Show:_ the curves, and the 20 longest-lived claims later retracted. Unpublished for Finnish Wikipedia as far as I know.
4. **History of history, bitemporal.** _Proves:_ application time and system time combine usefully. _Test (1 h):_ regex the years each passage mentions into `about_from/about_to`, roll up by said-year. _Show:_ the heat map, the most rewritten decade, and the yearly share of _vapaussota / kansalaissota / sisällissota_ for 1918.
5. **Exposure clock and the 2025 natural experiment.** _Proves:_ how long reverted text stayed live, from metadata alone. _Test (45 min):_ window functions over 862,076 rows. _Show:_ median time-to-revert 2004–2026, split by IP, temporary account (`~2026-…`) and named user, with the 2025 switch marked.

## 6. Risks

1. **Embedding starvation makes passage search feel empty.** Defuse: the tiers above; benchmark short-chunk batch throughput in hour one (the README saw 300+/min on short articles); route by article vectors always; rent a GPU if Verda credits exist; never hide coverage.
2. **The lineage loader eats the day.** Defuse: layer it. First load whole versions for MariaDB's 50 articles the README's way, so a time machine works by mid-afternoon; then manifests; then slots. The sha1 gate decides promotion, and the whole-row table remains the fallback and the comparison baseline.
3. **A 5B local model writes weak Finnish or invents citations, while breadth outruns validation.** Defuse: extractive-first answers in a fixed template, citation ids checked in code (uncited sentences dropped), feature freeze at 20:00 Saturday, and nothing enters the pitch that `validate` cannot reproduce.
