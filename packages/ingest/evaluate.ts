/**
 * Measures how well search finds the right article, on the 37 questions
 * MariaDB wrote for its own demo (eval/test-questions.tsv, from
 * github.com/MariaDB/mariadb-vector-wikipedia-rag). Each has a question in
 * English, Swedish or Finnish and the Finnish article that answers it. A
 * hit is that topic in any language.
 *
 *   node evaluate.ts              every way of searching
 *   node evaluate.ts --misses     also list what each one missed
 */
import { readFile, writeFile } from "node:fs/promises";

import { db } from "@wtt/package-db";
import { gatherEvidence, searchArticles } from "@wtt/package-engine";

type Question = {
  lang: string;
  question: string;
  title: string;
  onlyFinnish: boolean;
  president: boolean;
  wikidataId: string | null;
  pageId: number;
};

type Mode = {
  name: string;
  about: string;

  /** The rank of the right topic, from 1, or null when it is not in the top ten. */
  rank: (question: Question) => Promise<number | null>;
};

const lines = (
  await readFile(new URL("./eval/test-questions.tsv", import.meta.url), "utf8")
)
  .split("\n")
  .slice(1)
  .filter(Boolean)
  .map((line) => line.split("\t"));

const questions: Question[] = [];

for (const [lang, question, title, existsIn] of lines) {
  const [article] = await db().query<{
    wikidata_id: string | null;
    page_id: number;
  }>(
    "SELECT wikidata_id, page_id FROM article WHERE lang = 'fi' AND title = ?",
    [title],
  );

  questions.push({
    lang,
    question,
    title,
    onlyFinnish: existsIn === "fi",
    president: /president|presidentti/i.test(question),
    wikidataId: article.wikidata_id,
    pageId: article.page_id,
  });
}

const articleRank =
  (mode: "vector" | "keyword" | "hybrid") => async (question: Question) => {
    const found = await searchArticles(question.question, { mode, limit: 10 });

    const place = found.hits.findIndex(
      (hit) =>
        (question.wikidataId !== null &&
          hit.wikidataId === question.wikidataId) ||
        (hit.lang === "fi" && hit.pageId === question.pageId),
    );

    return place === -1 ? null : place + 1;
  };

const modes: Mode[] = [
  {
    name: "article vector",
    about: "one bge-m3 vector per article, as in MariaDB's demo",
    rank: articleRank("vector"),
  },
  {
    name: "article keyword",
    about: "full-text search with the rare stems of the question as prefixes",
    rank: articleRank("keyword"),
  },
  {
    name: "article hybrid",
    about: "both fused by reciprocal rank in one statement",
    rank: articleRank("hybrid"),
  },
  {
    name: "passage evidence",
    about: "the articles of the passages an answer would cite, in order",
    rank: async (question) => {
      const evidence = await gatherEvidence(question.question);
      const pages = [
        ...new Set(evidence.sources.map((source) => source.pageId)),
      ];
      const place = pages.indexOf(question.pageId);

      return place === -1 ? null : place + 1;
    },
  },
];

const share = (ranks: (number | null)[], within: number) =>
  ranks.filter((rank) => rank !== null && rank <= within).length / ranks.length;

const summary = (ranks: (number | null)[]) => ({
  n: ranks.length,
  hit1: share(ranks, 1),
  hit5: share(ranks, 5),
  hit10: share(ranks, 10),
  mrr:
    ranks.reduce<number>((sum, rank) => sum + (rank ? 1 / rank : 0), 0) /
    ranks.length,
});

const percent = (value: number) => `${Math.round(value * 100)}%`.padStart(5);

const report: Record<string, unknown>[] = [];

for (const mode of modes) {
  const ranks: (number | null)[] = [];
  const times: number[] = [];

  for (const question of questions) {
    const started = performance.now();
    ranks.push(await mode.rank(question));
    times.push(performance.now() - started);
  }

  const groups = {
    all: ranks,
    "in English": ranks.filter((_, i) => questions[i].lang === "en"),
    "in Swedish": ranks.filter((_, i) => questions[i].lang === "sv"),
    "in Finnish": ranks.filter((_, i) => questions[i].lang === "fi"),
    "answer only in Finnish": ranks.filter((_, i) => questions[i].onlyFinnish),
    "about presidents": ranks.filter((_, i) => questions[i].president),
  };

  console.log(`\n## ${mode.name}: ${mode.about}\n`);
  console.log("| Questions | n | hit@1 | hit@5 | hit@10 | MRR |");
  console.log("|---|---|---|---|---|---|");

  for (const [label, group] of Object.entries(groups)) {
    const s = summary(group);

    console.log(
      `| ${label} | ${s.n} | ${percent(s.hit1)} | ${percent(s.hit5)} | ` +
        `${percent(s.hit10)} | ${s.mrr.toFixed(2)} |`,
    );
  }

  const median = [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)];
  console.log(
    `\nMedian ${median.toFixed(0)} ms per question, embedding included.`,
  );

  if (process.argv.includes("--misses")) {
    questions.forEach((question, i) => {
      if (ranks[i] === null || ranks[i]! > 5) {
        console.log(
          `  missed (${ranks[i] ?? "-"}): ${question.question} -> ${question.title}`,
        );
      }
    });
  }

  report.push({
    mode: mode.name,
    about: mode.about,
    medianMs: Math.round(median),
    groups: Object.fromEntries(
      Object.entries(groups).map(([label, group]) => [label, summary(group)]),
    ),
    misses: questions
      .filter((_, i) => ranks[i] === null || ranks[i]! > 5)
      .map((question) => question.question),
  });
}

const out = process.argv[process.argv.indexOf("--out") + 1];

if (process.argv.includes("--out") && out) {
  await writeFile(
    out,
    `${JSON.stringify({ measuredAt: new Date().toISOString(), questions: questions.length, modes: report }, null, 2)}\n`,
  );
}

await db().end();
