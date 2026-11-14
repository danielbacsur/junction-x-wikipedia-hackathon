import { defineTool } from "eve/tools";
import { z } from "zod";
import { article, modelOutput } from "../lib/output";

export default defineTool({
  description:
    'Get edits and reverts by year, and first and last edit, for a Finnish article. Covers all dataset years, e.g. "2007"; does not read its content.',
  inputSchema: z.object({ article }),
  async execute({ article }) {
    const { readTimeline } = await import("@wtt/package-engine");
    const found = await readTimeline(article);
    if (!found) return { error: "Article not found", sql: [] };
    const years: Record<string, { edits: number; reverts: number }> = {};
    for (const m of found.months) {
      const y = m.month.slice(0, 4);
      const value = (years[y] ??= { edits: 0, reverts: 0 });
      value.edits += m.edits;
      value.reverts += m.reverts;
    }
    return {
      article: found.title,
      firstEdit: found.firstEdit,
      lastEdit: found.lastEdit,
      edits: found.edits,
      reverts: found.reverts,
      years,
      sql: found.sql,
    };
  },
  toModelOutput: modelOutput,
});
