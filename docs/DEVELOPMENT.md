# Palimpsest — development notes

[Back to the overview](../README.md)

Setup, implementation details and research notes. File paths and commands are relative to the repository root.

## Run it

You need Node 24 or later, Docker, [Ollama](https://ollama.com) and the
GitHub CLI for the dataset downloads, plus a Vercel AI Gateway key for generation.

```bash
npm install
npm run db                     # MariaDB 12.3 (mariadb:lts) on port 3310

# the three datasets MariaDB publishes for the challenge, 966 MB
for set in s m l; do
  mkdir -p data/$set
  gh release download $set-2026-10 -R MariaDB/mariadb-wikipedia-datasets -D data/$set
done

npm run load                   # schema and every loader, about ten minutes
ollama pull bge-m3
export AI_GATEWAY_API_KEY=your-key   # keep the key out of source control
npm run embed                  # vectors for paragraphs, resumable, runs for hours
npm run dev                    # web on :3000, the historian agent on :3001
```

Search works on whatever is embedded so far, and paragraphs a question needs
are embedded on the spot. The whole path above was last run from an empty
database on 14 November 2026 and ended with the same counts and all checks
passing. To check everything against its sources:

```bash
npm run validate               # eight checks against the parquet files and wikipedia's sha1
npm run evaluate               # MariaDB's own 37 test questions
npm run bench                  # how long each page's work takes
npm test                       # unit tests, and engine tests against the loaded database
npm run e2e -w @wtt/app-web    # every journey in a real browser
```

Generation uses Gemini (`GEMINI_MODEL`, default `gemini-4-hydrogen`); paragraph stories use `GEMINI_STORY_MODEL` (default `gemini-4-argon`). All generation, images, structured answers and historian function calls use Vercel AI Gateway through the AI SDK. Set `AI_GATEWAY_API_KEY` locally; Vercel deployments can also authenticate with OIDC. Model IDs accept the `google/` prefix. Retrieval and bge-m3 embeddings stay local.

Ask translates a question into Finnish for retrieval and answers in its detected language. Only sentences with valid citations and matching numeric values are released; this does not prove semantic entailment. Office questions with an explicit day use application time and the selected Wikipedia system time. Trace accepts screenshots, pasted images and camera photos (PNG/JPEG/WebP, up to 8 MB); extracted claims must be reviewed before tracing. The paragraph panel can explain its complete linked wording history, refusing oversized inputs rather than truncating them.

Trace reports candidate and display counts, and computes earliest-found dates before display limits. Its nearest 300 vectors do not guarantee exhaustive recall. Later-reverted passages remain visible in historical answers with an annotation. The latest history is the 1 October 2026 snapshot.

Run `npm test` for offline checks. Run `npm run test:integration -w @wtt/package-engine` with the database, Ollama and gateway key to check the loaded dataset.

## How it works

One table carries the idea:

```sql
CREATE TABLE passage (
  page_id   INT UNSIGNED NOT NULL,
  hash      BINARY(8)    NOT NULL,      -- the wording, stored once in passage_text
  dup       SMALLINT UNSIGNED NOT NULL, -- nth copy within the article
  ord       VARBINARY(255) NOT NULL,    -- sorts the article's blocks
  gap       INT UNSIGNED NOT NULL,      -- empty lines right before it
  born_rev  INT UNSIGNED NOT NULL,      -- the version that wrote the wording
  slot      INT UNSIGNED NOT NULL,      -- our reading: which paragraph it is
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  PRIMARY KEY (page_id, hash, dup)
) WITH SYSTEM VERSIONING;
```

A loader walks every version of every article, cuts the wikitext into blocks
and compares each version with the one before. A block's row starts with the
edit that wrote its wording and ends with the edit that changed or removed
it, written with Wikipedia's real timestamps through
`system_versioning_insert_history`. Its history rows, joined where they
touch, are its lifetimes: a row also ends when a paragraph only moves. The
words sit once per wording in `passage_text` with Finnish stems and a
full-text index, the vectors in `passage_vector`, and time always comes from
joining the versioned table:

```sql
-- the article exactly as saved, rebuilt from its blocks
SELECT GROUP_CONCAT(CONCAT(REPEAT('\n', p.gap), t.wikitext)
                    ORDER BY p.ord SEPARATOR '\n')
FROM passage FOR SYSTEM_TIME AS OF TIMESTAMP '2008-12-31 23:59:59' AS p
JOIN passage_text AS t USING (hash)
WHERE p.page_id = 1256;
```

Hashing that result gives the sha1 Wikipedia published for the version.

The whole copies are kept too, in a system-versioned `revision` table like
the one in MariaDB's own demo but for all 19,742 articles, as the
authoritative source and as the baseline to compare against.

What MariaDB returns (a wording, its dates, who saved it) is treated as
evidence. What we infer (that two wordings are the same paragraph rewritten,
that a passage means what a question asks) is labelled as our reading and
shows its score. That line came out of an argument between two models
reviewing the design, and it is kept on every page.

## What we found

Measured on a MacBook with an M5 and 24 GB, MariaDB 12.3.3 in Docker.

1. **A versioned table can carry a vector index, and you should not search it
   as of a date.** The query runs and uses the index, but on 272,661 vectors
   with real edit lifetimes it found 13 % of the true ten nearest at
   `mhnsw_ef_search` 80 and 23 % at 1,000, because the time filter is applied
   to what the index returns. A plain vector table joined to lifetimes
   reached 46 % with 1,000 candidates, and 76.8 % of its answers were a full
   page with a true neighbour missing. Exact search over the passages alive in
   the routed articles has 100 % recall in 20 ms, so that is what the product
   does.
   ([labs/temporal-ann](../labs/temporal-ann/README.md))
2. **Full-text search skips history rows.** `MATCH … AGAINST` with
   `FOR SYSTEM_TIME ALL` returns current rows only. That is why wordings live
   in a plain table and only their presence is versioned.
3. **One common word turns a 50 ms full-text search into 25 seconds.** A
   table of how many wordings each stem is in lets search send only the rare
   stems and require the rarest.
4. **Paragraphs with lifetimes are sixteen times smaller than whole copies:**
   12.2 GB of wikitext in 862,076 versions is 0.75 GB as 1,630,250 distinct
   wordings and 2,972,662 lifetimes, and every version still rebuilds byte
   for byte.
5. **All 862,076 versions load in 103 seconds** with their real timestamps,
   about 8,000 a second. MariaDB's demo loaded 50 articles.
6. **The sequence engine turned a ten minute update into five seconds:**
   marking the versions a revert undid as a join on `seq_1_to_5000` instead
   of a range join.
7. **MariaDB has no Finnish stemmer,** so stems are a column, and
   Mannerheim, Mannerheimin and Mannerheimille become one word.
8. **Wikipedia's oldest sha1 values do not fit its own text:** a few
   versions from 2003 to 2005 were hashed before conversion to UTF-8.
9. **One table can hold both kinds of time, and its key guards only the
   present.** `PERIOD FOR valid_time` with `WITHOUT OVERLAPS` on a
   system-versioned table compares only rows with the same `row_end`, so it
   keeps today's statements from overlapping and leaves history as it was.
   The 25,715 times a version restated a president's term are 102 rows.
   ([labs/bitemporal-offices](../labs/bitemporal-offices/README.md))
10. **A revert is not proof an edit was wrong.** Counting every version
    between a revert and the text it restored marked up to 96 % of an
    often-vandalised article as undone. Only a revert that itself stood, and
    came within thirty days, takes a version out of what Wikipedia said.
11. **Reading an article as of a date walked every row it ever had.** MariaDB
    appends `row_end` to the primary key, so 6,463 rows were read for the 172
    blocks of Talvisota at the end of 2006. With both ends of the period in
    one key, `KEY (page_id, row_end, row_start)`, the same read fetches 173.
    The optimizer does not choose it for early dates, so the statements name
    it. ([labs/history-at-scale](../labs/history-at-scale/README.md))
12. **Yearly `SYSTEM_TIME` partitions next to a history loader returned two
    wrong answers:** rows loaded before the partitions existed stopped being
    found, and `AS OF` the last second of a year skipped that year. One
    history and one current partition had neither problem. Both are
    reproduced by a script in the same lab.

| Step                                                                      | Rows              | Time                     |
| ------------------------------------------------------------------------- | ----------------- | ------------------------ |
| History of Finland articles, three languages, with vectors and HNSW index | 29,460            | 31 s                     |
| All current Finnish articles with a full-text index                       | 568,416           | 222 s                    |
| Every version into the system-versioned table                             | 862,076           | 103 s                    |
| Slim edit table with reverts, derived in SQL                              | 862,076           | 22 s                     |
| Passage lifetimes, six processes                                          | 2,972,662         | about 2 min              |
| Stem counts                                                               | 205,939           | 17 s                     |
| Terms of office from 17,845 versions of the presidents' articles          | 102               | 25 s                     |
| Paragraph vectors with bge-m3 through Ollama                              | 20 to 40 a second | hours, in the background |

What the pages do, timed by `npm run bench` on the loaded database while the
embedding job was running:

| What a page does                     | Median | Slowest in 20 |
| ------------------------------------ | ------ | ------------- |
| Read an article on a date            | 9 ms   | 38 ms         |
| An article's whole timeline          | 1 ms   | 10 ms         |
| Compare two dates                    | 5 ms   | 17 ms         |
| Find articles                        | 114 ms | 618 ms        |
| Gather evidence as of a date         | 124 ms | 485 ms        |
| Trace a claim through all of history | 610 ms | 930 ms        |

Gathering evidence is timed the second time a question is asked. The first
time, passages nobody has asked about are embedded on the spot, which takes a
second or two. Writing the answer uses Gemini; provider latency is separate from the database timings in the table.

`npm run validate` passes eight checks: every row of the datasets is in the
database, stored text hashes to Wikipedia's sha1, 500 random moments return
the version an independent lookup says was live, same-second edits stay
distinct, sampled versions rebuild from their passages inside MariaDB, a
search pinned to a date never returns a wording outside its lifetime, every
cited passage stood in the version it links to, and every stated term of
office is written in the version cited for it.

## Labs

Separate agents explored ideas past the brief, each in its own folder with a
README of what it measured, including when the answer was no.

| Lab                                                           | What it found                                                                                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [temporal-ann](../labs/temporal-ann/README.md)                   | Vector search as of a date three ways: only exact search after the lifetime filter is correct.                                                                                        |
| [history-of-history](../labs/history-of-history/README.md)       | The naming of the 1918 war over 23 dates, the 70 % against 7 % revert asymmetry, and which years of history get written about.                                                        |
| [exposure-clock](../labs/exposure-clock/README.md)               | How long it took to undo an edit from 2004 to 2026, and what changed with temporary accounts in 2025.                                                                                 |
| [paragraph-survival](../labs/paragraph-survival/README.md)       | An exact wording has a half-life of 238 days; one written by a named account lasts sixteen times longer than an anonymous one.                                                        |
| [bitemporal-offices](../labs/bitemporal-offices/README.md)       | Terms of office with both kinds of time: who was president on a day, according to Wikipedia as of another day. The answer for 1 March 1925 has changed three times.                   |
| [sentence-journeys](../labs/sentence-journeys/README.md)         | Paragraphs that travel: 1,899 stood in more than one article, 85 bulk moves show articles being split, and a copy usually outlives its source.                                        |
| [claims-before-sources](../labs/claims-before-sources/README.md) | 191 paragraphs cite a first source published after the claim already stood. A manual audit of the top fifteen found no confirmed circular sourcing.                                   |
| [numbers-that-moved](../labs/numbers-that-moved/README.md)       | 6,840 times one number replaced another while the words around it stayed. The twenty least settled, read by hand, were updates to newer data and not disputes.                        |
| [history-at-scale](../labs/history-at-scale/README.md)           | What a versioned table costs as its past grows: which index makes an as-of read touch only the rows it returns, and what partitioning by year gets wrong.                             |
| [infobox-time-machine](../labs/infobox-time-machine/README.md)   | Every infobox field as a row with a lifetime: 211,379 lifetimes from all 862,076 versions, loaded in eight seconds, and the 150 times a stated birth or death date changed.           |
| [three-wikipedias](../labs/three-wikipedias/README.md)           | Finnish, Swedish and English disagree on a birth or death date in 313 of 3,305 shared topics, and the Finnish history shows who moved: a death in March 1918 became November in 2023. |

## Layout

```
apps/web            Next.js 16: the pages and the json routes under app/api
agents/historian    eve agent on Gemini with nine tools over the engine
packages/db         connection pool that records its SQL, schema, migrations
packages/wikitext   wikitext into blocks that rebuild exactly; cleaning; stems
packages/ingest     loaders, embedding job, validate, evaluate
packages/engine     search, time travel, comparison, tracing, evidence
packages/models     bge-m3 embeddings and the chat model
labs                experiments, one folder each
```

## What this is not

- Live Wikipedia. Histories end on 1 October 2026 and current article text is
  from August 2025.
- Complete. Only Finnish articles on the history of Finland have their
  history loaded, and vectors are still being computed for older wordings.
- Free of hindsight. Which article a question is about is decided with
  today's article vectors. What gets cited is decided from passages that
  stood on the date.
- A judge of intent. A revert is a revert, not an edit war, and a wording
  that vanished is not a retraction until a person has read it.

## Credits

The datasets, and the two demos this builds on, are by the
[MariaDB Foundation](https://github.com/MariaDB/mariadb-wikipedia-datasets).
Wikipedia's text is under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); every row
keeps the article's page id and revision id, so every result links back to
the version it came from. The code is under the [MIT licence](../LICENSE).

## Hosted demo backend

The Vercel frontend forwards `/api`, `/mcp` and `/eve` requests through a server-only authenticated backend connection (`BACKEND_URL` and `BACKEND_TOKEN`). The demo backend runs alongside the loaded MariaDB and local bge-m3 model. `scripts/backend-gateway.mjs` listens on loopback and requires the shared token; no database port is exposed. The historian authenticates the same service token.

`scripts/run-demo-backend.mjs` supervises the web server on 3100, gateway on 3101, historian on 3102, and a Cloudflare demo tunnel. Set `AI_GATEWAY_API_KEY`, `BACKEND_TOKEN`, and `HISTORIAN_URL=http://127.0.0.1:3102` privately. Build with that historian URL before starting. The current demo runs on the development Mac and requires it to stay online. A tunnel restart can change its hostname; update Vercel's `BACKEND_URL` and redeploy in that case. For permanent hosting, move the backend and database to an always-on host and use a stable hostname.
