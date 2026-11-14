import { defineTool } from "eve/tools";
import { z } from "zod";
import { article, latest, clip, modelOutput } from "../lib/output";

export default defineTool({
  description:
    'Find when Wikipedia started saying a claim, across all dates (e.g. before "2007"). Supply a concrete Finnish claim and optional article title. Matches are candidates: check the actual wording and numbers.',
  inputSchema: z.object({
    claim: z.string().min(2),
    article: article.optional(),
    offset: z.number().int().min(0).optional(),
  }),
  async execute({ claim, article, offset = 0 }) {
    const { traceClaim } = await import("@wtt/package-engine");
    const found = await traceClaim(article ? `${article}: ${claim}` : claim, {
      limit: 30,
    });
    // Semantic similarity alone can return an older, different death count.
    // Retain the numbers the user actually asked about before truncating.
    const numbers = (claim.match(/\d+(?:[ ,\u00a0]\d{3})*/g) ?? []).map((n) =>
      n.replace(/[ ,\u00a0]/g, ""),
    );
    const matches = found.traces
      .filter(
        (t) =>
          !article ||
          t.title.toLocaleLowerCase() ===
            article.replaceAll("_", " ").toLocaleLowerCase(),
      )
      .filter((t) =>
        numbers.every((n) =>
          new RegExp(`(?<!\\d)${n}(?!\\d)`).test(
            t.text.replace(/(?<=\d)[ ,\u00a0](?=\d{3}\b)/g, ""),
          ),
        ),
      )
      .sort((a, b) => a.firstSeen.localeCompare(b.firstSeen));
    return {
      scope:
        "Earliest among retrieved candidates, not proof of the first claim anywhere. Similar meaning does not prove identical claims. Check numbers in text.",
      latest,
      requiredNumbers: numbers,
      totalMatches: matches.length,
      nextOffset: offset + 3 < matches.length ? offset + 3 : null,
      matches: matches.slice(offset, offset + 3).map((t) => ({
        article: t.title,
        text: clip(t.text, 900),
        paragraph: t.hash,
        firstSeen: t.firstSeen,
        lastSeen: t.lastSeen,
        writtenBy: t.writtenBy.user,
        similarityDistance: t.distance,
      })),
      sql: found.sql,
    };
  },
  toModelOutput: modelOutput,
});
