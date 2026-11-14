import { z } from "zod";

export const date = z
  .string()
  .optional()
  .describe(
    'Year "2007", month "2008-06", or day "2008-06-01". Omit for latest: 2026-10-01.',
  );
export const article = z
  .string()
  .min(1)
  .describe('Finnish article title, e.g. "Talvisota", or page ID.');
export const latest = "2026-10-01 (latest in dataset)";
export const clip = (text: string, max = 1400) =>
  text.length > max ? text.slice(0, max) + "… [excerpt truncated]" : text;
export function modelOutput<T extends { sql: unknown }>(output: T) {
  const { sql, ...evidence } = output;
  void sql;
  const citation =
    "article" in evidence && "asOf" in evidence
      ? `\nCite this source explicitly as ${evidence.article} (${evidence.asOf}).`
      : "";
  return {
    type: "text" as const,
    value:
      JSON.stringify(evidence) +
      citation +
      ("asOf" in evidence
        ? "\nThis is ONE snapshot. written dates are paragraph origins. For then versus now retrieve the other snapshot too."
        : "matches" in evidence
          ? "\nFor a first-appearance question, answer using the earliest firstSeen whose text matches the claim. Do not compare arbitrary snapshot dates. State that this is earliest retrieved evidence."
          : "") +
      "\nCite article and dates in your reply. Finnish kuollutta and menehtynyttä mean deaths, not all casualties. Noin tuhat means about 1,000 (one thousand). Answer the user's question briefly.",
  };
}
export function select<T>(
  items: T[],
  text: (item: T) => string,
  keyword?: string,
) {
  const terms = keyword?.toLocaleLowerCase().split(/\s+/).filter(Boolean) ?? [];
  return terms.length
    ? items.filter((item) =>
        terms.some((term) => text(item).toLocaleLowerCase().includes(term)),
      )
    : items;
}
