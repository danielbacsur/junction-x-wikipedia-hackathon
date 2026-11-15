# History at scale: what a versioned table costs as its past grows

## The question

How do MariaDB's system-versioned tables behave as history grows, and what
should a design do to keep "as of" fast at ten or a hundred times this size?

The table under test is `passage`: 2,972,662 rows over all time for 19,742
articles, 692,910 of them current. Its primary key is `(page_id, hash, dup)`,
and MariaDB appends `row_end` to it.

## What we found

Everything below is measured on MariaDB 12.3.3 unless a line says
"inferred". Times are medians of seven runs after a warm-up, with the
fastest and slowest run in brackets. The machine was busy, so only compare
numbers of the same run (the same letter in the table).

1. **A read of one article reads every row the article ever had, whatever
   the date.** Today's Talvisota: 6,463 rows read for 363 returned (18 to 1).
   Tarja Halonen: 23,975 for 435 (55 to 1), and the same 23,975 for the 124
   blocks of 31 Dec 2006 (193 to 1). The article with the most rows: 66,303
   rows read to return nothing at a date before it existed. Time follows the
   size of the history, not the date: 0.3 ms at 44 rows, 2 to 3 ms at 6,462,
   7 to 11 ms at 23,974, 18 to 30 ms at 66,302. Over the whole table a
   current read steps over 4.29 rows for each row it wants.
2. **One index fixes that without touching the table's layout.**
   `row_end` is the tail of the primary key, so it is also the tail of every
   secondary index. `KEY (page_id, row_end, row_start)` therefore holds both
   ends of the period, and the engine checks the whole AS OF condition inside
   the index. Rows handed to the server: rows returned plus one, at every
   date. Tarja Halonen went from 4.8–5.6 ms to 1.7–3.1 ms at the client, and
   from 3.5–4.1 ms to 0.33–1.7 ms inside the server.
   `KEY (page_id, row_start)` is the mirror image and wins for early dates
   (0.92 ms against 5.21 ms). `KEY (page_id, row_end)` alone is a trap: it is
   2 to 3.5 times slower than no index for early dates (12.9 ms against
   5.21 ms), because each entry needs a trip to the row to learn `row_start`.
3. **The optimizer does not pick the good index for early dates.** With all
   candidates present it stays on the primary key for Talvisota and Halonen
   at 2006 and 2012 (5.47 ms where the forced index takes 0.92 ms). It does
   pick an index for late dates and for today.
4. **Two partitions (history, current) make today's article independent of
   its past.** Halonen today: 436 rows and 14 pages instead of 23,975 rows
   and 140 pages; 0.15 ms inside the server instead of 9.2 ms in the same
   run. AS OF reads are unchanged. Counting all current rows: 80 ms instead of 323 ms.
5. **Yearly partitions prune only one side, and they gave two wrong
   answers.** AS OF skips the years before the date, never the years after:
   21 partitions for 2006, 15 for 2012, 8 for 2019, 2 for last month. The
   search join through `KEY (hash)` then dives into every partition left:
   7,105 rows read against 1,105, 9.3 ms against 1.5 ms. And MariaDB lost
   rows silently in two cases, both reproduced by a script here (see "What
   did not work").
6. **Per-article statements did not slow down from 3.0 to 11.9 million
   rows.** Talvisota: 1.86, 2.10, 2.13 ms at 1×, 2×, 4×, same rows read.
   The question about all articles at once did: 0.6 s, 0.6–1.1 s, then
   12–14 s at 4×, when the 1.9 GiB of rows no longer fit the 2 GiB buffer pool
   that every table shares.

### One article as of a moment (`blocks`)

Client time in milliseconds. Run A compares layouts, run B compares
indexes; each has its own flat baseline. `ps` is `KEY (page_id, row_start)`,
`per` is `KEY (page_id, row_end, row_start)`, both forced with a hint.

| article | rows, all time | as of | rows returned | rows read, flat | A: flat | A: two partitions | A: yearly partitions | B: flat | B: flat + `ps` | B: flat + `per` | rows read, `per` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| typical | 44 | 2006-12-31 | 3 | 45 | 0.30 (0.25–0.64) | 0.48 (0.31–1.05) | 0.82 (0.65–1.41) | 0.57 (0.34–0.75) | 0.37 (0.31–0.75) | 0.42 (0.32–0.82) | 4 |
| typical | 44 | 2019-12-31 | 11 | 45 | 0.29 (0.27–0.36) | 0.30 (0.29–0.35) | 0.35 (0.30–0.39) | 0.39 (0.35–0.62) | 0.30 (0.27–0.32) | 0.40 (0.35–0.41) | 12 |
| typical | 44 | now | 12 | 45 | 0.36 (0.31–0.77) | 0.32 (0.29–0.36) | 0.35 (0.33–0.74) | 0.38 (0.35–0.46) | 0.40 (0.36–0.40) | 0.41 (0.37–0.76) | 13 |
| Talvisota | 6,462 | 2006-12-31 | 172 | 6,463 | 2.42 (2.27–4.65) | 2.99 (1.99–4.63) | 2.05 (1.89–2.85) | 2.10 (1.94–2.33) | 1.03 (0.99–1.08) | 1.45 (1.34–1.68) | 173 |
| Talvisota | 6,462 | 2019-12-31 | 337 | 6,463 | 2.98 (2.62–3.41) | 4.37 (2.81–11.0) | 1.66 (1.45–1.78) | 2.55 (2.20–4.03) | 1.69 (1.62–2.31) | 1.43 (1.37–1.58) | 338 |
| Talvisota | 6,462 | now | 363 | 6,463 | 2.59 (2.47–5.55) | 1.91 (1.70–2.93) | 2.62 (2.51–3.25) | 2.89 (2.46–3.15) | 2.01 (1.85–2.27) | 1.52 (1.49–1.62) | 364 |
| Tarja Halonen | 23,974 | 2006-12-31 | 124 | 23,975 | 10.8 (6.99–13.4) | 8.62 (6.15–19.7) | 7.60 (5.41–14.4) | 5.21 (4.70–6.25) | 0.92 (0.88–0.98) | 2.36 (2.31–2.42) | 125 |
| Tarja Halonen | 23,974 | 2019-12-31 | 414 | 23,975 | 9.62 (7.97–13.4) | 10.2 (7.15–13.7) | 3.93 (2.48–4.37) | 5.55 (5.25–6.46) | 4.72 (3.91–14.6) | 3.08 (1.82–4.12) | 415 |
| Tarja Halonen | 23,974 | now | 435 | 23,975 | 9.04 (7.19–12.0) | 2.55 (2.14–3.96) | 2.21 (1.79–2.75) | 4.83 (4.73–5.34) | 2.82 (2.74–3.00) | 1.66 (1.58–1.93) | 436 |
| largest | 66,302 | 2006-12-31 | 0 | 66,303 | 14.9 (13.5–17.9) | 19.0 (15.0–20.0) | 18.6 (16.7–21.0) | 12.2 (11.7–13.8) | 0.31 (0.29–0.53) | 5.86 (5.62–5.99) | 1 |
| largest | 66,302 | 2019-12-31 | 494 | 66,303 | 18.9 (16.5–26.4) | 17.1 (16.0–19.1) | 24.9 (21.1–37.4) | 15.1 (13.4–17.1) | 1.92 (1.87–2.00) | 7.33 (6.85–8.12) | 495 |
| largest | 66,302 | now | 2,834 | 66,303 | 24.4 (21.8–41.0) | 14.3 (12.4–15.6) | 10.8 (8.40–20.0) | 17.6 (16.5–20.4) | 14.8 (11.6–15.6) | 8.91 (8.47–9.06) | 2,835 |

"typical" is page 43853 (the median article by rows), "largest" is page
1420428, a list article that exists since December 2017. Every statement,
article, date and layout is in [data/raw/tables.md](data/raw/tables.md) and
[data/timings.json](data/timings.json).

The client time hides most of the gain, because decoding a few hundred rows
in the Python driver takes one to two milliseconds by itself. One
`ANALYZE FORMAT=JSON` run of each statement shows what the server does
(rows handed over plus index entries checked / InnoDB page accesses /
milliseconds). Rows and pages are exact. The milliseconds are one run each,
so read them as rough, and compare A with A and B with B:

| article | as of | rows returned | A: flat | A: two partitions | A: yearly partitions | B: flat | B: flat + `ps` | B: flat + `per` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Talvisota | 2006-12-31 | 172 | 6,463 / 77 / 1.18 | 6,464 / 72 / 2.56 | 5,066 / 201 / 1.29 | 6,463 / 77 / 1.50 | 1,762 / 532 / 0.25 | 5,218 / 542 / 0.65 |
| Talvisota | 2019-12-31 | 337 | 6,463 / 77 / 1.19 | 6,464 / 72 / 1.12 | 1,349 / 73 / 0.32 | 6,463 / 77 / 1.21 | 5,796 / 1,044 / 0.57 | 1,679 / 1,023 / 0.40 |
| Talvisota | now | 363 | 6,463 / 77 / 1.87 | 364 / 14 / 0.16 | 364 / 14 / 0.22 | 6,463 / 77 / 1.13 | 6,826 / 1,125 / 0.70 | 364 / 1,097 / 0.24 |
| Tarja Halonen | 2006-12-31 | 124 | 23,975 / 140 / 7.70 | 23,976 / 150 / 10.07 | 20,686 / 368 / 10.25 | 23,975 / 140 / 4.11 | 3,558 / 398 / 0.32 | 20,790 / 431 / 1.71 |
| Tarja Halonen | 2019-12-31 | 414 | 23,975 / 140 / 9.38 | 23,976 / 150 / 5.44 | 2,015 / 79 / 0.55 | 23,975 / 140 / 3.92 | 22,796 / 1,326 / 2.19 | 2,422 / 1,256 / 0.62 |
| Tarja Halonen | now | 435 | 23,975 / 140 / 9.19 | 436 / 14 / 0.15 | 436 / 14 / 0.19 | 23,975 / 140 / 3.49 | 24,410 / 1,394 / 1.45 | 436 / 1,313 / 0.33 |
| largest | 2006-12-31 | 0 | 66,303 / 380 / 15.38 | 66,304 / 363 / 16.33 | 66,323 / 595 / 24.17 | 66,303 / 380 / 11.35 | 1 / 6 / 0.01 | 66,303 / 153 / 5.22 |
| largest | 2019-12-31 | 494 | 66,303 / 380 / 16.42 | 66,304 / 363 / 15.16 | 64,590 / 491 / 17.97 | 66,303 / 380 / 15.27 | 2,709 / 1,502 / 0.47 | 65,077 / 1,631 / 5.99 |
| largest | now | 2,834 | 66,303 / 380 / 16.94 | 2,835 / 40 / 1.03 | 2,835 / 40 / 1.39 | 66,303 / 380 / 11.46 | 69,137 / 8,763 / 6.82 | 2,835 / 8,520 / 2.15 |

Two things to read from it. An index plan checks few rows but walks the
primary key once per row it keeps (1,313 page accesses for 435 rows), and
those rows still sit among the article's history. Only the partition puts
today's rows on their own pages (14 instead of 140), which is what counts
once the table is larger than memory.

### Baseline on the real table

`wtt.passage`, plan `ref` on `PRIMARY` with `key_len` 4 (only `page_id`),
`Using where; Using filesort`, the same for every date and for no date.

| article | rows, all time | rows today | rows read per answer | ms over five dates |
| --- | --- | --- | --- | --- |
| small (80770) | 14 | 5 | 15 | 0.32–0.49 |
| typical (43853) | 44 | 12 | 45 | 0.30–0.38 |
| 95th percentile (8631) | 402 | 52 | 403 | 0.45–0.71 |
| 99th percentile (7649) | 1,000 | 245 | 1,001 | 0.65–1.41 |
| Talvisota (1256) | 6,462 | 363 | 6,463 | 1.96–3.02 |
| Tarja Halonen (1187) | 23,974 | 435 | 23,975 | 7.14–11.3 |
| largest (1420428) | 66,302 | 2,834 | 66,303 | 17.6–29.9 |

The other hot statements on the real table, same run:

| statement | case | rows returned | rows read | ms |
| --- | --- | --- | --- | --- |
| blocks joined to the wording | Halonen, now | 435 | 24,410 | 6.76 (5.86–10.9) |
| diff of two moments | Halonen, 2006 against now | 551 | 50,726 | 19.5 (13.7–27.6) |
| diff of two moments | largest, 2019 against now | 2,734 | 146,804 | 32.4 (31.1–36.4) |
| history of one wording | Talvisota | 28 | 29 | 0.71 (0.42–0.86) |
| history of one wording | Halonen | 1,563 | 3,127 | 7.62 (6.82–8.11) |
| history of one wording | largest | 44,797 | 44,798 | 233 (180–316) |
| search, 300 candidates | as of 2006 | 19 | 1,105 | 1.76 (1.49–2.03) |
| search, 300 candidates | now | 168 | 769 | 1.17 (1.07–1.76) |
| count of all passages | as of 31 Dec 2010 | 1 | 2,972,663 | 372 (329–474) |
| count of all passages | now | 1 | 2,972,663 | 433 (286–475) |

The diff reads the article twice, once per side. The history of one wording
is the only statement that reads just what it returns, because `hash` is in
the key prefix; its cost is the number of stretches. The largest article
has one wording with 44,797 rows: a table row without text that stands in
the article up to 536 times at once (`data/raw/busiest-wording.out`).

### What MariaDB does with the history

- `SHOW CREATE TABLE` prints `PRIMARY KEY (page_id, hash, dup, row_end)`.
  InnoDB lists the same four fields. History rows and the current row of one
  block are neighbours in the clustered index
  ([sql/where-history-lives.sql](sql/where-history-lives.sql)).
- A current read is rewritten to `row_end = TIMESTAMP'2106-02-07
  06:28:15.999999'`, an AS OF read to `row_end > T AND row_start <= T`.
  With only `page_id` given, neither can skip inside the article, because
  `hash` and `dup` stand between `page_id` and `row_end` in the key.
- `row_start` is in no index of the product's table. So an AS OF read must
  visit the row itself, and `COUNT(*)` as of a date cannot use a secondary
  index: the plan is `type: ALL`. A current-only `COUNT(*)` scans the whole
  `born_rev` index, 2,972,663 entries for 692,910 rows.
- The secondary indexes do carry `row_end`. The search join uses it:
  `KEY (hash)` checks `row_end > T` inside the index (541 entries checked
  for 300 candidates) and only then reads rows.

### The global question

"How many passages stood on 31 Dec 2010" has no way around reading every
row that started before the date or every row that ended after it.

| as of | flat, no index | optimizer's choice with both indexes | `KEY (row_start, row_end)` | `KEY (row_end, row_start)` |
| --- | --- | --- | --- | --- |
| 2006-12-31 | 344 ms, 2,972,663 rows | 28.7 ms, 257,491 entries, `se` | 33.8 ms | 352 ms, 2,806,802 |
| 2010-12-31 | 336 ms, 2,972,663 rows | 130 ms, 958,857 entries, `se` | 107 ms | 301 ms, 2,277,494 |
| 2019-12-31 | 425 ms, 2,972,663 rows | 177 ms, 1,426,703 entries, `es` | 235 ms, 2,044,590 | 179 ms |
| now | 263 ms, 2,972,663 entries | 52.9 ms, 692,911 entries, `es` | 313 ms, 2,972,663 | 51.9 ms |

Both indexes hold both period columns, so the scan never touches a row. The
optimizer picks the shorter side by itself. The gain is 12 times for an
early date, 5 times for today and 2 to 3 times in the middle. Yearly partitions do
the same as `KEY (row_end, row_start)`: 2,277,510 rows and 346 ms for 2010,
1,426,710 rows and 164 ms for 2019.

### Partitions: size, load, pruning

Load is one `INSERT … SELECT` per chunk with
`system_versioning_insert_history = 1`, eight chunks, history rows first and
current rows after.

| table | rows inserted | seconds | rows/s | data MiB | index MiB | files |
| --- | --- | --- | --- | --- | --- | --- |
| `p_flat`, unpartitioned | 2,972,662 | 68.8 | 43,207 | 480 | 440 | 1 |
| `p_hc`, history + current | 2,972,662 | 82.6 | 35,989 | 219 | 432 | 2 |
| `p_year`, 24 yearly + current | 2,972,662 | 57.8 | 51,430 | 229 | 479 | 25 |
| `p_idx`, flat + four period indexes | 2,972,662 | 81.9 | 36,296 | 480 | 1,059 | 1 |
| `p_hcp`, history + current + `ps` + `per` | 2,972,662 | 37.5 | 79,271 | 219 | 789 | 2 |
| `wtt.passage`, as the product loaded it | | | | 348 | 400 | 1 |

Load times differ by more than the layouts explain: the machine's other
work changed between loads (`p_hcp` ran in a quiet minute). Read them as
"partitioning did not make the load slower", not as a ranking.

The flat copy needs twice the data pages of the partitioned ones (480
against 219 MiB). The likely reason, not isolated here: in a flat table the
current rows are inserted between the history rows already there, which
splits pages, while each partition is filled in key order.

Pruning, for Talvisota:

| as of | partitions read (of 25) | rows read, yearly | rows read, flat |
| --- | --- | --- | --- |
| 2006-12-31 | 21 | 5,066 | 6,463 |
| 2012-12-31 | 15 | 2,301 | 6,463 |
| 2019-12-31 | 8 | 1,349 | 6,463 |
| 2026-09-30 | 2 | 571 | 6,463 |
| now | 1 | 364 | 6,463 |

The pruning is by `row_end` only. A row that stood on a date may have ended
in any later year, so every later partition is opened. Each one costs an
index dive even when it holds nothing for the article: the typical article
as of 2006 takes 0.82 ms in 21 partitions against 0.30 ms flat, and 142 page
accesses against 11.

### Two partitions plus the two indexes

The combination, against the real table in the same run
(rows handed over plus index entries checked after the slash):

| article | as of | rows returned | real table | optimizer's choice | forced `ps` | forced `per` |
| --- | --- | --- | --- | --- | --- | --- |
| Talvisota | 2006-12-31 | 172 | 1.90 (1.82–2.08) / 6,463 | 1.96 (1.85–2.43) / 6,464 `PRIMARY` | 0.95 (0.94–0.95) / 1,763 | 1.25 (1.22–1.43) / 5,219 |
| Talvisota | 2019-12-31 | 337 | 2.27 (2.23–2.63) / 6,463 | 2.50 (2.35–2.74) / 6,464 `PRIMARY` | 2.02 (1.71–6.29) / 5,797 | 1.55 (1.47–1.57) / 1,680 |
| Talvisota | now | 363 | 3.32 (2.45–5.23) / 6,463 | 1.36 (1.32–2.16) / 364 `PRIMARY` | 1.56 (1.49–1.78) / 727 | 1.49 (1.43–2.16) / 364 |
| Tarja Halonen | 2006-12-31 | 124 | 5.96 (5.72–6.51) / 23,975 | 8.16 (5.31–8.64) / 23,976 `PRIMARY` | 1.04 (1.00–1.61) / 3,559 | 2.78 (2.51–5.18) / 20,791 |
| Tarja Halonen | 2019-12-31 | 414 | 6.12 (5.64–7.01) / 23,975 | 1.80 (1.76–1.89) / 2,423 `per` | 3.10 (3.04–3.44) / 22,797 | 1.76 (1.73–1.84) / 2,423 |
| Tarja Halonen | now | 435 | 5.57 (5.37–6.69) / 23,975 | 1.56 (1.49–1.65) / 436 `PRIMARY` | 2.87 (2.29–3.97) / 871 | 2.77 (1.75–3.17) / 436 |
| largest | 2006-12-31 | 0 | 14.0 (12.7–20.6) / 66,303 | 0.44 (0.38–2.11) / 2 `ps` | 0.37 (0.34–0.41) / 2 | 6.75 (6.12–7.73) / 66,304 |
| largest | 2019-12-31 | 494 | 14.0 (12.9–15.9) / 66,303 | 2.03 (1.92–2.62) / 2,710 `ps` | 2.71 (2.06–4.15) / 2,710 | 8.12 (7.50–8.37) / 65,078 |
| largest | now | 2,834 | 19.6 (18.2–21.9) / 66,303 | 8.42 (7.98–12.9) / 2,835 `PRIMARY` | 9.02 (8.57–11.3) / 5,669 | 10.6 (9.35–11.7) / 2,835 |

Today's article needs no index at all in this layout: the primary key of
the current partition holds nothing else. For dates, `per` bounds the scan
by the rows that ended after the date and `ps` by the rows that started
before it. Neither is best everywhere; the worst case of either is a scan
of the article's index entries, never of its rows.

### Growth

One flat table with `ps` and `per`, grown by repeating the real rows under
shifted page ids, versions and hashes. The statements ask for the same
original articles at every size. Client ms / rows plus index entries.

| statement | article | as of | plan | 1× (3.0 M rows) | 2× (5.9 M) | 4× (11.9 M) |
| --- | --- | --- | --- | --- | --- | --- |
| blocks | typical | now | primary key | 0.33 (0.30–0.36) / 45 | 0.77 (0.61–1.12) / 45 | 0.40 (0.33–0.64) / 45 |
| blocks | Talvisota | 2006-12-31 | primary key | 1.86 (1.84–2.00) / 6,463 | 2.10 (2.01–2.14) / 6,463 | 2.13 (2.01–2.69) / 6,463 |
| blocks | Talvisota | 2006-12-31 | `ps` | 1.02 (0.93–2.04) / 1,762 | 1.14 (0.99–1.41) / 1,762 | 1.12 (1.09–1.22) / 1,762 |
| blocks | Talvisota | now | primary key | 2.46 (2.28–3.38) / 6,463 | 2.52 (2.44–2.89) / 6,463 | 2.29 (2.25–2.40) / 6,463 |
| blocks | Talvisota | now | `per` | 1.85 (1.43–2.24) / 364 | 1.50 (1.45–1.58) / 364 | 1.40 (1.38–1.73) / 364 |
| blocks | Tarja Halonen | 2006-12-31 | primary key | 5.79 (5.29–7.09) / 23,975 | 5.40 (5.30–7.31) / 23,975 | 5.51 (4.77–7.23) / 23,975 |
| blocks | Tarja Halonen | 2006-12-31 | `ps` | 0.91 (0.90–0.95) / 3,558 | 0.92 (0.87–1.22) / 3,558 | 0.97 (0.90–1.25) / 3,558 |
| blocks | Tarja Halonen | now | primary key | 5.81 (5.22–6.71) / 23,975 | 6.57 (5.63–8.64) / 23,975 | 6.91 (5.78–7.84) / 23,975 |
| blocks | Tarja Halonen | now | `per` | 1.63 (1.62–1.74) / 436 | 2.93 (2.15–3.80) / 436 | 3.08 (2.30–5.17) / 436 |
| blocks | largest | now | primary key | 17.9 (17.2–19.6) / 66,303 | 20.5 (19.8–24.0) / 66,303 | 20.9 (18.7–25.0) / 66,303 |
| blocks | largest | now | `per` | 8.95 (8.51–9.88) / 2,835 | 13.5 (10.3–18.4) / 2,835 | 13.1 (11.6–17.8) / 2,835 |
| diff | Tarja Halonen | 2006 against now | primary key | 9.53 (7.97–15.0) / 50,726 | 13.8 (10.9–17.4) / 50,726 | 9.98 (8.90–11.1) / 50,726 |
| wording | Tarja Halonen | all time | primary key | 7.87 (7.16–8.53) / 3,127 | 6.91 (6.64–8.34) / 3,127 | 9.53 (6.99–20.4) / 3,127 |
| search | 300 candidates | 2006-12-31 | `hash` | 1.75 (1.33–2.92) / 1,646 | 3.01 (2.48–4.24) / 1,646 | 2.20 (1.62–4.49) / 1,646 |
| count of all | | 2010-12-31 | full scan | 645 (510–775) / 2,972,663 | 635 (628–735) / 5,945,325 | 12,413 (10,615–18,135) / 11,890,649 |
| count of all | | now | `born_rev` scan | 263 (253–286) / 2,972,663 | 551 (516–603) / 5,945,325 | 1,264 (1,048–1,518) / 11,890,649 |

- Rows read per answer do not change with the table. Times stay within
  the noise of the machine for the primary-key plans. The `per` plan for
  today's Halonen and largest article took 1.5 to 1.9 times as long at 2×
  and 4× (1.63 to 3.08 ms). The table was then 2.3 and 4.7 GiB against a
  2 GiB buffer pool, so this is more likely page traffic than tree depth.
  Not separated here.
- The full scan is linear until the rows stop fitting in memory, then it
  falls off: 20 times the time for 4 times the rows. The index-only count
  of current rows stays linear (4.8 times).
- Load speed did not drop as the table grew: 43,207, 46,016, 53,083 and
  50,989 rows/s for the four copies, the last three with two more indexes.
- Size at 4×: 1,905 MiB data, 2,836 MiB indexes. An index on the period
  columns costs 55 to 63 bytes per row when the load fills it: 155 MiB each
  in `p_idx`, 179 MiB each in `p_hcp`, for 2,972,662 rows.
- Adding both indexes to the 1× table took 11.1 s; adding one took 7.3 s.

### What the full Finnish Wikipedia would need

Measured: 19,742 articles hold 2,972,662 rows (151 per article, median 44)
from 862,076 versions (3.45 rows per version). The real table takes 264
bytes per row with its indexes, the partitioned copy 230.

Inferred, not measured:

- **Rows.** 568,416 articles are 28.8 times this set. This set is the
  well-edited history of Finland, so 28.8 times is an upper bound for
  articles. A second bound: the highest version id here is 24.3 million,
  which counts every save on Finnish Wikipedia in every namespace, 28.2
  times the versions loaded. Both say **at most about 85 million rows**.
- **Size.** 85 million rows at 230 to 264 bytes are **20 to 22 GB**, plus
  about 5 GB for each index on the period columns. That is ten times the
  buffer pool this database runs with.
- **Per-article statements.** Same times as today while the article's pages
  are in memory, because the cost is the article's own history (measured to
  4×). Cold, the cost is page reads: 140 pages for Halonen in the flat
  table, 14 for her current rows in a current partition. The one run that
  caught a cold read here took 19 ms for 65 pages.
- **The global count.** A scan of about 20 GB from disk. At the 4× rate
  measured here (1.9 GiB in 12 to 14 s) that is about two and a half
  minutes. With `KEY (row_start, row_end)` it is an index-only scan of at
  most 5 GB.
- **`revision`** is the larger problem and was not tested: 6.0 GiB for
  862,076 versions today, so about 170 GiB at 28 times.

English Wikipedia has roughly a thousand times the versions of this set.
Nothing here was measured near that size. What carries over is the shape:
the flat layout's cost per read is the article's whole history, and the
most-edited English articles have tens of thousands of versions.

### Other things a MariaDB engineer may want to hear

- **Index merge where the primary key covers the predicate.** For
  `page_id = ? AND hash = ?` on the real table the optimizer picks
  `Using intersect(hash, PRIMARY)` for two of seven articles and reads
  3,127 entries for 1,563 rows. With more indexes on the table it did the
  same for the largest article: 89,595 reads for 44,797 rows, 225 ms
  against 183 ms.
- **Handler counters hide pushed-down checks.** With an index that holds
  the period, `Handler_read_next` equals rows returned. The entries the
  engine tested are in `Handler_icp_attempts` (20,665 for Halonen at 2006
  with `per`). Count both, or an index looks free.
- **`ANALYZE FORMAT=JSON` is not valid JSON when a condition holds a binary
  value.** A `BINARY(8)` string literal is printed back in
  `attached_condition` with its bytes. The backspace is escaped (`\b`), the
  byte 0x13 is not, and a strict parser stops there
  (`uv run analyze_json_check.py`).
- **`AS OF TIMESTAMP '2004-12-31'`** is an error (1525, incorrect DATETIME
  value). The literal needs a time.
- **`revision` as of a date** uses its primary key (`page_id`, range on
  `row_end`) and reads up to 2,271 rows for one answer. The product's
  `KEY (page_id, row_start)` was never chosen in 12 cases. Forced, it reads
  one row. Both take under 1.1 ms ([data/revision.json](data/revision.json)).
- **A current row can be inserted with its `row_end` spelled out**
  (`2106-02-07 06:28:15.999999`) under `system_versioning_insert_history`.
- **With two partitions and `KEY (page_id, row_start)` present, the global
  AS OF count scans that index** (it holds both period columns) and is
  slower than the row scan of the real table: 457 ms against 297 ms for 2010.

## How it was measured

- MariaDB 12.3.3 (`mariadb:lts`), aarch64, Docker VM with 8 GB,
  `innodb_buffer_pool_size` 2 GB, 16 KB pages. No server variable changed.
  One connection, one statement at a time.
- The machine was shared with an embedding job and other labs the whole
  time. The container used 4.2 to 4.7 GiB throughout. Absolute times moved
  by up to a factor of two between runs (flat Halonen: 9 ms in run A, 5 ms
  in run B). So: every comparison is between labels measured back to back
  for the same case, and tables say which run a column is from.
- Copies of `wtt.passage` live in `lab_history_at_scale`. Each was checked
  against the real table: same row count, same current count, same XOR of
  `CRC32(page_id, hash, dup, row_start, row_end)` over all rows
  (`data/raw/validate.out`).
- Per case and label: `EXPLAIN PARTITIONS`, one warm-up run, one run
  between two readings of `SHOW SESSION STATUS` (the difference of the
  `Handler_read_%` counters is "rows read", `Handler_icp_attempts` is "index
  entries checked"), seven timed runs, one `ANALYZE FORMAT=JSON`. Times are
  client wall time of execute plus fetch in PyMySQL. Caches are warm; no
  cold-cache series was made.
- Articles: four whose row count over all time is at the 10th, 50th, 95th
  and 99th percentile, picked among those that exist since before 2006;
  Talvisota; Tarja Halonen (the largest article that exists since 2003);
  and the article with the most rows. Dates: end of 2006, 2012 and 2019, 30 Sep 2026, and no date.
- The join to the wording selects `kind` and `chars` only, not the text, so
  the numbers are about the versioned table. The search takes 300 fixed
  hashes (`cand`), not a live vector search.
- Indexes are compared inside one table (`p_idx`) with `FORCE INDEX`, next
  to the optimizer's free choice and a flat copy without them.
- Growth repeats the real rows with `page_id + k × 2,000,000`,
  `rev_id + k × 100,000,000` and the last byte of the hash XOR `k`, so a
  copy is new articles with new wordings and the same lifetimes. It does
  not model longer histories per article.
- Peak size of the lab database: 4.1 GiB with four 1× copies, then 4.7 GiB
  for the 4× table alone.

## The exact SQL

The statements, as timed: [sql/hot-statements.sql](sql/hot-statements.sql)
and `SQL` in [bench.py](bench.py). The layouts: `LAYOUTS` in
[build.py](build.py).

```sql
-- every block of one article as of a moment
SELECT p.hash, p.dup, p.ord, p.gap, p.rev_id, p.born_rev, p.slot
FROM passage FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p
WHERE p.page_id = 1256
ORDER BY p.ord;

-- the same through an index that holds both ends of the period
SELECT p.hash, p.dup, p.ord, p.gap, p.rev_id, p.born_rev, p.slot
FROM p_idx FOR SYSTEM_TIME AS OF TIMESTAMP '2012-12-31 23:59:59' AS p
     FORCE INDEX (per)
WHERE p.page_id = 1256
ORDER BY p.ord;

-- the candidate indexes
ALTER TABLE p_idx
  ADD KEY pe  (page_id, row_end),             -- good today, a trap for early dates
  ADD KEY ps  (page_id, row_start),           -- best for early dates
  ADD KEY per (page_id, row_end, row_start),  -- exact today, bounded for dates
  ADD KEY se  (row_start, row_end),           -- the global count, early dates
  ADD KEY es  (row_end, row_start);           -- the global count, late dates, now

-- (b) history and current apart
CREATE TABLE p_hc (…) WITH SYSTEM VERSIONING
  PARTITION BY SYSTEM_TIME (PARTITION p_hist HISTORY, PARTITION p_cur CURRENT);

-- (c) one history partition per year, all made before the load
CREATE TABLE p_year (…) WITH SYSTEM VERSIONING
  PARTITION BY SYSTEM_TIME INTERVAL 1 YEAR
  STARTS '2003-01-01 00:00:00' PARTITIONS 25;

-- the load: history rows with both ends, current rows with their start
SET system_versioning_insert_history = 1;
INSERT INTO p_hc (page_id, hash, dup, ord, gap, rev_id, born_rev, slot,
                  prev_hash, sim, row_start, row_end)
SELECT page_id, hash, dup, ord, gap, rev_id, born_rev, slot, prev_hash, sim,
       row_start, row_end
FROM wtt.passage FOR SYSTEM_TIME ALL
WHERE page_id BETWEEN 0 AND 30000 AND row_end < '2100-01-01';
INSERT INTO p_hc (page_id, hash, dup, ord, gap, rev_id, born_rev, slot,
                  prev_hash, sim, row_start)
SELECT page_id, hash, dup, ord, gap, rev_id, born_rev, slot, prev_hash, sim,
       row_start
FROM wtt.passage WHERE page_id BETWEEN 0 AND 30000;

-- the global question
SELECT COUNT(*) FROM passage
FOR SYSTEM_TIME AS OF TIMESTAMP '2010-12-31 23:59:59';
```

What the engine reports for Talvisota as of 31 Dec 2010 on the real table
(`data/raw/analyze-core-blocks-talvisota-2010.json`):

```json
{
  "table_name": "p", "access_type": "ref", "key": "PRIMARY",
  "used_key_parts": ["page_id"], "r_rows": 6462, "r_filtered": 4.95,
  "attached_condition": "p.page_id <=> 1256 and p.row_end > TIMESTAMP'2010-12-31 23:59:59' and p.row_start <= TIMESTAMP'2010-12-31 23:59:59'",
  "r_engine_stats": { "pages_accessed": 80, "pages_read_count": 65, "pages_read_time_ms": 18.98 }
}
```

### Reproduce

```sh
cd labs/history-at-scale
M="docker exec -i wikipedia-through-time-mariadb-1 mariadb -uroot -pwtt -t --force"
L=lab_history_at_scale

$M < sql/setup.sql                           # database, page_rows, cand
uv run build.py create flat hc year idx      # four copies, about 5 minutes, 4.1 GiB

# run A: layouts
uv run bench.py layouts core=wtt.passage flat=$L.p_flat hc=$L.p_hc year=$L.p_year
# run B: indexes (per was added after the two smaller runs, as here)
uv run bench.py indexes-other flat=$L.p_flat idx=$L.p_idx --only=wording,search
uv run bench.py global-indexes flat=$L.p_flat idx=$L.p_idx \
  "idx_se=$L.p_idx@FORCE INDEX (se)" "idx_es=$L.p_idx@FORCE INDEX (es)" --only=global
$M lab_history_at_scale -e "ALTER TABLE p_idx ADD KEY per (page_id, row_end, row_start)"
uv run bench.py indexes flat=$L.p_flat idx=$L.p_idx \
  "idx_pe=$L.p_idx@FORCE INDEX (pe)" "idx_ps=$L.p_idx@FORCE INDEX (ps)" \
  "idx_per=$L.p_idx@FORCE INDEX (per)" --only=blocks,blocks_text,diff

# growth: drops nothing itself, so make room first (peak 4.7 GiB)
uv run build.py drop hc year idx
./growth.sh                                  # adds ps and per, 1x, 2x, 4x, about 12 minutes
uv run build.py drop flat

# two partitions plus the two indexes
uv run build.py create hcp
uv run bench.py combined core=wtt.passage hc_auto=$L.p_hcp \
  "hc_per=$L.p_hcp@FORCE INDEX (per)" "hc_ps=$L.p_hcp@FORCE INDEX (ps)" --only=blocks,diff
uv run bench.py combined-other core=wtt.passage hc_auto=$L.p_hcp --only=wording,search,global
uv run build.py drop hcp

uv run revision_bench.py                     # data/revision.json
uv run analyze_json_check.py                 # the plan that is not valid JSON
$M < sql/where-history-lives.sql             # the key, the neighbours, the rewrite
$M < sql/revision-as-of.sql
$M < sql/misplaced-history.sql               # wrong answer 1, and the ALTER rules
$M < sql/pruning-last-second.sql             # wrong answer 2
$M wtt -e "SET time_zone='+00:00'; SELECT YEAR(row_end) AS ended, COUNT(*) AS n
  FROM passage FOR SYSTEM_TIME ALL GROUP BY 1" > data/raw/rows-by-end-year.out

uv run report.py > data/raw/tables.md        # data/*.json and every table above
```

The large copies are dropped. `lab_history_at_scale` now holds only
`page_rows` (1.5 MiB) and `cand` (300 rows). The commands above rebuild
everything. Raw records of every run, with plans, are in `data/raw/*.json`.

## What did not work

- **Yearly partitions made on demand lose history that was loaded before
  them.** `INTERVAL 1 YEAR … AUTO` starts with one history partition. A
  load with `system_versioning_insert_history` puts every history row into
  it, whatever its `row_end`, without a warning. The first ordinary
  `UPDATE` then creates the partitions up to today, and from that moment
  AS OF prunes the first partition for any later date. A row that stood
  from 2004 to 2010 was returned as of 2008 before the update and not
  after it. `SELECT … PARTITION (p0)` still shows it.
  [sql/misplaced-history.sql](sql/misplaced-history.sql) reproduces it.
  Creating all partitions first (`PARTITIONS 25`) places every row by the
  year it ended, and the lab's `p_year` matched the real table on every
  answer.
- **AS OF in the last second before a partition boundary skips the
  partition of that year.** `AS OF TIMESTAMP '2006-12-31 23:59:59'` reads
  partitions from 2007 on. A row that ended at `2006-12-31 23:59:59.500000`
  stood at that moment and is not returned; the same rows without
  partitions return it; asking for `23:59:58.999999` returns it.
  [sql/pruning-last-second.sql](sql/pruning-last-second.sql). The product
  asks for 23:59:59 by default. Wikipedia's timestamps are whole seconds, so
  no row of this data set is affected, and every count in the benchmark
  agreed across layouts.
- **`LIMIT` partitions** do not rotate during a history load (seven rows
  into the first partition of `LIMIT 2`) and have no time bounds, so AS OF
  reads all of them.
- **`KEY (page_id, row_end)`**, the obvious index, is slower than no index
  for early dates: 12.9 ms against 5.2 ms for Halonen at 2006, 42.7 ms
  against 12.2 ms for the largest article, 199,093 page accesses against
  380. It lacks `row_start`, so every entry costs a row lookup.
- **Yearly partitions for search.** Each candidate hash is looked up in
  every partition that pruning leaves: 6 times slower as of 2006, 5 times
  as of 2012, 3 times as of 2019, equal for last month and today.
- **Leaving it to the optimizer.** It finds the index for late dates and
  for today, not for early dates. `ANALYZE TABLE` was run on every copy.
- **Things a partitioned versioned table refuses.** Foreign keys
  (error 1506). `ADD COLUMN` without
  `SET system_versioning_alter_history = KEEP` (error 4119; `ADD KEY` is
  allowed without it). `SELECT … PARTITION (p) FOR SYSTEM_TIME ALL`
  (error 4142).
- **Not done.** No cold-cache series. No concurrent load. Subpartitions by
  `page_id` under `SYSTEM_TIME` were created but not measured. Only
  `passage` was copied; `revision` was read, not rebuilt. The 2× and 4×
  points were taken on the flat layout only. The loads are single runs.

## What the product should do with it

Nothing is slow today: the slowest per-article statement on the real table
is 30 ms, the typical one 0.3 ms. The changes below are for the table that
is ten or a hundred times larger.

1. **Add `KEY (page_id, row_end, row_start)` to `passage`** and name it in
   the statements that read one article (`FORCE INDEX`), because the
   optimizer will not choose it for early dates. Cost: about 60 bytes per
   row, 7 s to build on today's table, no change to the loader. Gain: an
   as-of read hands over only the rows it returns, at every date. If early
   dates matter more than recent ones for a statement, `KEY (page_id,
   row_start)` is the better of the two for it; having both costs about 120
   bytes per row.
2. **Partition `passage` into one history and one current partition before
   it outgrows memory.** Today's article then never pays for its past, and
   current rows sit on their own pages (14 against 140 for Halonen). The
   lab's load writes history the way the product's loader does and needed
   no change; whether the loader itself needs one was not tested. Price: no
   foreign keys on the table. Do it while the table is small; it is a
   rebuild.
3. **Do not partition by year, and never with `AUTO` next to a history
   loader.** Yearly pruning is one-sided, it taxes the search join and small
   articles, and it produced two wrong answers. Use yearly partitions only
   if old history must be dropped by `DROP PARTITION`, create them all
   before loading, and do not ask for the last second of a year.
4. **Answer questions about every article from a rollup, not from AS OF.**
   A count per day or per year kept in its own table is the only way we
   see that does not read a large share of the history (not built here). If an exact global AS OF is
   needed, `KEY (row_start, row_end)` makes it an index-only scan.
5. **Keep `KEY (page_id, row_end)` out.** It looks right and is the one
   index that made early dates slower than no index.

What to watch as it grows:

- rows over all time per current row (4.29 today): the factor a flat
  current read pays;
- the rows of the largest article (66,302 today, 20–30 ms per read): the
  worst case of every per-article statement;
- the size of the clustered index against the buffer pool: the global scan
  went from 0.6 s to 13 s the moment it stopped fitting;
- wordings repeated hundreds of times in one article (one has 44,797 rows
  and takes 0.2 s to list).

## Files

| File | What it holds |
| --- | --- |
| [data/timings.json](data/timings.json) | run A: every statement, article, date and layout |
| [data/indexes.json](data/indexes.json) | run B: the index plans and the global count |
| [data/rows-read.json](data/rows-read.json) | rows read per row returned, by layout, article and date |
| [data/inside-server.json](data/inside-server.json) | rows, index entries, pages and server time of one run |
| [data/combined.json](data/combined.json) | two partitions plus the two indexes |
| [data/growth.json](data/growth.json) | the series at 1×, 2× and 4× |
| [data/sizes.json](data/sizes.json) | load time and size of every copy |
| [data/rows-by-end-year.json](data/rows-by-end-year.json) | rows by the year their stretch ended |
| [data/revision.json](data/revision.json) | the revision table as of a date, two plans |
| [data/raw/](data/raw/) | full records with plans, logs, and the output of each SQL file |
| `build.py`, `bench.py`, `growth.sh`, `revision_bench.py`, `analyze_json_check.py`, `report.py`, `sql/` | everything that produced the numbers |
