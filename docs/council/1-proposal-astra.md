## 1. Thesis

**Wikipedia Memory** lets journalists, researchers and editors ask when an idea appeared, disappeared and returned across Finnish Wikipedia: vector search connects differently worded passages, while MariaDB system versioning establishes which cited revisions actually contained them at each moment—the product needs both semantic discovery and temporal evidence.

## 2. Hero demo

**0–20 seconds:** “Wikipedia remembers every edit. Can we search what it forgot?” Enter an English question about a documented change in a Finnish historical article. Select the actual example after inspecting the data; do not promise a particular historical controversy.

**20–45 seconds:** Two dates produce two concise answers, each with Finnish quotations, clearly labelled translations and exact `oldid` citations. A central strip identifies added, removed and unchanged evidence. Dates mean “Wikipedia said this then,” never “this became historically true then.”

**45–80 seconds:** Click a removed passage: **Find its other lives**. The interface reveals its exact-text presence intervals and semantically related passages elsewhere. Scrubbing the timeline opens the corresponding archived revision. A paraphrase is labelled a candidate, not automatically declared the same claim.

**80–105 seconds:** The engineer moment: one parameterized SQL query ranks semantic candidates, joins their occurrence intervals and the authoritative `FOR SYSTEM_TIME AS OF` state, and returns evidence that existed on the selected date. Move the date; the same semantic neighbourhood yields different admissible evidence. Open the query drawer: SQL, parameters, rows examined, timing, actual indexed versus exact-search agreement.

**105–120 seconds:** Show the coverage ledger and one adversarial test where later evidence is excluded. End on a human benefit: recover an explanation that today's article no longer contains, with its documentary trail.

## 3. Feature set, ranked

**Must-have:**

1. One coherent investigation screen: question, two dates, cited answers, evidence comparison, timeline, original revision viewer and shareable URL. Gemma generates short answers from bounded evidence; failed generation leaves useful quotations and diffs.
2. All available S articles/vectors searchable; all M revisions accessible by date; a fully processed, explicitly bounded historical passage corpus for semantic archaeology. Start with 10–20 articles, adding only complete article histories within a 3,000-distinct-passage embedding budget. Report actual coverage prominently.
3. Two honest retrieval modes: **topic-guided history**, using S to select articles before reading historical M text; **historical evidence search**, searching only passages present at the requested date within the indexed corpus. The first can have hindsight-biased discovery; neither may cite future text as past evidence.
4. Resumable ingestion, UTC boundaries, missing-page and unsupported-date handling, visible source provenance and attribution. Never describe the October dump's last revision as live Wikipedia.
5. End-to-end acceptance: Parquet/database counts and revision IDs agree; sampled raw text agrees; temporal results match an independently computed predecessor lookup; citation quotations occur in the cited revision. Include pre-creation dates, same-second edits, repeated text, removed passages and generation failure. Human-review 20 question/date cases; report retrieval recall, unsupported statements, latency and memory separately. Test the UI through ingestion to source opening.

**Should-have:** S hybrid retrieval with SQL reciprocal-rank fusion; category exploration; L full-text discovery with an explicit “no history available” state outside M; saved investigation exports. L's 568,416 articles prove lexical scale, not historical or vector coverage.

**Cut:** full-M embeddings, full-L local embeddings, speculative edit-war labels, live crawling, autonomous Wikipedia edits, accounts, multi-agent chat, and prize-specific integrations. Gemma already contributes centrally; cloud keys must not determine whether the demo works.

**Delivery gates:** working S→M→citation slice by 15:00 Saturday; complete ingestion and temporal validation by 19:00; freeze features at 21:00 for recording, polish and regression checks. Experiments compete for a two-hour budget, not five mandatory implementations.

## 4. Data model and architecture

**A. Store evidence once; version its identity.** `article_state` has one logical row per Finnish `page_id`, revision metadata and `blob_id`, with `WITH SYSTEM VERSIONING` and `(page_id,row_start)` indexing. Import actual revision times using `system_versioning_insert_history`; derive ends from successors. Preserve original timestamps and deterministic same-second ordering separately. `text_blob` holds distinct raw wikitext in `MEDIUMTEXT COMPRESSED`, keyed by a locally computed content digest with equality verification. Whole-text reversions reuse blobs. Do not build delta reconstruction tonight.

The dataset README reports 862,076 revisions, 19,742 articles and 12.2 GB raw text; its 5–7 GB database estimate is a planning estimate, not our measurement. The SVT README found column compression effective and partitioning unhelpful for small as-of queries. Start unpartitioned; measure the actual footprint. The snapshot's apparent open-ended final state is bounded in the application by dataset coverage.

**B. Separate semantic identity from temporal occurrence.** `snapshot_article` and `article_vector` preserve S's `(lang,page_id)`, source revision, Wikidata mapping and native `VECTOR(1024)` index. `passage` stores conservatively cleaned paragraphs plus their raw-source locator; `passage_vector` embeds each distinct paragraph once. `passage_occurrence` records page, passage and each contiguous presence interval; `revision_passage` preserves revision membership. A passage that disappears and returns receives two intervals. Verify every displayed occurrence against the versioned state and raw source.

Keep vectors in ordinary, unpartitioned tables: neither VECTOR-on-SVT nor FULLTEXT-over-history compatibility becomes a dependency. Use window functions to derive intervals and reverts; never equate a revert with conflict. Preserve references and flag template-dependent passages rather than silently deleting evidence.

**C. Make temporal correctness precede speed.** Historical search filters to date-valid passage IDs, then computes exact cosine distances for the small indexed corpus. Benchmark HNSW candidate search followed by temporal joins separately: filtering a global top-k can miss valid historical neighbours. Increase candidates or fall back to exact search; disclose approximate recall. For S, start from the README's vector-subquery-before-join shape and `M=16`, `ef_search=80`, then measure locally.

Next.js 16 provides the interface; shared TypeScript packages own typed retrieval and provenance; one eve agent uses AI SDK 7 and local Gemma for structured, citation-bound synthesis. Cache evidence by question, dates and corpus version. Keep embedding jobs outside interactive inference windows.

## 5. Wild experiments

1. **Resurrect a vanished explanation — boldest.** Proves semantic retrieval can find material absent from current pages. Within 110 minutes, process complete histories of three articles, embed distinct passages, retrieve removed passages and inspect their nearest surviving paraphrases. Show a verified disappearance/reappearance ribbon with source revisions. If no compelling case exists, report that result; similarity alone proves neither suppression nor copying.
2. **Measure hindsight contamination.** Proves discovery and evidence leakage are different. Within 60 minutes, hand-label ten date-bound questions; compare S-guided retrieval against exact, date-filtered historical passages. Show changed candidates and any future-only evidence rejected by the temporal gate.
3. **Challenge the temporal ANN shortcut.** Proves when a fast query loses history. Within 90 minutes, compare exact date-filtered search with HNSW top-50/200/1,000 followed by temporal filtering across twenty dates. Show measured recall versus latency and the SQL plan; retain exact search if necessary.
4. **Find language-specific omissions.** Proves multilingual vectors expose different coverage. Within 90 minutes, chunk ten S Wikidata-linked Finnish/Swedish/English topic groups and manually inspect unmatched passages. Show one supported coverage difference, explicitly at the August 2025 snapshot; this is not cross-language edit history.
5. **Trace a sentence's journey.** Proves SQL can discover cross-article textual chronology. Within 110 minutes, hash substantive paragraphs across fifty selected histories, exclude boilerplate, and use window functions to order first observed appearances. Show a revision-linked path; describe chronology, not causal authorship or the first appearance on all Wikipedia.

## 6. Risks

1. **False historical authority:** S/L are August 2025 snapshots; M ends October 2026. Enforce coverage, retain raw quotations, audit translations and expose discovery mode. A missing match means “not found in this corpus.”
2. **Compute overwhelms delivery:** agents share one 24-GB laptop. Stream ingestion, cap embedding work, benchmark the first batch, serialize heavy jobs and drop experiments before compromising the complete core.
3. **An impressive but unverified story:** cleaning, passage alignment and semantic similarity can manufacture change. Keep deterministic textual evidence separate from model interpretation; accept only manually checked hero examples and publish failed tests alongside measurements.
