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
    'Read an article at ONE date, e.g. article "Talvisota", date "2007", keyword "sotatoimissa". Omit date for latest. Use a Finnish keyword stem to find relevant paragraphs. For then versus now read BOTH dates.',
  inputSchema: z.object({
    article,
    date,
    keyword: z
      .string()
      .optional()
      .describe(
        'Finnish word stems, separated by spaces; matches any. E.g. "tappio kaatu meneht" for losses.',
      ),
    offset: z.number().int().min(0).optional(),
  }),
  async execute({ article, date, keyword, offset = 0 }) {
    const { readArticle } = await import("@wtt/package-engine");
    const found = await readArticle(article, date);
    if (!found)
      return { error: "Article not found. Use search_articles.", sql: [] };
    const blocks = select(
      found.blocks.filter((b) => b.kind === "prose" || b.kind === "list"),
      (b) => b.text,
      keyword,
    );
    return {
      article: found.title,
      asOf: found.at ?? latest,
      exists: found.exists,
      revision: found.revId,
      url: found.url,
      matched: blocks.length,
      nextOffset: offset + 6 < blocks.length ? offset + 6 : null,
      paragraphs: blocks.slice(offset, offset + 6).map((b) => ({
        text: clip(b.text, 1800),
        written: b.bornAt,
        writtenBy: b.bornBy,
        paragraph: b.hash,
      })),
      sql: found.sql,
    };
  },
  toModelOutput: modelOutput,
});
