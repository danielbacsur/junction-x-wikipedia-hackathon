# The two-minute walk

One path through the product that shows both tracks of the challenge: an
answer pinned to a date, and how the text behind it changed. Every step is
an address, so nothing has to be typed.

Open each address once before showing it. The first load of a page compiles
it, and the first time a question reaches an article its passages for that
date are embedded on the spot.

## The path

1. **Ask, 0:00 to 0:35.**
   `/?q=Kuinka%20monta%20suomalaista%20kaatui%20talvisodassa%3F&date=2007`

   The same question on two dates. Passage 1 on the left says 26 600 dead,
   passage 1 on the right says 26 662, and the changed words are marked on
   both. Open "SQL behind these passages" under either answer: the red
   `FOR SYSTEM_TIME AS OF` and `VEC_DISTANCE_COSINE` stand in one statement.

2. **The life of that paragraph, 0:35 to 0:55.**
   `/read/Talvisota?date=2007-12-31&claim=0CED976AFA46F845`

   Or click "life of this paragraph" on passage 1. This wording stood for 14
   months in three stretches. An account removed it on 11 Jan 2008 at 18:43
   and it was back at 18:45. Each stretch is a history row of the passage
   table.

3. **The article moving, 0:55 to 1:10.**
   `/read/Talvisota?date=2008-12-31&from=2007-12-31`

   A year of edits, word by word. Then "stop comparing" and "Replay its
   history" for a few seconds: one year a step, new paragraphs in green.

4. **Trace, 1:10 to 1:30.**
   `/trace?claim=Talvisodassa%20kuoli%2026%20662%20suomalaista%20sotilasta`

   One sentence, and every wording that meant it since 2003. The paragraph
   said 22 800 at first, then 26 600, and 26 662 was first written on 22 Aug 2009. The drawer shows `FOR SYSTEM_TIME ALL`.

5. **Two timelines, 1:30 to 1:48.**
   `/atlas/presidents`

   Who was president on 1 March 1925? Click "end of 2006", "end of 2008",
   "end of 2012" and "latest": the answer changes each time. One table holds
   when a term was and when Wikipedia said so.

6. **Method, 1:48 to 2:00.**
   `/method`

   The table, the first finding (a vector index searched as of a date found
   13 % of the true neighbours, so the product does not do that) and the
   eight checks that passed.

## For a longer look

- **Agent**, `/agent`: click the question about the president of 1 March 1925. Gemini picks the lookup, and the panel shows the row MariaDB returned and the SQL.
- **Atlas**, `/atlas`: what the labs measured about the edits themselves, each section with its SQL.
- **MCP**: `claude mcp add --transport http palimpsest http://localhost:3000/mcp`, then ask another assistant what Wikipedia said on a day.

## Where it is weakest

- Answers use Gemini through Vercel AI Gateway with AI_GATEWAY_API_KEY. Every released sentence has valid passage citations and matching numbers; semantic entailment still needs reader judgment. Embeddings remain local bge-m3.
- Only wordings with a vector can be found by meaning, and the job that computes them is still running. Trace says how many had one when last counted.
