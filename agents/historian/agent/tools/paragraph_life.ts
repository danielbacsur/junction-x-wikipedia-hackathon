import { defineTool } from "eve/tools";
import { z } from "zod";
import { article, latest, clip, modelOutput } from "../lib/output";

export default defineTool({
  description:
    'Read the exact lifetimes of a paragraph. Use an article and its 16-hex paragraph hash from another tool. Dates show when wording stood, e.g. "2007-06-01".',
  inputSchema: z.object({
    article,
    hash: z.string().regex(/^[0-9a-fA-F]{16}$/),
    offset: z.number().int().min(0).optional(),
  }),
  async execute({ article, hash, offset = 0 }) {
    const { readBiography } = await import("@wtt/package-engine");
    const found = await readBiography(article, hash);
    if (!found) return { error: "Paragraph not found", sql: [] };
    return {
      article: found.title,
      hash: found.hash,
      text: clip(found.text, 1800),
      latest,
      alive: found.alive,
      totalLifetimes: found.lifetimes.length,
      nextOffset: offset + 8 < found.lifetimes.length ? offset + 8 : null,
      lifetimes: found.lifetimes.slice(offset, offset + 8).map((l) => ({
        from: l.from,
        to: l.to,
        writtenBy: l.writtenBy.user,
        revision: l.writtenBy.revId,
        removedBy: l.removedBy?.user,
      })),
      sql: found.sql,
    };
  },
  toModelOutput: modelOutput,
});
