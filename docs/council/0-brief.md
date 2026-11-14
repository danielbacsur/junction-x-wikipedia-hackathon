# Council brief: MariaDB "Wikipedia Through Time" at Junction 2026

You are one member of a small design council. Two different frontier models
get this same brief and write independent proposals; later rounds make you
argue with each other until you agree. Be opinionated, concrete and honest
about feasibility. Do not write code in this round.

## The situation

- Hackathon: Junction 2026, Espoo. Now: Saturday 14 Nov, about 11:40 EET.
  Hard submission deadline: Sunday 15 Nov 10:00 EET. The humans still need
  time for a 2-minute pitch video and a deck, so the build should be working
  and demoable by Saturday night, polished overnight.
- Team: two people plus AI coding agents that can work in parallel around the
  clock (this is the real build capacity: many agents, one laptop).
- The user's instruction: "do not only aim at the scope they provide ... I
  really want to push the boundaries of what we're capable of doing within
  this challenge." The whole platform must be end-to-end validated.

## The challenge (MariaDB, verbatim text)

Read line 230 of
the challenge text on the Junction platform
(one long line). Summary: build a tool for Wikipedia that does not exist yet
(or is badly underused) with MariaDB at the core. Tracks: RAG (native vector
search, grounded source-cited answers), SVT (system-versioned tables: what an
article said on a date, edit wars, how the story of an event was rewritten),
or BOTH ("what did Wikipedia say about this in 2015, and what has changed
since?"). Judging: effective and creative use of MariaDB RAG and/or
system-versioned tables; technical execution and scalability across the
provided datasets; real-world usefulness for Wikipedia readers or editors;
design and demo quality. SVT and BOTH get credit for added ambition.

Judges are MariaDB Foundation people. Their own demo READMEs are full of
measured numbers, "what we found" sections and the literal SQL behind every
page. Assume they value seeing the SQL, honest measurements, and creative use
of real MariaDB features.

## What MariaDB already published (the baseline to beat)

Full READMEs, read them:

- the README of github.com/MariaDB/mariadb-wikipedia-datasets
  (the datasets)
- the README of github.com/MariaDB/mariadb-vector-wikipedia-rag
  (RAG demo: cross-language search page only; "Ask", hybrid RRF and chunking
  not built; one vector per article misses facts inside long biographies)
- the README of github.com/MariaDB/mariadb-system-versioning-wikipedia
  (time machine: as-of view, timeline, reverts, diff, but only 50 articles;
  combining with RAG is "later")

Datasets (Finnish Wikipedia, being downloaded to
`/Users/danielbacsur/Workspaces/mariadb/data/{s,m,l}` as Parquet):

- S: History of Finland, current text, 19,285 fi + 4,921 sv + 5,254 en
  articles, clean Markdown, one ready bge-m3 vector (1024-dim) per article,
  category tree, wikidata ids linking languages.
- M: every saved version of 19,742 Finnish articles, 862,076 versions,
  2002 to 1 Oct 2026, raw wikitext (12.2 GB), with user, anonymous flag, edit
  comment, minor flag, sha1, bytes, parent_id, timestamp.
- L: all 568,416 Finnish articles, current text, no vectors, no categories.

## Hard facts about the environment

- One MacBook, Apple M5, 10 cores, 24 GB RAM, 600 GB free disk.
- MariaDB 12.3.3 (`mariadb:lts`) in Docker (Colima). Everything is built in:
  VECTOR + HNSW index (11.7+), system versioning incl.
  `system_versioning_insert_history` (real historical timestamps),
  application-time periods, FULLTEXT, recursive CTEs, window functions, JSON,
  COMPRESSED columns, partitioning by SYSTEM_TIME.
- Known: a partitioned table cannot hold a vector index. Unknown and
  untested: whether a system-versioned table can carry a VECTOR INDEX, and
  whether FULLTEXT covers history rows.
- Local models through Ollama: `bge-m3` embeddings (about 100 articles/min
  for whole articles, about 1,400 tokens/s, so embedding everything again or
  embedding all of L locally is not feasible: hours to days) and `gemma4:e2b`
  (5.2B params, tools + vision + thinking, 131k context). No cloud API keys
  are available right now. NVIDIA Nemotron 3.5 Super VL (OpenAI-compatible
  API, about 40 req/min free) may be added later through an env var.
- Stack convention (fixed, do not relitigate): TypeScript monorepo with npm
  workspaces and turborepo, Next.js 16 app in `apps/web`, eve agents (Vercel's
  agent framework, AI SDK 7) in `agents/*`, shared code in `packages/*`.
  Python scripts via `uv` are fine for experiments.

## Stackable side prizes (same project may enter)

Verda compute (their example: "embed MariaDB's full Wikipedia dataset with
batch jobs and serve a RAG assistant"), Best Use of Gemma, NVIDIA Nemotron
(must be core, vision-capable agent model), Gemini API, Modal, Oxylabs /
Context.dev (live web call at runtime with source URLs), plus the EUR 10,000
main prize by peer review (innovation, impact, implementation).

## What I want from you in this round

Write your proposal to the output file named in your task. At most 1,400
words. Sections:

1. **Thesis**: one sentence describing the product, who it is for, and why
   it could not exist without BOTH vector search and system versioning.
2. **Hero demo**: the 2-minute story you would show, step by step, with the
   one moment that makes a MariaDB engineer say "I did not know our database
   could do that".
3. **Feature set**, ranked: must-have core (what makes it a complete,
   validated platform), should-have, and cut list (tempting but not worth it).
4. **Data model and architecture**: the key tables and the two or three
   decisions that matter most (for example: how the 12.2 GB of version text
   is stored and queried; article-level vs chunk or sentence-level units;
   where vectors live relative to versioned data; what is precomputed).
   Name the MariaDB features each decision uses.
5. **Wild experiments**: five boundary-pushing ideas that go beyond the
   brief, each with: what it proves, how to test it in under two hours on
   this laptop, and what you would show if it works. Favour ideas where the
   database does something surprising, or where the data yields a finding
   nobody has published about Finnish Wikipedia.
6. **Risks**: the three things most likely to sink the project and how to
   defuse each.

Ground every claim about the data in the READMEs. If something needs a quick
check you can do with read-only commands, do it; do not download or install
anything and do not edit files other than your output file.
