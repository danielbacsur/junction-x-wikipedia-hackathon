import { defineTool } from "eve/tools";
import { z } from "zod";
import { clip, modelOutput } from "../lib/output";

export default defineTool({
  description:
    'Find Finnish article titles for a topic. Then read_article at a date such as "2007". This title search itself is not historical evidence.',
  inputSchema: z.object({ question: z.string().min(2) }),
  async execute({ question }) {
    const { searchArticles } = await import("@wtt/package-engine");
    const found = await searchArticles(question, { lang: "fi", limit: 5 });
    return {
      scope: "Article discovery, latest index",
      articles: found.hits.map((h) => ({
        article: h.title,
        pageId: h.pageId,
        snippet: clip(h.snippet, 240),
      })),
      sql: found.sql,
    };
  },
  toModelOutput: modelOutput,
});
