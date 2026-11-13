/// <reference path="./snowball.d.ts" />
import snowball from "snowball-stemmers";

const finnish = snowball.newStemmer("finnish");
const cache = new Map<string, string>();

/** Lowercase words and numbers, as search and similarity see a text. */
export const words = (text: string): string[] =>
  text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

/**
 * Finnish words reduced to their stems, joined by spaces. MariaDB's
 * full-text search has no Finnish stemmer, so Mannerheim, Mannerheimin and
 * Mannerheimille are three different words to it. Indexing stems and
 * stemming the question the same way makes them one.
 */
export const stems = (text: string): string =>
  words(text)
    .map((word) => {
      let stem = cache.get(word);

      if (stem === undefined) {
        stem = finnish.stem(word) as string;
        if (cache.size < 500_000) cache.set(word, stem);
      }

      return stem;
    })
    .join(" ");

/** How alike two wordings are, from 0 to 1, by the words they share. */
export const similarity = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;

  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let shared = 0;
  for (const word of small) if (large.has(word)) shared++;

  return (2 * shared) / (a.size + b.size);
};
