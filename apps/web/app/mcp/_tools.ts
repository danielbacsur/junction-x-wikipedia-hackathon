import type { CallToolResult, McpServer } from "@modelcontextprotocol/server";
import {
  compareArticle,
  gatherEvidence,
  readArticle,
  readBiography,
  readTimeline,
  traceClaim,
  whoHeld,
} from "@wtt/package-engine";
import { z } from "zod";

const LATEST =
  "2026-10-01, the latest version in the dataset (not live Wikipedia)";

const date = z
  .string()
  .optional()
  .describe(
    'A year "2008" (its end), a month "2008-06" or a day "2008-06-01". ' +
      "Leave out for the latest version, 1 October 2026.",
  );

const article = z
  .string()
  .min(1)
  .describe(
    'The Finnish title of the article, such as "Talvisota", or its page id.',
  );

// Every tool only reads, and reads the same frozen dataset every time.
const annotations = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
};

const clip = (text: string, most = 1_500) =>
  text.length > most ? `${text.slice(0, most)}…` : text;

const result = (value: Record<string, unknown>): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  structuredContent: value,
});

const failed = (message: string): CallToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

/** Runs a tool and reports a bad date or a missing article as a tool error. */
const answering = async (
  work: () => Promise<Record<string, unknown> | null>,
) => {
  try {
    const value = await work();

    return value
      ? result(value)
      : failed("No such article among the 19,742 with history.");
  } catch (error) {
    return failed(error instanceof Error ? error.message : String(error));
  }
};

/**
 * The tools other agents get. An assistant that cites Wikipedia cites it as
 * of now; these let it ask what Wikipedia said on a day, and when a claim
 * first appeared, with the exact version behind every statement.
 */
export function registerTools(server: McpServer) {
  server.registerTool(
    "search_wikipedia_as_of",
    {
      title: "Search Wikipedia as of a date",
      description:
        "Find the paragraphs of Finnish Wikipedia about the history of Finland " +
        "that answer a question, as the articles stood on a date. Ask in any " +
        "language. Each passage comes with its article, the date its wording was " +
        "written, its author and a permanent link to the version that held it.",
      annotations,
      inputSchema: z.object({
        question: z
          .string()
          .min(2)
          .describe("What to look for, in any language."),
        date,
      }),
    },
    ({ question, date }) =>
      answering(async () => {
        const evidence = await gatherEvidence(question, date);

        return {
          asOf: evidence.at ?? LATEST,
          passages: evidence.sources.map((source) => ({
            article: source.title,
            text: clip(source.text),
            wordingWritten: source.bornAt.slice(0, 10),
            writtenBy: source.bornBy,
            paragraph: source.hash,
            versionThatDay: source.url,
          })),
          sql: evidence.sql,
        };
      }),
  );

  server.registerTool(
    "read_article_as_of",
    {
      title: "Read an article as of a date",
      description:
        "The paragraphs of one article as it stood on a date, each with the date " +
        "its wording was written and by whom. Give a Finnish keyword to get only " +
        "the paragraphs that contain it.",
      annotations,
      inputSchema: z.object({
        article,
        date,
        keyword: z
          .string()
          .optional()
          .describe("Only paragraphs containing this word."),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Skip this many paragraphs."),
      }),
    },
    ({ article, date, keyword, offset = 0 }) =>
      answering(async () => {
        const view = await readArticle(article, date);
        if (!view) return null;

        const wanted = keyword?.toLocaleLowerCase();
        const paragraphs = view.blocks.filter(
          (block) =>
            (block.kind === "prose" || block.kind === "list") &&
            (!wanted || block.text.toLocaleLowerCase().includes(wanted)),
        );

        return {
          article: view.title,
          asOf: view.at ?? LATEST,
          existed: view.exists,
          firstVersion: view.firstEdit.slice(0, 10),
          version: view.exists ? view.url : null,
          matched: paragraphs.length,
          next: offset + 8 < paragraphs.length ? offset + 8 : null,
          paragraphs: paragraphs.slice(offset, offset + 8).map((block) => ({
            text: clip(block.text),
            wordingWritten: block.bornAt.slice(0, 10),
            writtenBy: block.bornBy,
            references: block.references,
            paragraph: block.hash,
          })),
          sql: view.sql,
        };
      }),
  );

  server.registerTool(
    "compare_article",
    {
      title: "Compare an article between two dates",
      description:
        "What changed in an article between two dates: paragraphs added, removed " +
        "and reworded. That a wording stood on one date and not the other is " +
        "evidence. That two wordings are the same paragraph reworded is an " +
        "interpretation, given with its similarity.",
      annotations,
      inputSchema: z.object({
        article,
        from: z.string().describe('The earlier date, such as "2007".'),
        to: date,
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Skip this many changes."),
      }),
    },
    ({ article, from, to, offset = 0 }) =>
      answering(async () => {
        const comparison = await compareArticle(article, from, to);
        if (!comparison) return null;

        return {
          article: comparison.title,
          from: comparison.from,
          to: comparison.to ?? LATEST,
          editsBetween: comparison.edits,
          editors: comparison.editors,
          reverts: comparison.reverts,
          unchangedBlocks: comparison.kept,
          changed: comparison.changes.length,
          next: offset + 8 < comparison.changes.length ? offset + 8 : null,
          changes: comparison.changes
            .slice(offset, offset + 8)
            .map((change) => ({
              change: change.change,
              before: change.before ? clip(change.before.text, 700) : null,
              after: change.after ? clip(change.after.text, 700) : null,
              similarity: change.similarity,
            })),
          sql: comparison.sql,
        };
      }),
  );

  server.registerTool(
    "trace_claim",
    {
      title: "Trace when Wikipedia started saying something",
      description:
        "Find every wording that means the same as a claim, across the whole " +
        "edit history, with when each one stood and who wrote it. The earliest " +
        "is the earliest found among embedded paragraphs, not proof that " +
        "nothing earlier existed.",
      annotations,
      inputSchema: z.object({
        claim: z.string().min(5).describe("The claim, in any language."),
      }),
    },
    ({ claim }) =>
      answering(async () => {
        const tracing = await traceClaim(claim);

        return {
          earliest: tracing.earliest
            ? {
                article: tracing.earliest.title,
                firstStood: tracing.earliest.firstSeen,
                writtenBy: tracing.earliest.writtenBy.user,
                text: clip(tracing.earliest.text, 700),
              }
            : null,
          wordings: tracing.traces.map((trace) => ({
            article: trace.title,
            text: clip(trace.text, 700),
            firstStood: trace.firstSeen,
            lastStood: trace.lastSeen ?? "still stands",
            daysStood: Math.round(trace.days),
            distance: trace.distance,
            writtenBy: trace.writtenBy.user,
            paragraph: trace.hash,
            version: `https://fi.wikipedia.org/?oldid=${trace.writtenBy.revId}`,
          })),
          sql: tracing.sql,
        };
      }),
  );

  server.registerTool(
    "paragraph_life",
    {
      title: "The life of one paragraph",
      description:
        "Every stretch of time one exact wording stood in an article, who wrote " +
        "it and who removed it, and the wordings it replaced or was replaced by. " +
        "Takes the paragraph id another tool returned.",
      annotations,
      inputSchema: z.object({
        article,
        paragraph: z
          .string()
          .regex(/^[0-9a-fA-F]{16}$/)
          .describe("A paragraph id."),
      }),
    },
    ({ article, paragraph }) =>
      answering(async () => {
        const life = await readBiography(article, paragraph);
        if (!life) return null;

        return {
          article: life.title,
          text: clip(life.text),
          stillStands: life.alive,
          daysStood: Math.round(life.daysAlive),
          lifetimes: life.lifetimes.map((stay) => ({
            from: stay.from,
            to: stay.to ?? "still stands",
            writtenBy: stay.writtenBy.user,
            removedBy: stay.removedBy?.user ?? null,
            removalComment: stay.removedBy?.comment ?? null,
          })),
          interpretedRewordings: life.wordings.map((wording) => ({
            text: clip(wording.text, 500),
            from: wording.firstSeen,
            to: wording.lastSeen ?? "still stands",
            similarityToPrevious: wording.similarity,
          })),
          sql: life.sql,
        };
      }),
  );

  server.registerTool(
    "article_timeline",
    {
      title: "An article's editing history",
      description:
        "How many versions, editors and reverts an article has, when it was " +
        "first and last edited, and its edits and reverts per year.",
      annotations,
      inputSchema: z.object({ article }),
    },
    ({ article }) =>
      answering(async () => {
        const life = await readTimeline(article);
        if (!life) return null;

        const years = new Map<string, { edits: number; reverts: number }>();

        for (const month of life.months) {
          const year = years.get(month.month.slice(0, 4)) ?? {
            edits: 0,
            reverts: 0,
          };
          year.edits += month.edits;
          year.reverts += month.reverts;
          years.set(month.month.slice(0, 4), year);
        }

        return {
          article: life.title,
          versions: life.edits,
          editors: life.editors,
          reverts: life.reverts,
          firstEdit: life.firstEdit,
          lastEdit: life.lastEdit,
          byYear: [...years].map(([year, counts]) => ({ year, ...counts })),
          sql: life.sql,
        };
      }),
  );

  server.registerTool(
    "who_held_office",
    {
      title: "Who held an office on a day, as of a date",
      description:
        "Who was president, prime minister or regent of Finland on a day, " +
        "according to Wikipedia as it stood on a date. Answered from a " +
        "bitemporal table of the terms the articles' infoboxes stated: the " +
        "holder, the stated term, since when Wikipedia said so and the version " +
        "that first said it. No holders means no article claimed that day; two " +
        "means two articles disagreed, or one of them was acting.",
      annotations,
      inputSchema: z.object({
        office: z
          .enum(["president", "prime minister", "regent"])
          .optional()
          .describe("Leave out for president."),
        day: z
          .string()
          .regex(/^\d{4}-\d{1,2}-\d{1,2}$/)
          .describe('The day in history, such as "1925-03-01".'),
        date,
      }),
    },
    ({ office = "president", day, date }) =>
      answering(async () => {
        const held = await whoHeld(office, day, date);
        if (!held) throw new Error(`No terms are held for "${office}".`);

        return {
          office: held.office,
          day: held.day,
          asOf: held.at ?? LATEST,
          holders: held.holders.map((term) => ({
            holder: term.person,
            acting: term.acting,
            statedFrom: term.from,
            statedTo: term.to ?? "still in office",
            saidSince: term.saidSince,
            saidUntil: term.saidUntil ?? "still stated",
            firstSaidBy: term.editor,
            editSummary: term.comment,
            version: term.url,
          })),
          sql: held.sql,
        };
      }),
  );
}
