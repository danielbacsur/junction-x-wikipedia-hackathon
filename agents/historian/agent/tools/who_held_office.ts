import { defineTool } from "eve/tools";
import { z } from "zod";

import { latest } from "../lib/output";

export default defineTool({
  description:
    "Who held an office of state on a day, according to Wikipedia as it stood on a " +
    "date, and according to Wikipedia now, in ONE call. Answers from a table of " +
    "the terms the articles' infoboxes stated, with the version that said it. " +
    'Example: day "1925-03-01", wikipediaDate "2008". Offices: president, prime ' +
    "minister, regent of Finland.",

  inputSchema: z.object({
    office: z
      .enum(["president", "prime minister", "regent"])
      .optional()
      .describe("Defaults to president."),
    day: z
      .string()
      .regex(/^\d{4}-\d{1,2}-\d{1,2}$/)
      .describe('The day in history that is asked about, as "1960-05-01".'),
    wikipediaDate: z
      .string()
      .describe(
        'Which Wikipedia to ask: a year "2008", a month "2008-06" or a day ' +
          '"2008-06-01". Use "now" when the question names no date.',
      ),
  }),

  // A small model reliably makes one call and unreliably makes two that
  // match, so the answer on the date and the answer now come back together.
  async execute({ office = "president", day, wikipediaDate }) {
    const { whoHeld } = await import("@wtt/package-engine");

    const [then, now] = await Promise.all([
      whoHeld(office, day, wikipediaDate),
      whoHeld(office, day, null),
    ]);

    if (!then || !now) return { error: "Office not found", sql: [] };

    const holders = (held: typeof then) =>
      held.holders.map((term) => ({
        holder: term.person,
        acting: term.acting,
        statedTermFrom: term.from,

        // The stated end is the successor's first day.
        statedTermTo: term.to ?? "still in office",
        wikipediaSaidSoSince: term.saidSince.slice(0, 10),
        until: term.saidUntil?.slice(0, 10) ?? "still says so",
        firstSaidBy: term.editor,
        version: term.url,
      }));

    const names = (held: typeof then) =>
      held.holders.map((term) => term.person).join(", ");

    return {
      office: then.office,
      day: then.day,
      onTheDateAsked: {
        wikipediaAsOf: then.at ?? latest,
        holders: holders(then),
      },
      now: { wikipediaAsOf: latest, holders: holders(now) },
      sameAnswer: names(then) === names(now),
      sql: then.at ? [...then.sql, ...now.sql] : then.sql,
    };
  },

  // The shared hints are about passages. A row needs different ones: a
  // small model otherwise fills an empty answer in from memory.
  toModelOutput(output) {
    const { sql, ...evidence } = output;
    void sql;

    return {
      type: "text" as const,
      value:
        JSON.stringify(evidence) +
        "\nAnswer in two or three sentences from this alone. Say who Wikipedia " +
        "named on the date asked, with the stated term and since when it said so, " +
        "and then who it names now. If sameAnswer is false, say that the answer " +
        "changed. No holders means no article's infobox claimed that day on that " +
        "date: say exactly that and name nobody. Two holders who are not acting " +
        "means two articles disagreed. The table covers Wikipedia from 16 January " +
        "2006.",
    };
  },
});
