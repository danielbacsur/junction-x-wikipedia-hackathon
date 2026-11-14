import { db, toVector } from "@wtt/package-db";
import { embedOne } from "@wtt/package-models";
import { diffWords } from "diff";

import { resolvePage } from "./articles.ts";
import { type Terms, pickTerms, stemQuery } from "./keywords.ts";
import { KEYWORD_WEIGHT } from "./passages.ts";
import { type Shown, show } from "./sql.ts";
import { LAST_EDIT } from "./time.ts";

type EditRef = {
  revId: number;
  at: string;
  user: string | null;
  editor: string;
  comment: string | null;

  /** The edit was itself reverted later. */
  undone: boolean;
};

export type Lifetime = {
  from: string;

  /** null while the wording still stands. */
  to: string | null;
  days: number;
  writtenBy: EditRef;
  removedBy: EditRef | null;
};

export type Wording = {
  hash: string;
  text: string;
  firstSeen: string;
  lastSeen: string | null;
  writtenBy: EditRef;

  /** How alike it is to the wording before it, from 0 to 1. */
  similarity: number | null;
  words: { text: string; added?: boolean; removed?: boolean }[];
};

export type Biography = {
  pageId: number;
  title: string;
  hash: string;
  text: string;
  kind: string;
  alive: boolean;

  /** Evidence: every stretch of time this exact wording stood in the article. */
  lifetimes: Lifetime[];
  daysAlive: number;

  /**
   * Interpretation: the wordings we believe are the same paragraph being
   * rewritten, oldest first.
   */
  slot: number;
  wordings: Wording[];
  sql: Shown[];
};

type EditRow = {
  rev_id: number;
  saved_at: string;
  user: string | null;
  editor: string;
  comment: string | null;
  reverted_by: number | null;
};

const editRef = (row: EditRow): EditRef => ({
  revId: row.rev_id,
  at: row.saved_at,
  user: row.user,
  editor: row.editor,
  comment: row.comment,
  undone: row.reverted_by !== null,
});

const days = (from: string, to: string | null) =>
  (Date.parse(`${(to ?? LAST_EDIT).replace(" ", "T")}Z`) -
    Date.parse(`${from.replace(" ", "T")}Z`)) /
  86_400_000;

type Stay = { from: string; to: string | null; bornRev: number };

/**
 * Turns a wording's history rows, oldest first, into the stretches of time
 * it stood. A row also ends when a block only moves, and a wording that
 * stands twice in an article has a row for each copy, so rows that touch
 * or overlap are one stay. Summing the rows instead counted the same days
 * once for every copy.
 */
const stays = (
  rows: {
    row_start: string;
    row_end: string;
    current: number;
    born_rev: number;
  }[],
): Stay[] => {
  const found: Stay[] = [];

  for (const row of rows) {
    const last = found.at(-1);
    const to = row.current ? null : row.row_end;

    if (!last || (last.to !== null && last.to < row.row_start)) {
      found.push({ from: row.row_start, to, bornRev: row.born_rev });
    } else if (last.to !== null && (to === null || to > last.to)) {
      last.to = to;
    }
  }

  return found;
};

/**
 * The life of one wording in one article. Its history rows in the
 * versioned passage table, joined where they touch, are its lifetimes:
 * each starts with the edit that wrote it and ends with the edit that
 * changed or removed it.
 */
export const readBiography = async (
  reference: string | number,
  hash: string,
): Promise<Biography | null> => {
  const database = db().traced();
  const page = await resolvePage(database, reference);
  if (!page || !/^[0-9a-f]{16}$/i.test(hash)) return null;

  const key = Buffer.from(hash, "hex");

  const rows = await database.query<{
    row_start: string;
    row_end: string;
    born_rev: number;
    slot: number;
    current: number;
  }>(
    `SELECT row_start, row_end, born_rev, slot, row_end > NOW() AS current
     FROM passage FOR SYSTEM_TIME ALL
     WHERE page_id = ? AND hash = ?
     ORDER BY row_start`,
    [page.pageId, key],
  );

  if (rows.length === 0) return null;

  const [wording] = await database.query<{ text: string; kind: string }>(
    "SELECT text, kind FROM passage_text WHERE hash = ?",
    [key],
  );

  const stood = stays(rows);
  const ends = stood.flatMap((stay) => (stay.to ? [stay.to] : []));

  const edits = await database.query<EditRow>(
    `SELECT rev_id, saved_at, user, editor, comment, reverted_by
     FROM edit
     WHERE page_id = ? AND (
       rev_id IN (${stood.map(() => "?").join(", ")})
       ${ends.length > 0 ? `OR saved_at IN (${ends.map(() => "?").join(", ")})` : ""})`,
    [page.pageId, ...stood.map((stay) => stay.bornRev), ...ends],
  );

  const byRev = new Map(edits.map((edit) => [edit.rev_id, edit]));
  const byTime = new Map(edits.map((edit) => [edit.saved_at, edit]));

  const lifetimes = stood.map((stay) => ({
    from: stay.from,
    to: stay.to,
    days: days(stay.from, stay.to),
    writtenBy: editRef(byRev.get(stay.bornRev)!),
    removedBy:
      stay.to && byTime.has(stay.to) ? editRef(byTime.get(stay.to)!) : null,
  }));

  const slot = Math.max(...rows.map((row) => row.slot));

  const chain =
    slot === 0
      ? []
      : await database.query<
          EditRow & {
            hash: string;
            text: string;
            first_seen: string;
            last_seen: string;
            current: number;
            sim: number | null;
          }
        >(
          `SELECT HEX(p.hash) AS hash, t.text,
                  MIN(p.row_start) AS first_seen, MAX(p.row_end) AS last_seen,
                  MAX(p.row_end) > NOW() AS current, MAX(p.sim) AS sim,
                  b.rev_id, b.saved_at, b.user, b.editor, b.comment, b.reverted_by
           FROM passage FOR SYSTEM_TIME ALL AS p
           JOIN passage_text AS t USING (hash)
           JOIN edit AS b ON b.rev_id = (
             SELECT MIN(born_rev) FROM passage FOR SYSTEM_TIME ALL
             WHERE page_id = p.page_id AND hash = p.hash)
           WHERE p.page_id = ? AND p.slot = ?
           GROUP BY p.hash
           ORDER BY first_seen
           LIMIT 200`,
          [page.pageId, slot],
        );

  return {
    pageId: page.pageId,
    title: page.title,
    hash: hash.toUpperCase(),
    text: wording.text,
    kind: wording.kind,
    alive: lifetimes.at(-1)!.to === null,
    lifetimes,
    daysAlive: lifetimes.reduce((sum, lifetime) => sum + lifetime.days, 0),
    slot,
    wordings: chain.map((row, index) => ({
      hash: row.hash,
      text: row.text,
      firstSeen: row.first_seen,
      lastSeen: row.current ? null : row.last_seen,
      writtenBy: editRef(row),
      similarity: index === 0 ? null : row.sim,
      words:
        index === 0
          ? []
          : diffWords(chain[index - 1].text, row.text).map((part) => ({
              text: part.value,
              ...(part.added ? { added: true } : {}),
              ...(part.removed ? { removed: true } : {}),
            })),
    })),
    sql: database.statements.map(show),
  };
};

export type Trace = {
  hash: string;
  pageId: number;
  title: string;
  text: string;

  /** Cosine distance to the claim: 0 is the same meaning. */
  distance: number | null;
  score: number;
  firstSeen: string;
  lastSeen: string | null;
  alive: boolean;
  days: number;
  stays: number;

  /** Each stretch it stood, oldest first. The last has no end while it stands. */
  lifetimes: { from: string; to: string | null }[];
  writtenBy: EditRef;
  slot: number;
};

/**
 * A wording farther than this from the claim is about something else.
 * Keyword matches only raise the rank of wordings that are close in
 * meaning: on their own they found paragraphs that merely share a number.
 */
const FARTHEST = 0.45;

export type Tracing = {
  claim: string;
  terms: Terms;

  /**
   * Passages that say something like the claim, across all of history.
   * Each is one exact wording in one article with the dates it stood.
   */
  traces: Trace[];

  /** The earliest moment any of them appeared. */
  earliest: Trace | null;

  /** At most this many wordings are returned, none farther than this. */
  limit: number;
  farthest: number;
  sql: Shown[];
};

/**
 * "When did wikipedia start saying this?" Finds wordings that mean what a
 * claim says anywhere in history, living or long removed, and reads their
 * lifetimes from the versioned table. Nothing here is pinned to a date:
 * the point is to see all of time at once.
 */
export const traceClaim = async (
  claim: string,
  options: { limit?: number } = {},
): Promise<Tracing> => {
  const database = db().traced();
  const terms = await pickTerms(database, claim);
  const vector = toVector(await embedOne(claim));
  const match = stemQuery(terms);
  const limit = options.limit ?? 12;

  const candidates = await database.query<{
    hash: string;
    text: string;
    distance: number | null;
    score: number;
  }>(
    `WITH v AS (
       SELECT hash, distance, ROW_NUMBER() OVER (ORDER BY distance) AS place
       FROM (SELECT hash, VEC_DISTANCE_COSINE(embedding, ?) AS distance
             FROM passage_vector
             ORDER BY distance
             LIMIT 80) AS nearest)
     ${
       match
         ? `, k AS (
       SELECT hash, ROW_NUMBER() OVER (ORDER BY relevance DESC) AS place
       FROM (SELECT hash, MATCH(stems) AGAINST (? IN BOOLEAN MODE) AS relevance
             FROM passage_text
             WHERE MATCH(stems) AGAINST (? IN BOOLEAN MODE)
             ORDER BY relevance DESC
             LIMIT 80) AS matched)`
         : ""
     }
     SELECT HEX(found.hash) AS hash, t.text, v.distance,
            COALESCE(1 / (60 + v.place), 0)
            ${match ? `+ COALESCE(${KEYWORD_WEIGHT} / (60 + k.place), 0)` : ""} AS score
     FROM v AS found
     JOIN v USING (hash)
     ${match ? "LEFT JOIN k USING (hash)" : ""}
     JOIN passage_text AS t USING (hash)
     WHERE v.distance <= ${FARTHEST}
     ORDER BY score DESC
     LIMIT ${limit * 2}`,
    match ? [vector, match, match] : [vector],
  );

  if (candidates.length === 0) {
    return {
      claim,
      terms,
      traces: [],
      earliest: null,
      limit,
      farthest: FARTHEST,
      sql: database.statements.map(show),
    };
  }

  const hashes = candidates.map((row) => Buffer.from(row.hash, "hex"));
  const marks = hashes.map(() => "?").join(", ");

  // Where each wording stood, squeezed into one row per wording and article.
  const lives = await database.query<{
    hash: string;
    page_id: number;
    title: string;
    first_seen: string;
    last_seen: string;
    alive: number;
    first_rev: number;
    slot: number;
  }>(
    `SELECT HEX(p.hash) AS hash, p.page_id, r.title,
            MIN(p.row_start) AS first_seen, MAX(p.row_end) AS last_seen,
            MAX(p.row_end) > NOW() AS alive,
            MIN(p.born_rev) AS first_rev, MAX(p.slot) AS slot
     FROM passage FOR SYSTEM_TIME ALL AS p
     JOIN revision AS r ON r.page_id = p.page_id
     WHERE p.hash IN (${marks})
     GROUP BY p.hash, p.page_id`,
    hashes,
  );

  // The same rows one by one. The stretches a wording stood, and how long
  // it stood in all, are worked out from these and not summed in SQL.
  const rows = await database.query<{
    hash: string;
    page_id: number;
    row_start: string;
    row_end: string;
    current: number;
    born_rev: number;
  }>(
    `SELECT HEX(hash) AS hash, page_id, row_start, row_end,
            row_end > NOW() AS current, born_rev
     FROM passage FOR SYSTEM_TIME ALL
     WHERE hash IN (${marks})
     ORDER BY hash, page_id, row_start`,
    hashes,
  );

  const histories = new Map<string, typeof rows>();

  for (const row of rows) {
    const key = `${row.hash}:${row.page_id}`;

    histories.set(key, [...(histories.get(key) ?? []), row]);
  }

  const stretches = new Map(
    [...histories].map(([key, history]) => [key, stays(history)]),
  );

  const writers = await database.query<EditRow>(
    `SELECT rev_id, saved_at, user, editor, comment, reverted_by
     FROM edit WHERE rev_id IN (${lives.map(() => "?").join(", ")})`,
    lives.map((life) => life.first_rev),
  );

  const byRev = new Map(writers.map((edit) => [edit.rev_id, edit]));
  const found = new Map(candidates.map((row) => [row.hash, row]));

  const traces = lives
    .map((life): Trace => {
      const candidate = found.get(life.hash)!;
      const stood = stretches.get(`${life.hash}:${life.page_id}`) ?? [];

      return {
        hash: life.hash,
        pageId: life.page_id,
        title: life.title,
        text: candidate.text,
        distance:
          candidate.distance === null ? null : Number(candidate.distance),
        score: Number(candidate.score),
        firstSeen: life.first_seen,
        lastSeen: life.alive ? null : life.last_seen,
        alive: life.alive === 1,
        days: stood.reduce((sum, stay) => sum + days(stay.from, stay.to), 0),
        stays: stood.length,
        lifetimes: stood.map(({ from, to }) => ({ from, to })),
        writtenBy: editRef(byRev.get(life.first_rev)!),
        slot: life.slot,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const earliest = traces.reduce<Trace | null>(
    (first, trace) =>
      !first || trace.firstSeen < first.firstSeen ? trace : first,
    null,
  );

  return {
    claim,
    terms,
    traces,
    earliest,
    limit,
    farthest: FARTHEST,
    sql: database.statements.map(show),
  };
};
