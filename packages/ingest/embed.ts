/**
 * Gives every wording a vector, the most edited articles first. A wording
 * with a row in passage_vector is embedded, so the job can stop at any time
 * and carry on later, and search works on whatever is done so far.
 *
 *   node embed.ts                    live wordings of every article
 *   node embed.ts --history 300      first the whole history of the 300
 *                                    most edited articles
 *   node embed.ts --pages 1256,1150  the whole history of these articles
 *
 * Ollama answers one request at a time per model, so a question asked
 * while this job runs waits for a whole batch, about two seconds. Give the
 * job an Ollama of its own and questions are answered at once:
 *
 *   OLLAMA_HOST=127.0.0.1:11435 ollama serve
 *   OLLAMA_URL=http://127.0.0.1:11435 node embed.ts
 */
import { db, toVector } from "@wtt/package-db";
import { embed, passageInput } from "@wtt/package-models";

const BATCH = 64;
const AT_ONCE = 2;

type Wording = { hash: Buffer; title: string; text: string };

const argument = (name: string) => {
  const at = process.argv.indexOf(name);
  return at === -1 ? undefined : process.argv[at + 1];
};

// A wording counts when it stands today, or when it stood for a day in
// total: most of what lived shorter is vandalism caught within minutes.
const missing = (history: boolean) => `
  SELECT t.hash, r.title, t.text
  FROM (
    SELECT hash
    FROM passage ${history ? "FOR SYSTEM_TIME ALL" : ""}
    WHERE page_id = ?
    GROUP BY hash
    ${
      history
        ? `HAVING MAX(row_end) > NOW()
             OR SUM(TIMESTAMPDIFF(SECOND, row_start, row_end)) >= 86400`
        : ""
    }
  ) AS p
  JOIN passage_text AS t USING (hash)
  JOIN revision AS r ON r.page_id = ?
  LEFT JOIN passage_vector AS v USING (hash)
  WHERE v.hash IS NULL AND t.kind IN ('prose', 'list') AND t.chars >= 40`;

let done = 0;
let chars = 0;
const started = performance.now();
let lastLine = 0;

const report = (page: string, force = false) => {
  const now = performance.now();
  if (!force && now - lastLine < 5_000) return;
  lastLine = now;

  const seconds = (now - started) / 1_000;
  console.log(
    `${done.toLocaleString("en")} wordings in ${seconds.toFixed(0)} s ` +
      `(${(done / seconds).toFixed(1)}/s, ${Math.round(chars / seconds).toLocaleString("en")} chars/s), at ${page}`,
  );
};

const embedPage = async (pageId: number, history: boolean) => {
  const wordings = await db().query<Wording>(missing(history), [
    pageId,
    pageId,
  ]);
  if (wordings.length === 0) return;

  const batches: Wording[][] = [];
  for (let i = 0; i < wordings.length; i += BATCH) {
    batches.push(wordings.slice(i, i + BATCH));
  }

  const work = async () => {
    for (let batch = batches.shift(); batch; batch = batches.shift()) {
      const vectors = await embed(
        batch.map((w) => passageInput(w.title, w.text)),
      );

      await db().batch(
        "INSERT IGNORE INTO passage_vector (hash, embedding) VALUES (?, ?)",
        batch.map((w, i) => [w.hash, toVector(vectors[i])]),
      );

      done += batch.length;
      chars += batch.reduce((sum, w) => sum + w.text.length, 0);
      report(wordings[0].title);
    }
  };

  await Promise.all(Array.from({ length: AT_ONCE }, work));
};

/**
 * Embeds an article and, when the database or Ollama is briefly away,
 * waits and tries again. The job runs for hours, and one restart of
 * either should not end it.
 */
const patiently = async (pageId: number, history: boolean) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await embedPage(pageId, history);
    } catch (error) {
      if (attempt === 60) throw error;

      console.log(`waiting to try again: ${(error as Error).message}`);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
};

const byEdits = async (limit?: number) =>
  (
    await db().query<{ page_id: number }>(
      `SELECT page_id FROM edit GROUP BY page_id ORDER BY COUNT(*) DESC
       ${limit ? `LIMIT ${Number(limit)}` : ""}`,
    )
  ).map((row) => row.page_id);

const only = argument("--pages");
const deep = argument("--history");

if (only) {
  for (const page of only.split(",").map(Number)) await patiently(page, true);
} else {
  if (deep) {
    for (const page of await byEdits(Number(deep))) await patiently(page, true);
    console.log(`history of the ${deep} most edited articles is embedded`);
  }

  for (const page of await byEdits()) await patiently(page, false);
}

report("the end", true);
await db().end();
