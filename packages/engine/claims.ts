import { db, toVector } from "@wtt/package-db";
import { embedOne } from "@wtt/package-models";
import { diffWords } from "diff";

import { figures } from "./answer.ts";
import { resolvePage } from "./articles.ts";
import { type Terms, pickTerms, stemQuery } from "./keywords.ts";
import { KEYWORD_WEIGHT } from "./passages.ts";
import { type Shown, count, show } from "./sql.ts";
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

  /**
   * How many wikitexts read as this same text. A changed footnote or link
   * makes a new wikitext, but a reader saw the same words, so they are one
   * entry here and their stretches are joined.
   */
  variants: number;

  /** Whether it holds every number of the claim. Null when the claim has none. */
  saysFigures: boolean | null;
};

/**
 * A wording farther than this from the claim is about something else. A
 * claim in English sits about 0.1 farther from a Finnish paragraph than
 * the same claim in Finnish does, which is why this is not tighter.
 * Keyword matches only raise the rank of wordings that are close in
 * meaning: on their own they found paragraphs that merely share a number.
 */
const FARTHEST = 0.5;

/** How many of the index's nearest wordings are looked at. */
const NEAREST = 300;

/**
 * "Earliest" is chosen among wordings no farther than this beyond the
 * closest one. Without it the earliest was often a paragraph on another
 * subject that happened to be old: for Finnish losses in the Winter War, a
 * sentence about the dead of the civil war.
 */
const NEAR = 0.1;

export type Tracing = {
  claim: string;
  terms: Terms;

  /**
   * Passages that say something like the claim, across all of history.
   * Each is one text in one article with the dates it stood.
   */
  traces: Trace[];

  /**
   * The earliest of the wordings about as close as the closest one: our
   * reading of where the claim begins, not proof nothing stood before it.
   */
  earliest: Trace | null;

  /** The numbers in the claim, and the earliest such wording that holds them all. */
  figures: string[];
  earliestSaying: Trace | null;

  /** At most this many wordings are returned, none farther than this. */
  limit: number;
  farthest: number;

  /** How far beyond the closest wording "earliest" may be. */
  near: number;
  sql: Shown[];
};

/**
 * "When did wikipedia start saying this?" Finds wordings that mean what a
 * claim says anywhere in history, living or long removed, and reads their
 * lifetimes from the versioned table. Nothing here is pinned to a date:
 * the point is to see all of time at once.
 *
 * Only wordings that have a vector can be found, and the index names its
 * nearest 300, so the earliest wording returned is the earliest found and
 * not proof that nothing stood before it.
 */
export const traceClaim = async (
  claim: string,
  options: { limit?: number } = {},
): Promise<Tracing> => {
  const database = db().traced();
  const terms = await pickTerms(database, claim);
  const vector = toVector(await embedOne(claim));
  const match = stemQuery(terms);
  const limit = count(options.limit, 24, 60);

  // A number of one digit is left alone, as it is when an answer is checked.
  const asked = figures(claim).filter(
    (figure) => figure.written.replace(/\D/g, "").length > 1,
  );

  const nothing = {
    claim,
    terms,
    traces: [],
    earliest: null,
    figures: asked.map((figure) => figure.written),
    earliestSaying: null,
    limit,
    farthest: FARTHEST,
    near: NEAR,
  };

  const candidates = await database.query<{
    hash: string;
    text: string;
    distance: number;
    score: number;
  }>(
    `WITH v AS (
       SELECT hash, distance, ROW_NUMBER() OVER (ORDER BY distance) AS place
       FROM (SELECT hash, VEC_DISTANCE_COSINE(embedding, ?) AS distance
             FROM passage_vector
             ORDER BY distance
             LIMIT ${NEAREST}) AS nearest)
     ${
       match
         ? `, k AS (
       SELECT hash, ROW_NUMBER() OVER (ORDER BY relevance DESC) AS place
       FROM (SELECT hash, MATCH(stems) AGAINST (? IN BOOLEAN MODE) AS relevance
             FROM passage_text
             WHERE MATCH(stems) AGAINST (? IN BOOLEAN MODE)
             ORDER BY relevance DESC
             LIMIT ${NEAREST}) AS matched)`
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
     LIMIT ${limit * 4}`,
    match ? [vector, match, match] : [vector],
  );

  if (candidates.length === 0) {
    return { ...nothing, sql: database.statements.map(show) };
  }

  const found = new Map(candidates.map((row) => [row.hash, row]));

  // Every history row of every candidate, in every article it stood in.
  // The stretches a wording stood, and how long it stood in all, are
  // worked out from these and not summed in SQL.
  const rows = await database.query<{
    hash: string;
    page_id: number;
    title: string;
    row_start: string;
    row_end: string;
    current: number;
    born_rev: number;
    slot: number;
  }>(
    `SELECT HEX(p.hash) AS hash, p.page_id, r.title, p.row_start, p.row_end,
            p.row_end > NOW() AS current, p.born_rev, p.slot
     FROM passage FOR SYSTEM_TIME ALL AS p
     JOIN revision AS r ON r.page_id = p.page_id
     WHERE p.hash IN (${candidates.map(() => "?").join(", ")})
     ORDER BY p.page_id, p.row_start`,
    candidates.map((row) => Buffer.from(row.hash, "hex")),
  );

  // One entry per text and article. Wikitexts that read the same are the
  // same words to a reader, so their rows are one history.
  const histories = new Map<string, typeof rows>();

  for (const row of rows) {
    const key = `${row.page_id}\n${found.get(row.hash)!.text}`;

    histories.set(key, [...(histories.get(key) ?? []), row]);
  }

  const lives = [...histories.values()].map((history) => ({
    history,
    firstRev: Math.min(...history.map((row) => row.born_rev)),
  }));

  const writers = await database.query<EditRow>(
    `SELECT rev_id, saved_at, user, editor, comment, reverted_by
     FROM edit WHERE rev_id IN (${lives.map(() => "?").join(", ")})`,
    lives.map((life) => life.firstRev),
  );

  const byRev = new Map(writers.map((edit) => [edit.rev_id, edit]));

  const traces = lives
    .map(({ history, firstRev }): Trace => {
      const [first] = history;
      const stood = stays(history);
      const wordings = [...new Set(history.map((row) => row.hash))].map(
        (hash) => found.get(hash)!,
      );
      const { text } = wordings[0];
      const held = new Set(
        figures(text).flatMap((figure) => [
          ...figure.readings,
          ...figure.parts,
        ]),
      );

      return {
        hash: first.hash,
        pageId: first.page_id,
        title: first.title,
        text,
        distance: Math.min(
          ...wordings.map((wording) => Number(wording.distance)),
        ),
        score: Math.max(...wordings.map((wording) => Number(wording.score))),
        firstSeen: stood[0].from,
        lastSeen: stood.at(-1)!.to,
        alive: stood.at(-1)!.to === null,
        days: stood.reduce((sum, stay) => sum + days(stay.from, stay.to), 0),
        stays: stood.length,
        lifetimes: stood.map(({ from, to }) => ({ from, to })),
        writtenBy: editRef(byRev.get(firstRev)!),
        slot: Math.max(...history.map((row) => row.slot)),
        variants: wordings.length,
        saysFigures:
          asked.length === 0
            ? null
            : asked.every((figure) =>
                figure.readings.some((reading) => held.has(reading)),
              ),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const first = (among: Trace[]) =>
    among.reduce<Trace | null>(
      (earliest, trace) =>
        !earliest || trace.firstSeen < earliest.firstSeen ? trace : earliest,
      null,
    );

  const closest = Math.min(...traces.map((trace) => trace.distance!));
  const close = traces.filter((trace) => trace.distance! <= closest + NEAR);

  return {
    ...nothing,
    traces,
    earliest: first(close),
    earliestSaying: first(close.filter((trace) => trace.saysFigures)),
    sql: database.statements.map(show),
  };
};
