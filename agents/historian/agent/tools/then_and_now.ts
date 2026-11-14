import { defineTool } from "eve/tools";
import { z } from "zod";

import { clip, latest } from "../lib/output";

export default defineTool({
  description:
    'Answer a "then versus now" question in ONE call: what Wikipedia said about a ' +
    "question on an earlier date, what it says in the latest version, and which " +
    'paragraphs were reworded in between. Example: question "Finnish losses in the ' +
    'Winter War", date "2007".',

  inputSchema: z.object({
    question: z.string().min(2).describe("What to look for, in any language."),
    date: z
      .string()
      .describe(
        'The earlier date: a year "2007", a month "2008-06" or a day "2008-06-01".',
      ),
  }),

  // A small model reliably makes one call and unreliably makes two that
  // match, so both dates and the comparison between them come back at once.
  async execute({ question, date }) {
    const { gatherEvidence, readStanding } =
      await import("@wtt/package-engine");

    const [then, now] = await Promise.all([
      gatherEvidence(question, date),
      gatherEvidence(question, null),
    ]);

    const fate = await readStanding(
      then.sources.map((source) => ({
        pageId: source.pageId,
        hash: source.hash,
      })),
      null,
    );

    const side = (evidence: typeof then) =>
      evidence.sources.slice(0, 3).map((source) => ({
        article: source.title,
        text: clip(source.text, 900),
        written: source.bornAt.slice(0, 10),
        writtenBy: source.bornBy,
        paragraph: source.hash,
      }));

    return {
      then: { asOf: then.at ?? latest, passages: side(then) },
      now: { asOf: latest, passages: side(now) },

      // What became of the earlier passages. "reworded" pairs are our
      // reading of the edits; "same" and "gone" are what the table says.
      since: then.sources.slice(0, 4).map((source) => {
        const became = fate.standing[`${source.pageId}:${source.hash}`];

        return {
          article: source.title,
          then: clip(source.text, 500),
          state:
            became?.state === "same"
              ? "still stands word for word"
              : became?.state === "reworded"
                ? "reworded (our reading of the edits)"
                : "gone",
          now:
            became?.state === "reworded"
              ? clip(became.text ?? "", 500)
              : undefined,
        };
      }),
      sql: [...then.sql, ...now.sql, ...fate.sql],
    };
  },

  toModelOutput(output) {
    const { sql, ...evidence } = output;
    void sql;

    return {
      type: "text" as const,
      value:
        JSON.stringify(evidence) +
        `\nAnswer in at most three sentences, from this alone. Use only the ` +
        `passages that answer the question and leave the others out. Say what the ` +
        `article said on ${evidence.then.asOf} and what it says on ` +
        `${evidence.now.asOf}, with the numbers exactly as written, and name the ` +
        `article. When a "since" entry about the question is reworded, say what ` +
        `changed. Finnish kaatunut, kuollut and menehtynyt mean killed.`,
    };
  },
});
