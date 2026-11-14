import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  article,
  date,
  latest,
  clip,
  modelOutput,
  select,
} from "../lib/output";

export default defineTool({
  description:
    'Compare article wordings at two dates: fromDate "2007", toDate "2015" (omit toDate for latest). Returns added, removed and reworded text. Reworded is an interpretation.',
  inputSchema: z.object({
    article,
    fromDate: z.string(),
    toDate: date,
    keyword: z.string().optional(),
    offset: z.number().int().min(0).optional(),
  }),
  async execute({ article, fromDate, toDate, keyword, offset = 0 }) {
    const { compareArticle } = await import("@wtt/package-engine");
    const found = await compareArticle(article, fromDate, toDate);
    if (!found) return { error: "Article not found", sql: [] };
    const changes = select(
      found.changes,
      (c) => `${c.before?.text ?? ""} ${c.after?.text ?? ""}`,
      keyword,
    );
    return {
      article: found.title,
      from: found.from,
      to: found.to ?? latest,
      exists: found.exists,
      interpretation:
        "Reworded pairs are inferred, with similarity scores; the before and after wordings are evidence.",
      matched: changes.length,
      nextOffset: offset + 5 < changes.length ? offset + 5 : null,
      changes: changes.slice(offset, offset + 5).map((c) => ({
        change: c.change,
        before: c.before
          ? { ...c.before, text: clip(c.before.text, 1100) }
          : null,
        after: c.after ? { ...c.after, text: clip(c.after.text, 1100) } : null,
        similarity: c.similarity,
      })),
      sql: found.sql,
    };
  },
  toModelOutput: modelOutput,
});
