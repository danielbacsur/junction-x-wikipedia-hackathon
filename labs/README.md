# Labs

Experiments that go past the brief. Each lab asks one question, answers it
with measurements on the real data, and writes down what it found, including
when the answer is "no". The product only adopts what a lab has proved.

## Rules for a lab

- One folder per lab: `labs/<slug>/`. Touch nothing outside it.
- `README.md` is the deliverable, in this order: the question, what we
  found (numbers first), how it was measured, the exact SQL, what did not
  work, and what the product should do with it.
- Results a page could draw go in `labs/<slug>/data/*.json`, small and
  self-describing (an object with `title`, `unit`, `source` and `rows`).
- Scripts are Python run with `uv run` and inline dependencies, or plain
  SQL files. No npm installs, no edits to `package.json`.
- The database is shared. Read the core tables freely, never write to them.
  A lab's own tables live in its own database named `lab_<slug>`.
- Do not commit. The lead reviews and commits a lab's folder.
- Every number in the README must be reproducible by a command in it.

## The data a lab can read

MariaDB 12.3.3 on `127.0.0.1:3310`, database `wtt`, user `wtt`, password
`wtt` (root password `wtt` for creating a lab database).

| Table                               | What it holds                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `revision`                          | system-versioned: one row per article, 862,076 versions as history rows with wikipedia's real edit times; raw wikitext in `text`                              |
| `edit`                              | one slim row per version: `seq`, `saved_at`, `ended_at`, `user`, `editor` (named, ip, temp, hidden), `bytes`, `delta`, `restores`, `undone_by`, `reverted_by` |
| `passage`                           | system-versioned: one row per stretch a wording stood in an article, with `born_rev`, and `slot`, `prev_hash`, `sim` as our reading of which paragraph it is  |
| `passage_text`                      | every distinct wording once, by hash: `kind`, `wikitext`, clean `text`, Finnish `stems` with a full-text index                                                |
| `passage_vector`                    | bge-m3 vector per wording, as far as the embedding job has come                                                                                               |
| `office_term`                       | system-versioned with an application-time period: the terms of office the presidents' infoboxes stated                                                        |
| `article`                           | current clean text: 568,416 Finnish articles, plus Swedish and English for the history of finland set (`history = 1`)                                         |
| `article_vector`                    | bge-m3 vector per history of finland article, HNSW index                                                                                                      |
| `category_link`, `article_category` | the Finnish category tree                                                                                                                                     |

The same data as Parquet is in `data/s`, `data/m` and `data/l`, which DuckDB
reads directly and is often the faster way to explore.
