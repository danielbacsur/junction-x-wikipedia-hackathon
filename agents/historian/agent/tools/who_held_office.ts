import { defineTool } from "eve/tools";
import { z } from "zod";

import { date, latest } from "../lib/output";

export default defineTool({
  description:
    "Who held an office of state on a day, according to Wikipedia as it stood on a " +
    "date. Answers from a table of the terms the articles' infoboxes stated, with " +
    'the version that said it. Example: office "president", day "1925-03-01", ' +
    'date "2008". Offices: president, prime minister, regent of Finland.',

  inputSchema: z.object({
    office: z
      .enum(["president", "prime minister", "regent"])
      .optional()
      .describe("Defaults to president."),
    day: z
      .string()
      .regex(/^\d{4}-\d{1,2}-\d{1,2}$/)
      .describe('The day in history, as "1960-05-01".'),
    date,
  }),

  async execute({ office = "president", day, date }) {
    const { whoHeld } = await import("@wtt/package-engine");
    const held = await whoHeld(office, day, date);
    if (!held) return { error: "Office not found", sql: [] };

    return {
      office: held.office,
      day: held.day,
      asOf: held.at ?? latest,
      holders: held.holders.map((term) => ({
        holder: term.person,
        acting: term.acting,
        statedTermFrom: term.from,

        // The stated end is the successor's first day.
        statedTermTo: term.to ?? "still in office",
        wikipediaSaidSoSince: term.saidSince.slice(0, 10),
        until: term.saidUntil?.slice(0, 10) ?? "still says so",
        firstSaidBy: term.editor,
        version: term.url,
      })),
      sql: held.sql,
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
        "\nAnswer in one or two sentences from this alone. Name the holder, the " +
        "stated term, the Wikipedia date asked and since when Wikipedia said so. " +
        "No holders means no article's infobox claimed that day on that date: say " +
        "exactly that and name nobody. Two holders who are not acting means two " +
        "articles disagreed. The table covers Wikipedia from 16 January 2006.",
    };
  },
});
