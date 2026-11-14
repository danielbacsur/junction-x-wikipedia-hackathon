1. **Attack the synthesis**

**Reconstruction does not validate lineage.** Pair two unrelated replacement paragraphs into one slot: every historical block sequence still reconstructs perfectly, but the claim biography falsely reports a rewording. Splits, merges, moves and duplicate paragraphs make this routine, not exceptional. “Retracted” and “fought over” exceed what deletion and identity reverts establish. Also, the timestamp-only reconstruction gate cannot distinguish the measured same-second edits. Exact revision identity needs an ordered membership representation independent of timestamp lookup; date queries need an explicit tie policy.

**Temporal safety is overstated.** `SET system_versioning_asof` cannot date-pin ordinary S articles, passage text, vectors, caches or external tools. An article existing in 2008 does not make its S wording admissible in 2008. This remains hindsight-biased discovery, with historically admissible evidence enforced separately. Likewise, a full ANN result set can still omit the best date-valid neighbours: falling back only when under-filled detects cardinality failure, not recall failure. Benchmark full result sets against exact date-filtered search, and retain exact search for bounded historical corpora.

**The critical path is overloaded.** Faster embeddings do not establish alignment throughput, long-passage throughput, or interactive latency while embedding and Gemma share the laptop. Write-through embedding makes an uncached investigation depend on the background workload. Precompute complete, bounded article histories for the hero path. Seven labs, an atlas and MCP are not a credible simultaneous commitment; allow at most one experiment to compete with end-to-end delivery.

2. **Slots versus content hashes**

Keep immutable content hashes plus exact revision membership and contiguous occurrence intervals primary. Include order and duplicate occurrences in membership; a content hash alone cannot reconstruct an article. Derive passage lifetimes from that evidence. Similarity-linked slots belong in an optional, explicitly inferred relationship layer.

I concede Fable's paragraph-lifetime presentation is stronger than my initial interface, and the measured embedding speed makes my 3,000-passage cap unnecessarily conservative. I also concede whole-copy storage is already cheap enough: neither my blob redesign nor Fable's manifests deserves the critical path. But reconstruction offers no new evidence for stable semantic slots. I would promote slots only after manually audited split/merge/move/replacement cases demonstrate reliable lineage, with abstention for ambiguity. Even then, exact revision membership remains authoritative.

3. **Versioned vector table**

Keep it as a lab. Finding that EXPLAIN names the vector key is valuable, but does not establish historical recall or production performance. A vector per immutable wording plus temporal membership already supports one SQL statement. Versioning that deduplicated vector conflates its identity with potentially many disjoint lifetimes across articles unless the schema explicitly models those occurrences. The lab must test that case and dense dead near-duplicates against exact search before promotion.

4. **One amendment; first cut**

Make immutable wording identity and exact ordered revision membership the authoritative passage model; treat similarity-linked slots solely as optional interpretations. The acceptance gate must validate membership by revision ID, including same-second edits, rather than demand impossible timestamp distinctions.

Cut the MCP endpoint first: it adds another temporal enforcement surface without improving the two-minute investigation.

VERDICT: SIGN WITH AMENDMENT — Evidence must follow exact revisions; inferred lineage cannot establish claims.
