# Round 2: Fable

## 1. Attack

**a) The gate certifies text, not lineage.** Any slot assignment, even random pairing, reproduces every block sequence. So claim biography, half-life, "reworded vs retracted" and "first written by X" rest on a heuristic nothing tests. Measured just now on _Suomen sisällissota_ (page 1150): 3,357 versions, 2,988 distinct sha1, **368 returns to an earlier exact state** (11%). A loader that diffs only consecutive versions gives a restored paragraph a new slot whenever the vandal's text was dissimilar, so the hero article's claims look "born" at the last revert.

**b) `ord` inside the versioned row.** A numeric midpoint key runs out after about 52 inserts into the same gap (DOUBLE), and "append above the category footer" is exactly that pattern; p99 articles have 437+ versions. Use a byte-string key that grows (`VARBINARY`), and never count an `ord`-only change as a new wording.

**c) "A pinned session cannot leak the future" is false. That was my overclaim.** `system_versioning_asof` pins versioned tables only. `passage_text`, `passage_vector` and the S vectors are unversioned, so a tool reading them directly sees every era. A session `SET` on a pooled connection also carries 2008 into the "now" panel. Verified alternative: `SET STATEMENT system_versioning_asof='2008-06-01' FOR SELECT …` works and leaves the session at `DEFAULT`. `validate` needs a leak test: a wording alive only in [a, b] is never returned outside it.

Smaller: the synthesis dropped "stemmed". Measure unstemmed FULLTEXT on the 37 questions before calling retrieval hybrid.

## 2. Slots vs hashes

I concede primacy to Astra. The certified model should be content-addressed: a system-versioned row keyed `(page_id, hash, dup)` that lives while that exact wording is present. A revert re-inserts the same key, so death and resurrection are ordinary history rows, and the gate proves all of it.

Slot survives as a non-key column, assigned in the same pass by a tiered rule: an unchanged hash keeps its slot; a hash seen before on this page revives its old slot; only the remainder is paired by similarity, stored with `sim` and `prev_hash`. This fits the thesis better too: rewording should be judged by vectors, not by a loader's lexical guess.

What would change my mind: 100 hand-checked similarity pairings from the hero articles at 95% precision or better, plus the invariant "equal sha1 implies equal (slot, hash) set" holding on every page. Then slot may be the key and half-life may be reported per slot.

## 3. Versioned vector table

Lab, with a promotion rule. Vectors are the scarce asset, so they live once per hash in a plain table that survives loader re-runs. History rows are immutable, so write-through embedding cannot fill a versioned vector table; it can only be a rebuildable projection (`INSERT … SELECT` of lifetimes joined to vectors, with `system_versioning_insert_history`).

Expected failure: each restore duplicates a vector, dead twins fill the top k, and early dates under-fill. Promote it to the hero statement only if recall@10 is at least 0.95 against exact search on 20 dates including 2006 to 2009. It is never the only path.

## 4. Amendment and first cut

**Amendment:** hash is the key, slot is a scored column. Anything shown as evidence (citations, lifetimes, exposure, "this wording first appeared in oldid N") comes from hash intervals. Anything that depends on similarity pairing is labelled interpretation and shows its `sim`. `validate` checks the revert invariant.

**Cut first:** the MCP endpoint. It has no moment in the two-minute story and adds a second API to validate.

VERDICT: SIGN WITH AMENDMENT. Gate proves text, not lineage; certify hashes, label slots interpretation.
