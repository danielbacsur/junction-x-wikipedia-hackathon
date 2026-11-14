import { defineTool } from "eve/tools";
import { z } from "zod";
import { date, latest, clip, modelOutput } from "../lib/output";

export default defineTool({
  description:
    'Find what Wikipedia said at ONE date. Search in Finnish or English, e.g. question "Finnish losses Winter War", date "2007". For then versus now call twice, with date and without.',
  inputSchema: z.object({ question: z.string().min(2), date }),
  async execute({ question, date }) {
    const { searchPassages } = await import("@wtt/package-engine");
    const found = await searchPassages(question, { date, limit: 5 });
    return {
      asOf: found.at ?? latest,
      passages: found.hits.map((h) => ({
        article: h.title,
        text: clip(h.text),
        written: h.bornAt,
        writtenBy: h.bornBy,
        paragraph: h.hash,
      })),
      sql: found.sql,
    };
  },
  toModelOutput: modelOutput,
});
