import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Search the paragraphs that stood in Finnish Wikipedia on a date, by " +
    "meaning and by keyword. Returns passages with the article, the date " +
    "each wording was written and who wrote it.",

  inputSchema: z.object({
    question: z.string().min(2).describe("What to look for, in any language."),
    date: z
      .string()
      .optional()
      .describe(
        'A year like "2008" or a day like "2008-06-01". Leave out for the latest.',
      ),
  }),

  async execute({ question, date }) {
    const { searchPassages } = await import("@wtt/package-engine");
    const found = await searchPassages(question, { date, limit: 6 });

    return {
      asOf: found.at ?? "latest (1 October 2026)",
      passages: found.hits.map((hit) => ({
        article: hit.title,
        text: hit.text,
        written: hit.bornAt.slice(0, 10),
        writtenBy: hit.bornBy,
        paragraph: hit.hash,
      })),
    };
  },
});
