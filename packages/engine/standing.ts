import { db } from "@wtt/package-db";
import { diffWords } from "diff";

import { type Shown, show } from "./sql.ts";
import { asOf, moment, when } from "./time.ts";

export type Standing = {
  /**
   * What became of a passage at another moment: the same wording stood
   * there too, the paragraph was there in other words, or it was not
   * there at all.
   */
  state: "same" | "reworded" | "absent";

  /** The wording that stood in its place, when it was reworded. */
  hash?: string;
  text?: string;

  /** The words that differ, read from the passage asked about to the other. */
  words?: { text: string; added?: boolean; removed?: boolean }[];
};

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

  // The slot is the paragraph a wording belongs to. It is our reading of
  // the edits, so "reworded" is an interpretation and "same" is not.
  const rows = await database.query<{
    page_id: number;
    hash: string;
    own_text: string;
    same: number;
    now_hash: string | null;
    now_text: string | null;
  }>(
    `SELECT w.page_id, HEX(w.hash) AS hash, MAX(own.text) AS own_text,
            MAX(p.hash = w.hash) AS same,
            HEX(MAX(p.hash)) AS now_hash, MAX(t.text) AS now_text
     FROM (SELECT DISTINCT page_id, hash, slot
           FROM passage FOR SYSTEM_TIME ALL
           WHERE (page_id, hash) IN (${pairs})) AS w
     LEFT JOIN passage ${asOf(at)} AS p
       ON p.page_id = w.page_id
      AND (p.hash = w.hash OR (w.slot > 0 AND p.slot = w.slot))
     JOIN passage_text AS own ON own.hash = w.hash
     LEFT JOIN passage_text AS t ON t.hash = p.hash
     GROUP BY w.page_id, w.hash`,
    [...flat, ...when(at)],
  );

  for (const row of rows) {
    standing[`${row.page_id}:${row.hash}`] =
      row.same === 1
        ? { state: "same" }
        : row.now_hash
          ? {
              state: "reworded",
              hash: row.now_hash,
              text: row.now_text ?? "",
              words: diffWords(row.own_text, row.now_text ?? "").map(
                (part) => ({
                  text: part.value,
                  ...(part.added ? { added: true } : {}),
                  ...(part.removed ? { removed: true } : {}),
                }),
              ),
            }
          : { state: "absent" };
  }

  return { at, standing, sql: database.statements.map(show) };
};
