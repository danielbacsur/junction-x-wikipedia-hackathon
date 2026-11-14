# Temporal ANN: does as-of vector search survive dead near-duplicates?

## Question

Should “semantic search as of a date” use (A) a versioned vector index, (B) a plain vector candidate search joined to historical lifetimes, or (C) exact distance after lifetime filtering? A may be promoted only with recall@10 ≥ 0.95 across 20 dates including 2006–2009.

## What we found

**Use C at the measured scale. Do not promote A or ship B as a correct historical top-10 search.** On 272,661 vectors from 4,030 articles, 50 held-out queries × 20 dates, A at ef_search=80 achieved **12.93% recall**, and ef_search=1000 reached only **22.64%**. C took **19.93 ms median / 37.40 ms p95**, evaluating 1,281–4,030 live vectors per date. Every A date failed the promotion threshold, at every tested ef_search.

All percentages below are shares of query/date pairs, except recall, which averages the fraction of the exact top 10 recovered. “Full but wrong” is unconditional: ten returned rows with at least one true neighbour missing. There were 1,000 pairs per configuration and 17,000 timed executions total.

| Method | ef | Recall@10 | Underfilled | Full but wrong | Median ms | p95 ms | Median handler reads |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 20 | 12.04% | 94.60% | 5.40% | 1.16 | 9.78 | 138.0 |
| A | 80 | 12.93% | 96.20% | 3.80% | 1.54 | 12.40 | 163.0 |
| A | 200 | 15.67% | 92.10% | 7.90% | 3.05 | 19.37 | 181.0 |
| A | 1000 | 22.64% | 82.10% | 17.90% | 12.52 | 73.52 | 218.0 |
| B50 | 80 | 7.49% | 100.00% | 0.00% | 0.76 | 2.12 | 251.0 |
| B200 | 80 | 19.95% | 100.00% | 0.00% | 1.15 | 3.07 | 1001.0 |
| B1000 | 80 | 45.86% | 19.30% | 76.80% | 3.11 | 8.37 | 3756.5 |
| C | 80 | 100.00% | 0.00% | 0.00% | 19.93 | 37.40 | 121563.5 |

### Dates: recall / underfilled / full but wrong

B uses ef=80; A is shown at ef=80 and 1000. Full metrics for every ef/date are in [recall.json](data/recall.json) and [latency.json](data/latency.json). C has recall 100% and no underfilled or wrong results throughout.

| June 1 UTC | Live rows | A80 | A1000 | B50 | B200 | B1000 |
| --- | --- | --- | --- | --- | --- | --- |
| 2006 | 1281 | 5.60% / 100.00% / 0.00% | 9.20% / 98.00% / 2.00% | 1.60% / 100.00% / 0.00% | 6.40% / 100.00% / 0.00% | 29.20% / 88.00% / 12.00% |
| 2007 | 2261 | 9.00% / 96.00% / 4.00% | 16.60% / 92.00% / 8.00% | 3.80% / 100.00% / 0.00% | 14.20% / 100.00% / 0.00% | 42.40% / 58.00% / 42.00% |
| 2008 | 2762 | 11.00% / 96.00% / 4.00% | 18.20% / 88.00% / 12.00% | 4.60% / 100.00% / 0.00% | 15.60% / 100.00% / 0.00% | 43.80% / 38.00% / 58.00% |
| 2009 | 3106 | 12.40% / 96.00% / 4.00% | 20.40% / 86.00% / 14.00% | 5.80% / 100.00% / 0.00% | 19.80% / 100.00% / 0.00% | 45.00% / 26.00% / 70.00% |
| 2010 | 3263 | 12.60% / 96.00% / 4.00% | 21.40% / 84.00% / 16.00% | 6.40% / 100.00% / 0.00% | 20.20% / 100.00% / 0.00% | 45.20% / 16.00% / 80.00% |
| 2011 | 3374 | 13.40% / 96.00% / 4.00% | 22.20% / 84.00% / 16.00% | 7.60% / 100.00% / 0.00% | 20.60% / 100.00% / 0.00% | 47.40% / 14.00% / 82.00% |
| 2012 | 3485 | 13.00% / 96.00% / 4.00% | 22.00% / 84.00% / 16.00% | 7.80% / 100.00% / 0.00% | 20.80% / 100.00% / 0.00% | 47.20% / 16.00% / 80.00% |
| 2013 | 3567 | 13.00% / 96.00% / 4.00% | 21.60% / 84.00% / 16.00% | 7.60% / 100.00% / 0.00% | 21.20% / 100.00% / 0.00% | 47.80% / 14.00% / 82.00% |
| 2014 | 3653 | 13.20% / 96.00% / 4.00% | 23.00% / 80.00% / 20.00% | 8.00% / 100.00% / 0.00% | 21.20% / 100.00% / 0.00% | 47.60% / 14.00% / 82.00% |
| 2015 | 3716 | 13.00% / 96.00% / 4.00% | 23.20% / 80.00% / 20.00% | 7.80% / 100.00% / 0.00% | 21.00% / 100.00% / 0.00% | 47.60% / 12.00% / 84.00% |
| 2016 | 3762 | 13.00% / 96.00% / 4.00% | 23.40% / 80.00% / 20.00% | 8.40% / 100.00% / 0.00% | 20.40% / 100.00% / 0.00% | 48.20% / 12.00% / 84.00% |
| 2017 | 3813 | 13.20% / 96.00% / 4.00% | 24.00% / 82.00% / 18.00% | 8.60% / 100.00% / 0.00% | 21.40% / 100.00% / 0.00% | 47.60% / 14.00% / 82.00% |
| 2018 | 3853 | 14.40% / 96.00% / 4.00% | 25.60% / 78.00% / 22.00% | 8.80% / 100.00% / 0.00% | 21.60% / 100.00% / 0.00% | 47.60% / 10.00% / 84.00% |
| 2019 | 3887 | 14.00% / 96.00% / 4.00% | 25.40% / 78.00% / 22.00% | 8.60% / 100.00% / 0.00% | 21.60% / 100.00% / 0.00% | 48.20% / 10.00% / 84.00% |
| 2020 | 3910 | 14.00% / 96.00% / 4.00% | 25.60% / 78.00% / 22.00% | 9.00% / 100.00% / 0.00% | 21.80% / 100.00% / 0.00% | 47.40% / 8.00% / 86.00% |
| 2021 | 3943 | 14.80% / 96.00% / 4.00% | 26.00% / 78.00% / 22.00% | 8.40% / 100.00% / 0.00% | 22.00% / 100.00% / 0.00% | 47.00% / 8.00% / 88.00% |
| 2022 | 3966 | 14.60% / 96.00% / 4.00% | 26.00% / 78.00% / 22.00% | 9.00% / 100.00% / 0.00% | 22.20% / 100.00% / 0.00% | 46.80% / 8.00% / 88.00% |
| 2023 | 3984 | 14.60% / 96.00% / 4.00% | 26.20% / 78.00% / 22.00% | 9.20% / 100.00% / 0.00% | 22.40% / 100.00% / 0.00% | 47.00% / 8.00% / 88.00% |
| 2024 | 4005 | 14.80% / 96.00% / 4.00% | 26.20% / 76.00% / 24.00% | 9.40% / 100.00% / 0.00% | 22.60% / 100.00% / 0.00% | 47.60% / 6.00% / 90.00% |
| 2026 | 4030 | 15.00% / 96.00% / 4.00% | 26.60% / 76.00% / 24.00% | 9.40% / 100.00% / 0.00% | 22.00% / 100.00% / 0.00% | 46.60% / 6.00% / 90.00% |

The earliest date has only 0.47% of indexed rows alive; even 2026 has only 1.48%. A80 recall rises from 5.60% in 2006 to 15.00% in 2026, but remains unusable. Raising ef helps overall recall while increasing cost; it does not make this query complete.

### Why an apparently successful B result is unsafe

At 2006-06-01, query 31, B1000/ef80 returns ten rows but misses the nearest true neighbour (id 197144, distance 0.3701316173) and id 178344 (0.3964929326); its last returned row has distance 0.4024212280. Full IDs and distances: [silent_failure.json](data/silent_failure.json). B1000 is full but wrong on 76.80% of all pairs; detecting only underfilled results cannot repair it.

To distinguish the candidate cap from ANN approximation, an additional control computes the **exact global** top K before time filtering, for the first ten held-out queries at all 20 dates:

| Exact global K | Recall | Underfilled | Full but wrong |
| --- | --- | --- | --- |
| 50 | 8.60% | 100.00% | 0.00% |
| 200 | 33.90% | 100.00% | 0.00% |
| 1000 | 94.75% | 12.00% | 0.00% |

An exact globally ordered candidate prefix that contains ten live rows necessarily contains the live top ten (absent ties). Thus the cap alone explains underfill; **ANN omissions explain full-but-wrong results**. Exact-global K=1000 improves recall to 94.75% on this smaller control, but still underfills 12% of pairs. This is not a production recommendation: obtaining exact global candidates scans the whole vector corpus.

Unfiltered top-10 ANN control (ten query vectors, no time predicate; revision-ID recall, not article recall):

| ef | A ALL recall | B recall |
| --- | --- | --- |
| 20 | 19.00% | 10.00% |
| 80 | 19.00% | 10.00% |
| 200 | 19.00% | 20.00% |
| 1000 | 49.00% | 30.00% |

Unfiltered ANN is already weak on this dense synthetic corpus. The experiment therefore demonstrates end-to-end failure under temporal crowding; it does not isolate a defect unique to system versioning. Revision-level recall also penalizes selection of a neighbouring wording from the same article.

### What the executor does

The original binary-literal plans are preserved in [plans.json](data/plans.json); [clean_plans.json](data/clean_plans.json) repeats EXPLAIN/ANALYZE with `@query_vector` for readable, valid JSON. Example from the timed run, query 0 at 2006-06-01, A/ef80:

```json
{
  "table_name": "a",
  "access_type": "index",
  "key": "embedding",
  "r_rows": 178,
  "attached_condition": "a.row_end > TIMESTAMP/*WITH LOCAL TIME ZONE*/'2006-06-01 00:00:00' and a.row_start <= TIMESTAMP/*WITH LOCAL TIME ZONE*/'2006-06-01 00:00:00'",
  "r_filtered": 0
}
```

At ef1000 the corresponding trace reads 1,608 rows and passes 0.124378109% (two rows). This proves the vector index is used and the time condition is attached to its returned rows. It also proves A can stop short despite thousands of live rows existing. It is **not** simply post-filtering exactly LIMIT=10 candidates: it reads hundreds or thousands. These plans do not prove a fixed internal candidate budget or the HNSW stopping algorithm. The defensible observation is bounded/incomplete index enumeration with filtering, not a guaranteed scan until ten live rows are found. B’s derived table materializes the candidate LIMIT before its lifetime join. C uses a covering lifetime range scan and primary-key vector lookups, followed by filesort; no vector index.

Handler counts are session deltas around the timed SELECT, with full counters in runs.jsonl. They count engine operations, including temporary-table work; they are not unique rows or HNSW node visits. ANALYZE includes actual executor rows and pages accessed.

### Build and disk cost

Insert time for all three tables: 132.45 s. HNSW build A: 132.73 s; B: 84.55 s. Both use M=16 and cosine.

| InnoDB tablespace | File MiB | Allocated bytes |
| --- | --- | --- |
| lab_temporal_ann/life | 36.00 | 37752832 |
| lab_temporal_ann/a | 1452.00 | 1522561024 |
| lab_temporal_ann/a#i#01 | 744.00 | 780148736 |
| lab_temporal_ann/b | 1448.00 | 1518399488 |
| lab_temporal_ann/b#i#01 | 740.00 | 775950336 |

The `#i#01` tablespaces are the vector indexes. `information_schema.TABLES.INDEX_LENGTH` reports only 16,384 bytes for each vector table and misses the separately stored HNSW size; use the tablespace measurements above. A/B table files include vector payload, primary index, and free space. life includes its primary and `alive` index. Raw byte counts and logical table/index sizes are in [corpus.json](data/corpus.json).

## How it was measured

- MariaDB 12.3.3, aarch64, local TCP port 3310; buffer pool 3 GiB and mhnsw cache limit 2 GiB. This is a shared laptop, not an isolated performance test. No global settings changed; one persistent connection, one heavy query at a time.
- Read-only source: 19,285 Finnish bge-m3 vectors from `wtt.article_vector`, joined by page_id to 858,533 `wtt.edit` revisions. Select the 30 largest complete histories (49,404 versions), then the 4,000 largest histories with at most 100 versions (ties by page_id). Total 272,661 versions / 4,030 articles; largest history 3,357. Selection is deliberately edit-heavy, not a random sample of Wikipedia. No history sampling, no fabricated lifetime gaps. All 26,232 revisions with undone_by set are retained because they were live at their historical time.
- Each version is treated as distinct wording. Start with the normalized real current vector; walk backwards in seq order, adding independent N(0,0.0006²) noise to each coordinate and normalizing after each step. This gives near-duplicate neighbours and drift that accumulates with version distance. It models temporal crowding, not measured semantic evolution. Real repeated wordings are not deduplicated: this is a stress case that production content hashing could reduce.
- NumPy seed 78231. Fifty query articles are sampled without replacement from outside the corpus; add per-coordinate N(0,0.001²), normalize. Persist query vectors and page IDs in queries.npz. These are current real vectors tested against historical synthetic variants; no claim of historical linguistic realism.
- Use real saved_at/ended_at, retaining microseconds, explicit history inserts, and only row_start for current versions. UTC session timezone. Validation finds zero lifetime or A/B vector mismatches. Three direct scans of A with its vector index disabled independently match C’s top-ten IDs.
- Dates: June 1 of 2006–2024, then 2026 (20 dates). Each query/date tests C once and A/B50/B200/B1000 at ef=20/80/200/1000. Fixed randomized method order per pair, chronological dates. Latency is client wall time including transfer, excluding SHOW STATUS and EXPLAIN/ANALYZE. No separately reported cold-cache trial or cache flush; results mostly reflect warm caches. No concurrency throughput or confidence intervals claimed.
- Exact C scans slim lifetimes first, then computes every live vector’s distance. No ANN shortlist enters the reference. Recall compares revision IDs; each selected article has exactly one live version. There are no exact top-ten distance ties in the recorded reference results. Full-but-wrong is measured against C, not inferred from result count.
- Raw outcomes, distances, timings, and counters: data/runs.jsonl. Chart-ready per-date and overall summaries: data/recall.json and data/latency.json. Plans and control outputs provide the failure evidence. Insertion order and random seeds are fixed, but rebuilt HNSW graphs, shared load, or changed source data may change results.

Reproduce from the repository root (all writes stay in this lab folder/database):

```sh
# To rerun just aggregation and this README from recorded measurements:
uv run labs/temporal-ann/bench.py summarize
uv run labs/temporal-ann/report.py

# Full rebuild: archive the previous data first if it exists.
# Choose an unused archive name before running:
mv labs/temporal-ann/data labs/temporal-ann/data.previous
uv run labs/temporal-ann/source_schema.py
uv run labs/temporal-ann/bench.py build
uv run labs/temporal-ann/validate.py
uv run labs/temporal-ann/bench.py benchmark
uv run labs/temporal-ann/controls.py
uv run labs/temporal-ann/unfiltered.py
uv run labs/temporal-ann/report.py
```

`build` drops/recreates only lab_temporal_ann.a, b, and life. Benchmark resumes incomplete runs from runs.jsonl; archive results before rebuilding so old IDs/results cannot be mixed with a new corpus. Every headline number is derived from these commands. Source schema/profile totals are reproducible from source_schema.py and profile.py.

## Exact SQL

Schema, inserts, and all executable parameterized queries are in bench.py. Core shapes:

```sql
CREATE TABLE a (
  id INT PRIMARY KEY, page_id INT, seq INT,
  embedding VECTOR(1024) NOT NULL,
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START,
  row_end TIMESTAMP(6) GENERATED ALWAYS AS ROW END,
  PERIOD FOR SYSTEM_TIME (row_start, row_end)
) WITH SYSTEM VERSIONING;
ALTER TABLE a ADD VECTOR INDEX embedding (embedding) M=16 DISTANCE=cosine;
SET system_versioning_insert_history=1;
-- Historical row:
INSERT INTO a(id,page_id,seq,embedding,row_start,row_end) VALUES(?,?,?,?,?,?);
-- Current row:
INSERT INTO a(id,page_id,seq,embedding,row_start) VALUES(?,?,?,?,?);

SET time_zone='+00:00';
SET mhnsw_ef_search=80;
-- A: tested, rejected for this corpus.
SELECT id,VEC_DISTANCE_COSINE(embedding,?) AS d
FROM a FOR SYSTEM_TIME AS OF TIMESTAMP ? ORDER BY d LIMIT 10;

-- B: tested for each literal K=50,200,1000; rejected as a correct top-10 search.
SELECT cand.id,cand.d
FROM (
  SELECT id,VEC_DISTANCE_COSINE(embedding,?) AS d
  FROM b ORDER BY d LIMIT 1000
) AS cand
JOIN life FOR SYSTEM_TIME AS OF TIMESTAMP ? AS l ON l.id=cand.id
ORDER BY cand.d LIMIT 10;
```

Product query C ([product.sql](product.sql)); bind a 4,096-byte little-endian float32 query vector and a UTC timestamp:

```sql
-- Bind ? as (raw little-endian float32 query vector, UTC as-of timestamp).
-- life: slim system-versioned lifetime table; b: one vector per wording.
-- STRAIGHT_JOIN makes the lifetime table drive vector lookups.
SET time_zone = '+00:00';
SELECT b.id, VEC_DISTANCE_COSINE(b.embedding, ?) AS distance
FROM lab_temporal_ann.life FOR SYSTEM_TIME AS OF TIMESTAMP ? AS l
STRAIGHT_JOIN lab_temporal_ann.b IGNORE INDEX (embedding) ON b.id = l.id
ORDER BY distance
LIMIT 10;
```

The measured `life` table has the same explicit period as A, an id primary key, and `KEY alive(row_end,row_start)`. B has id primary key and embedding VECTOR(1024). Production can omit B’s vector index entirely when only C is used; omit `IGNORE INDEX(embedding)` in that schema. STRAIGHT_JOIN preserves lifetime-first execution. This evaluates every live candidate even when historical rows outnumber them heavily.

To obtain readable plans, load the binary vector into `@query_vector`, substitute it for the first parameter, then prefix any SELECT with `EXPLAIN FORMAT=JSON` or `ANALYZE FORMAT=JSON`. controls.py does this for all methods at three dates and all ef values.

## What did not work

- Merely seeing the vector key in EXPLAIN did not establish correct historical retrieval. A failed every date, even at ef=1000.
- Raising ef was not a remedy; A1000’s p95 exceeded exact C’s while recall remained poor. Full A results were also wrong.
- B’s larger candidate lists help, but K≤1000 does not justify a correctness claim. A fallback only when fewer than ten rows are returned misses the silent errors.
- Raw binary vector literals in some MariaDB JSON plans contain invalid JSON escapes. The runner preserves the verbatim output; a session-variable rerun produces readable plans.
- A scratch script named inspect.py initially shadowed Python’s inspect module and broke NumPy import; renamed source_schema.py before corpus generation.
- This experiment does not establish a universal exact-search size cutoff, recall on real passage vectors, or production performance under concurrency. It measures one stressed corpus and one graph build for each design.

## What the product should do

**Always run C for this measured workload: up to 272,661 stored wordings and 4,030 simultaneously live vectors.** Use a slim indexed lifetime table to find live ids before fetching vector payload. The hero statement can be “exact semantic ranking of the vectors alive at the selected date,” with the synthetic-data limitation explicit in the demo; it cannot be “fast correct historical HNSW” on this evidence.

Do not promote A and do not select any tested K for B as the final historical answer. If a larger live corpus later makes exact latency unacceptable, benchmark a different index organization (for example date-specific snapshots) against the same exact reference. Retest the 0.95 promotion gate on real deduplicated passage lifetimes before changing this decision. The measured bound is on the live candidate count as well as total stored history; do not extrapolate the 20 ms median to hundreds of thousands of live vectors.
