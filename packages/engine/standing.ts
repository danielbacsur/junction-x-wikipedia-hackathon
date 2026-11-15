import { db } from "@wtt/package-db";
import { similarity, words } from "@wtt/package-wikitext";
import { diffWords } from "diff";

import { type Shown, show } from "./sql.ts";
import { STOOD, asOf, moment, when } from "./time.ts";

export type Standing = {
  /**
   * What became of a passage at another moment: the same wording stood
   * there too, the paragraph was there in other words, or nothing like it
   * was found. Only "same" is evidence. The other two are our reading.
   */
  state: "same" | "reworded" | "absent";

  /** The wording that stood in its place, when it was reworded. */
  hash?: string;
  text?: string;

  /**
   * How the two wordings were connected: by following the article's edits
   * from one to the other, or by their vectors being nearly the same.
   */
  via?: "edits" | "meaning";

  /** Cosine distance between the two, when they were matched by meaning. */
  distance?: number;

  /** The words that differ, read from the passage asked about to the other. */
  words?: { text: string; added?: boolean; removed?: boolean }[];
};

/**
 * Two wordings this near in meaning are one paragraph rewritten. Different
 * paragraphs of the same article sit at 0.3 and beyond.
 */
const SAME_MEANING = 0.2;

const changed = (from: string, to: string) =>
  diffWords(from, to).map((part) => ({
    text: part.value,
    ...(part.added ? { added: true } : {}),
    ...(part.removed ? { removed: true } : {}),
  }));

/**
 * Looks up whether passages also stood at another moment. Two answers from
 * different dates each show only their own best passages, so comparing the
 * two lists would say nothing about what really changed. This asks the
 * versioned table directly.
 */
export const readStanding = async (
  keys: { pageId: number; hash: string }[],
  date?: string | null,
): Promise<{
  at: string | null;
  standing: Record<string, Standing>;
  sql: Shown[];
}> => {
  const database = db().traced();
  const at = moment(date);
  const standing: Record<string, Standing> = {};

  const wanted = keys
    .filter((key) => /^[0-9a-f]{16}$/i.test(key.hash))
    .slice(0, 40);
  if (wanted.length === 0) return { at, standing, sql: [] };

  const pairs = wanted.map(() => "(?, ?)").join(", ");
  const flat = wanted.flatMap((key) => [
    key.pageId,
    Buffer.from(key.hash, "hex"),
  ]);

  // First by the edits: the same wording, or whatever stood in the
  // paragraph's place. The place is the slot, our reading of the edits.
  const rows = await database.query<{
    page_id: number;
    hash: string;
    own_text: string;
    there_hash: string | null;
    there_text: string | null;
  }>(
    `SELECT w.page_id, HEX(w.hash) AS hash, own.text AS own_text,
            HEX(p.hash) AS there_hash, t.text AS there_text
     FROM (SELECT DISTINCT page_id, hash, slot
           FROM passage FOR SYSTEM_TIME ALL
           WHERE (page_id, hash) IN (${pairs})) AS w
     JOIN passage_text AS own ON own.hash = w.hash
     LEFT JOIN passage ${asOf(at)} AS p
       ON p.page_id = w.page_id
      AND (p.hash = w.hash OR (w.slot > 0 AND p.slot = w.slot))
     LEFT JOIN passage_text AS t ON t.hash = p.hash`,
    [...flat, ...when(at)],
  );

  const own = new Map<string, string>();

  for (const row of rows) {
    const key = `${row.page_id}:${row.hash}`;
    const known = standing[key];
    own.set(key, row.own_text);

    if (row.there_hash === row.hash) {
      standing[key] = { state: "same" };
    } else if (known?.state !== "same" && row.there_hash && !known) {
      standing[key] = {
        state: "reworded",
        via: "edits",
        hash: row.there_hash,
        text: row.there_text ?? "",
        words: changed(row.own_text, row.there_text ?? ""),
      };
    } else if (!known) {
      standing[key] = { state: "absent" };
    }
  }

  // Then by meaning. After many rewrites the trail of edits is lost, and
  // an opening paragraph looks gone when it only reads differently. The
  // nearest passage that stood in the article at that moment settles it.
  for (const key of wanted) {
    const name = `${key.pageId}:${key.hash.toUpperCase()}`;
    if (standing[name]?.state !== "absent") continue;

    const [nearest] = await database.query<{
      hash: string;
      text: string;
      distance: number;
    }>(
      `SELECT HEX(p.hash) AS hash, t.text,
              VEC_DISTANCE_COSINE(v.embedding, mine.embedding) AS distance
       FROM passage_vector AS mine
       JOIN passage ${asOf(at)} AS p ${STOOD} ON p.page_id = ?
       JOIN passage_vector AS v ON v.hash = p.hash
       JOIN passage_text AS t ON t.hash = p.hash
       WHERE mine.hash = ?
       ORDER BY distance
       LIMIT 1`,
      [...when(at), key.pageId, Buffer.from(key.hash, "hex")],
    );

    const mine = own.get(name) ?? "";

    if (
      nearest &&
      Number(nearest.distance) <= SAME_MEANING &&
      similarity(new Set(words(mine)), new Set(words(nearest.text))) >= 0.3
    ) {
      standing[name] = {
        state: "reworded",
        via: "meaning",
        distance: Number(nearest.distance),
        hash: nearest.hash,
        text: nearest.text,
        words: changed(mine, nearest.text),
      };
    }
  }

  return { at, standing, sql: database.statements.map(show) };
};
