import type { Db } from "@wtt/package-db";
import { stems, words } from "@wtt/package-wikitext";

/** A stem in more wordings than this says nothing about a question. */
const TOO_COMMON = 60_000;
const MOST_TERMS = 5;

// Words that ask the question rather than say what it is about. They are
// rare in an encyclopedia, so their rarity would otherwise promote them.
const ASKING = new Set(
  `kuka ketkä kenen mikä mitkä mitä missä mistä mihin milloin miksi miten
   kuinka monta moni paljon paljonko onko oliko voiko kerro
   who whom whose what which when where why how many much did does do was
   were is are the and for from with about that this into than then
   vem vilka vad när var varför hur många mycket och för från med som den
   det att en ett`.split(/\s+/),
);

// Words only English or Swedish use. One of them in a question means the
// question is not Finnish.
const NOT_FINNISH = new Set(
  `the of which what who whom whose when where why how did does was were is
   are and for from with about that this in to by an
   och vem vilka vad när varför hur många av på det den som för från med
   att är`.split(/\s+/),
);

export type Terms = {
  /** The stems full-text search is asked for, rarest first. */
  rare: string[];

  /** The stems left out because they are in too many wordings. */
  common: string[];

  /**
   * The question is not in Finnish. Vectors cross languages and stems do
   * not, so keyword search over Finnish passages is skipped for it.
   */
  foreign: boolean;
};

/**
 * Picks the words of a question that full-text search should look for.
 * MariaDB ranks every row that holds any of the words, so a common word
 * such as "oli" turns a 50 ms search into a 25 second one. The term table
 * knows how common each stem is, and only the rare ones are sent.
 */
export const pickTerms = async (db: Db, question: string): Promise<Terms> => {
  const asked = words(question);
  const foreign = asked.some((word) => NOT_FINNISH.has(word));

  const content = asked.filter(
    // A short number is a quantity, not a name: "25" matches everything.
    (word) => !ASKING.has(word) && !/^\d{1,3}$/.test(word),
  );

  const all = [...new Set(stems(content.join(" ")).split(" "))].filter(
    (stem) => stem.length >= 3,
  );

  if (all.length === 0) return { rare: [], common: [], foreign };

  const known = await db.query<{ stem: string; df: number }>(
    `SELECT stem, df FROM term WHERE stem IN (${all.map(() => "?").join(", ")})`,
    all,
  );

  const frequency = new Map(known.map((row) => [row.stem, row.df]));
  const of = (stem: string) => frequency.get(stem) ?? 0;

  return {
    rare: all
      .filter((stem) => of(stem) <= TOO_COMMON)
      .sort((a, b) => of(a) - of(b))
      .slice(0, MOST_TERMS),
    common: all.filter((stem) => of(stem) > TOO_COMMON),
    foreign,
  };
};

/**
 * The boolean query for stems. The rarest known stem is required and the
 * rest only raise the rank, so MariaDB reads one short list of rows
 * instead of every row that holds any of the words.
 */
export const stemQuery = (terms: Terms): string =>
  terms.foreign || terms.rare.length === 0
    ? ""
    : [`+${terms.rare[0]}`, ...terms.rare.slice(1)].join(" ");

/**
 * The boolean query for the article index, which holds words as written.
 * Finnish inflects its words, and a stem with a star matches every form
 * that starts with it. The rarest stem is required here too.
 */
export const prefixQuery = (terms: Terms): string =>
  terms.rare
    .map((stem, place) => `${place === 0 && !terms.foreign ? "+" : ""}${stem}*`)
    .join(" ");
