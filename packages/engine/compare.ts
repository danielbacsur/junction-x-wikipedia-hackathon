import { db } from "@wtt/package-db";
import { clean, similarity, words } from "@wtt/package-wikitext";
import { diffWords } from "diff";

import { resolvePage } from "./articles.ts";
import { type Shown, show } from "./sql.ts";
import { LAST_EDIT, asOf, moment, when } from "./time.ts";

export type Change = {
  /** What happened to the paragraph between the two moments. */
  change: "added" | "removed" | "reworded";
  kind: string;

  /** The wording before and after; one of them is missing unless reworded. */
  before: { hash: string; text: string; bornRev: number } | null;
  after: { hash: string; text: string; bornRev: number } | null;

  /** For a rewording: the words that went and came. */
  words: { text: string; added?: boolean; removed?: boolean }[];

  /** How alike the two wordings are, when the pairing is our reading. */
  similarity: number | null;
};

export type Comparison = {
  pageId: number;
  title: string;
  from: string;
  to: string | null;
  exists: { from: boolean; to: boolean };
  edits: number;
  editors: number;
  reverts: number;
  kept: number;
  changes: Change[];

  /** Markup blocks that changed, such as templates and tables, as counts. */
  other: { added: number; removed: number };
  sql: Shown[];
};

const READABLE = new Set(["prose", "list", "heading"]);

/** Two wordings sharing fewer of their words than this are not shown as one. */
const ALIKE = 0.5;

/**
 * What changed in an article between two moments, paragraph by paragraph.
 * MariaDB returns the blocks that stood at exactly one of the two moments.
 * That part is evidence. Pairing a removed wording with an added one as
 * "reworded" is our reading of it, and every pair says how alike they are.
 */
export const compareArticle = async (
  reference: string | number,
  fromDate: string,
  toDate?: string | null,
): Promise<Comparison | null> => {
  const database = db().traced();
  const page = await resolvePage(database, reference);
  if (!page) return null;

  const from = moment(fromDate);
  const to = moment(toDate);

  if (!from) throw new Error("the earlier date has to be in the past");

  if (to && to < from) {
    throw new Error("the earlier date has to be before the later one");
  }

  const rows = await database.query<{
    hash: string;
    side: "from" | "to";
    kind: string;
    wikitext: string;
    slot: number;
    born_rev: number;
  }>(
    `SELECT HEX(u.hash) AS hash, MAX(u.side) AS side, t.kind, t.wikitext,
            MAX(u.slot) AS slot, MAX(u.born_rev) AS born_rev
     FROM (
       SELECT 'from' AS side, hash, dup, slot, born_rev, ord
       FROM passage FOR SYSTEM_TIME AS OF TIMESTAMP ? WHERE page_id = ?
       UNION ALL
       SELECT 'to', hash, dup, slot, born_rev, ord
       FROM passage ${asOf(to)} WHERE page_id = ?
     ) AS u
     JOIN passage_text AS t USING (hash)
     GROUP BY u.hash, u.dup
     HAVING COUNT(*) = 1
     ORDER BY MAX(u.ord)`,
    [from, page.pageId, ...when(to), page.pageId],
  );

  const [between] = await database.query<{
    edits: number;
    editors: number;
    reverts: number;
  }>(
    `SELECT COUNT(*) AS edits, COUNT(DISTINCT user) AS editors,
            COALESCE(SUM(restores IS NOT NULL), 0) AS reverts
     FROM edit
     WHERE page_id = ? AND saved_at > ? AND saved_at <= ?`,
    [page.pageId, from, to ?? LAST_EDIT],
  );

  const [sizes] = await database.query<{ at_from: number; at_to: number }>(
    `SELECT
       (SELECT COUNT(*) FROM passage FOR SYSTEM_TIME AS OF TIMESTAMP ?
        WHERE page_id = ?) AS at_from,
       (SELECT COUNT(*) FROM passage ${asOf(to)} WHERE page_id = ?) AS at_to`,
    [from, page.pageId, ...when(to), page.pageId],
  );

  const readable = rows.filter((row) => READABLE.has(row.kind));
  const removed = readable.filter((row) => row.side === "from");
  const added = readable.filter((row) => row.side === "to");

  const side = (row: (typeof rows)[number]) => ({
    hash: row.hash,
    text: clean(row.wikitext),
    bornRev: row.born_rev,
  });

  const changes: Change[] = [];
  const paired = new Set<string>();

  for (const after of added) {
    const is = side(after);
    const before = removed.find(
      (row) => row.slot > 0 && row.slot === after.slot && !paired.has(row.hash),
    );

    const was = before ? side(before) : null;
    const alike = was
      ? similarity(new Set(words(was.text)), new Set(words(is.text)))
      : 0;

    if (!was || alike < ALIKE) {
      changes.push({
        change: "added",
        kind: after.kind,
        before: null,
        after: is,
        words: [],
        similarity: null,
      });
      continue;
    }

    paired.add(was.hash);

    changes.push({
      change: "reworded",
      kind: after.kind,
      before: was,
      after: is,
      words: diffWords(was.text, is.text).map((part) => ({
        text: part.value,
        ...(part.added ? { added: true } : {}),
        ...(part.removed ? { removed: true } : {}),
      })),
      similarity: alike,
    });
  }

  for (const before of removed) {
    if (paired.has(before.hash)) continue;

    changes.push({
      change: "removed",
      kind: before.kind,
      before: side(before),
      after: null,
      words: [],
      similarity: null,
    });
  }

  const markup = rows.filter((row) => !READABLE.has(row.kind));
  const addedBlocks = rows.filter((row) => row.side === "to").length;

  return {
    pageId: page.pageId,
    title: page.title,
    from,
    to,
    exists: { from: sizes.at_from > 0, to: sizes.at_to > 0 },
    edits: between.edits,
    editors: between.editors,
    reverts: Number(between.reverts),
    kept: sizes.at_to - addedBlocks,
    changes,
    other: {
      added: markup.filter((row) => row.side === "to").length,
      removed: markup.filter((row) => row.side === "from").length,
    },
    sql: database.statements.map(show),
  };
};
