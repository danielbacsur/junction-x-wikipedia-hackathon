/**
 * Times what the pages do, on the loaded database: how long reading an
 * article on a date takes, comparing two dates, gathering the evidence for
 * a question, tracing a claim. Each operation runs on many articles and
 * dates, and the report gives the median and the slowest in twenty.
 *
 *   node bench.ts                    print the table
 *   node bench.ts --out file.json    also write it as json
 */
import { readFile, writeFile } from "node:fs/promises";

import { db } from "@wtt/package-db";
import {
  compareArticle,
  gatherEvidence,
  readArticle,
  readTimeline,
  searchArticles,
  traceClaim,
} from "@wtt/package-engine";

type Timed = { total: number; sql: number };

const time = async (work: () => Promise<{ sql: { ms: number }[] } | null>) => {
  const started = performance.now();
  const result = await work();

  return {
    total: performance.now() - started,
    sql: result?.sql.reduce((sum, statement) => sum + statement.ms, 0) ?? 0,
  };
};

const at = (values: number[], share: number) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * share))
  ];

const pages = (
  await db().query<{ page_id: number; year: number }>(
    `SELECT page_id, YEAR(first_edit) + 1 + FLOOR(RAND(3) * 12) AS year
     FROM page_stats WHERE edits >= 50 ORDER BY RAND(3) LIMIT 60`,
  )
).map((row) => ({ page: row.page_id, year: String(Math.min(row.year, 2025)) }));

const questions = (
  await readFile(new URL("./eval/test-questions.tsv", import.meta.url), "utf8")
)
  .split("\n")
  .slice(1)
  .filter(Boolean)
  .map((line) => line.split("\t")[1]);

const claims = [
  "Talvisodassa kaatui noin 25 000 suomalaista sotilasta",
  "Urho Kekkonen oli presidenttinä yli 25 vuotta",
  "Suomen sisällissota käytiin vuonna 1918 punaisten ja valkoisten välillä",
  "Suomi julistautui itsenäiseksi 6. joulukuuta 1917",
  "Moskovan rauha solmittiin maaliskuussa 1940",
  "Suomi liittyi Euroopan unioniin vuonna 1995",
  "Mannerheim toimi ylipäällikkönä talvisodassa ja jatkosodassa",
  "Isoviha oli Venäjän miehitys Suomessa suuren Pohjan sodan aikana",
];

const operations: [string, string, (() => Promise<Timed>)[]][] = [
  [
    "read an article on a date",
    "every block that stood that day, with the edit that wrote it",
    pages.map(
      ({ page, year }) =>
        () =>
          time(() => readArticle(page, year)),
    ),
  ],
  [
    "an article's whole timeline",
    "edits, reverts and disputes per month from the slim edit table",
    pages.map(
      ({ page }) =>
        () =>
          time(() => readTimeline(page)),
    ),
  ],
  [
    "compare two dates",
    "blocks that stood on exactly one of the two days",
    pages.map(
      ({ page, year }) =>
        () =>
          time(() => compareArticle(page, year, null)),
    ),
  ],
  [
    "find articles",
    "vectors, titles and stemmed passages fused in one statement",
    questions.map((question) => () => time(() => searchArticles(question))),
  ],
  [
    "gather evidence as of a date",
    "embed the question, route to articles, exact passage search that day",
    questions.map((question, index) => async () => {
      const date = String(2006 + (index % 18));

      // Asked once before it is timed: the first time a question reaches
      // articles nobody has asked about, their passages for that date are
      // embedded on the spot, which is a cost paid once per article and date.
      await gatherEvidence(question, date);

      return time(() => gatherEvidence(question, date));
    }),
  ],
  [
    "trace a claim through all of history",
    "nearest wordings ever written, with every stretch each one stood",
    claims.map((claim) => () => time(() => traceClaim(claim))),
  ],
];

const rows = [];

console.log(
  "| Operation | Runs | Median | Slowest in 20 | Of which SQL (median) |",
);
console.log("|---|---|---|---|---|");

for (const [name, about, runs] of operations) {
  // Once without measuring, so the first run does not pay for a cold cache.
  await runs[0]();

  const timed: Timed[] = [];
  for (const run of runs) timed.push(await run());

  const row = {
    name,
    about,
    runs: timed.length,
    medianMs: Math.round(
      at(
        timed.map((t) => t.total),
        0.5,
      ),
    ),
    p95Ms: Math.round(
      at(
        timed.map((t) => t.total),
        0.95,
      ),
    ),
    sqlMedianMs: Math.round(
      at(
        timed.map((t) => t.sql),
        0.5,
      ),
    ),
  };

  rows.push(row);
  console.log(
    `| ${name} | ${row.runs} | ${row.medianMs} ms | ${row.p95Ms} ms | ${row.sqlMedianMs} ms |`,
  );
}

const out = process.argv.indexOf("--out");

if (out !== -1 && process.argv[out + 1]) {
  await writeFile(
    process.argv[out + 1],
    `${JSON.stringify({ measuredAt: new Date().toISOString(), operations: rows }, null, 2)}\n`,
  );
}

await db().end();
