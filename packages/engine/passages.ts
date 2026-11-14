import { type Db, db, toVector } from "@wtt/package-db";
import { embed, embedOne, passageInput } from "@wtt/package-models";

import { type Terms, pickTerms, stemQuery } from "./keywords.ts";
import { type Shown, show } from "./sql.ts";
import { asOf, moment, when } from "./time.ts";

export type PassageHit = {
  pageId: number;
  title: string;
  hash: string;
  kind: string;
  text: string;

  /** The version of the article a reader saw at that moment. */
  revId: number;

  /** The edit that wrote this exact wording, and who saved it. */
  bornRev: number;
  bornAt: string;
  bornBy: string | null;
  bornEditor: string;

  /** Since when the wording has stood where it stands. */
  since: string;

  slot: number;
  distance: number | null;
  vectorRank: number | null;
  keywordRank: number | null;
  score: number;
};

type PassageRow = {
  page_id: number;
  title: string;
  hash: string;
  kind: string;
  text: string;
  rev_id: number;
  born_rev: number;
  born_at: string;
  born_by: string | null;
  born_editor: string;
  since: string;
  slot: number;
  distance: number | null;
  vector_rank: number | null;
  keyword_rank: number | null;
  score: number;
};

const toHit = (row: PassageRow): PassageHit => ({
  pageId: row.page_id,
  title: row.title,
  hash: row.hash,
  kind: row.kind,
  text: row.text,
  revId: row.rev_id,
  bornRev: row.born_rev,
  bornAt: row.born_at,
  bornBy: row.born_by,
  bornEditor: row.born_editor,
  since: row.since,
  slot: row.slot,
  distance: row.distance === null ? null : Number(row.distance),
  vectorRank: row.vector_rank,
  keywordRank: row.keyword_rank,
  score: Number(row.score),
});

/**
 * How much a keyword match counts next to a match in meaning. Sharing a
 * rare word with the question is weaker evidence than meaning the same, so
 * a keyword match lifts a passage that is already near but rarely carries
 * one to the top alone. Measured on MariaDB's 37 questions.
 */
export const KEYWORD_WEIGHT = 0.4;

/** How many nearest wordings the vector index is asked for. */
const CANDIDATES = 300;

const SELECTED = `
  p.page_id, r.title, HEX(p.hash) AS hash, t.kind, t.text, r.rev_id,
  p.born_rev, b.saved_at AS born_at, b.user AS born_by,
  b.editor AS born_editor, p.row_start AS since, p.slot`;

/**
 * The statement at the heart of the product: semantic and keyword search
 * over what an article said at one moment. The vector index and the
 * full-text index each name their best wordings from all of history, and
 * the join with the versioned passage table keeps the ones that stood in
 * an article at that moment. Wordings that only arrived through an edit
 * later reverted are left out, so vandalism cannot be cited.
 */
export const passageSearch = async (
  database: Db,
  input: {
    vector: Buffer | null;
    match: string;
    at: string | null;
    limit: number;
  },
): Promise<PassageHit[]> => {
  const match = input.match;
  const lists: string[] = [];
  const params: unknown[] = [];

  if (input.vector) {
    lists.push(`
      v AS (
        SELECT hash, distance, ROW_NUMBER() OVER (ORDER BY distance) AS place
        FROM (SELECT hash, VEC_DISTANCE_COSINE(embedding, ?) AS distance
              FROM passage_vector
              ORDER BY distance
              LIMIT ${CANDIDATES}) AS nearest)`);
    params.push(input.vector);
  }

  if (match) {
    lists.push(`
      k AS (
        SELECT hash, ROW_NUMBER() OVER (ORDER BY relevance DESC) AS place
        FROM (SELECT hash, MATCH(stems) AGAINST (? IN BOOLEAN MODE) AS relevance
              FROM passage_text
              WHERE MATCH(stems) AGAINST (? IN BOOLEAN MODE)
              ORDER BY relevance DESC
              LIMIT ${CANDIDATES}) AS matched)`);
    params.push(match, match);
  }

  if (lists.length === 0) return [];

  const both = input.vector && match;

  const rows = await database.query<PassageRow>(
    `WITH ${lists.join(",")}
     SELECT ${SELECTED},
            ${input.vector ? "v.distance" : "NULL"} AS distance,
            ${input.vector ? "v.place" : "NULL"} AS vector_rank,
            ${match ? "k.place" : "NULL"} AS keyword_rank,
            ${input.vector ? "COALESCE(1 / (60 + v.place), 0)" : "0"} +
            ${match ? `COALESCE(${KEYWORD_WEIGHT} / (60 + k.place), 0)` : "0"} AS score
     FROM (${
       both
         ? "SELECT hash FROM v UNION SELECT hash FROM k"
         : `SELECT hash FROM ${input.vector ? "v" : "k"}`
     }) AS found
     ${input.vector ? "LEFT JOIN v USING (hash)" : ""}
     ${match ? "LEFT JOIN k USING (hash)" : ""}
     JOIN passage ${asOf(input.at)} AS p USING (hash)
     JOIN revision ${asOf(input.at)} AS r ON r.page_id = p.page_id
     JOIN passage_text AS t USING (hash)
     JOIN edit AS b ON b.rev_id = p.born_rev
     WHERE b.undone_by IS NULL
     ORDER BY score DESC
     LIMIT ${input.limit}`,
    [...params, ...when(input.at), ...when(input.at)],
  );

  return rows.map(toHit);
};

/**
 * Exact search inside a few articles: every passage that stood in them at
 * the moment is compared with the question, with no index and so nothing
 * approximate about it. A few hundred vectors take a few milliseconds.
 */
export const passagesWithin = async (
  database: Db,
  input: {
    vector: Buffer;
    pages: number[];
    at: string | null;
    limit: number;
  },
): Promise<PassageHit[]> => {
  if (input.pages.length === 0) return [];

  const rows = await database.query<PassageRow>(
    `SELECT ${SELECTED},
            VEC_DISTANCE_COSINE(v.embedding, ?) AS distance,
            NULL AS vector_rank, NULL AS keyword_rank, 0 AS score
     FROM passage ${asOf(input.at)} AS p
     JOIN passage_vector AS v USING (hash)
     JOIN passage_text AS t USING (hash)
     JOIN revision ${asOf(input.at)} AS r ON r.page_id = p.page_id
     JOIN edit AS b ON b.rev_id = p.born_rev
     WHERE p.page_id IN (${input.pages.map(() => "?").join(", ")})
       AND b.undone_by IS NULL
     ORDER BY distance
     LIMIT ${input.limit}`,
    [input.vector, ...when(input.at), ...when(input.at), ...input.pages],
  );

  return rows.map(toHit);
};

/**
 * Embeds the passages of some articles that have no vector yet, as they
 * stood at a moment. The background job gets to every wording eventually,
 * and this makes sure the ones a question needs right now are not skipped.
 */
export const embedMissing = async (
  database: Db,
  input: { pages: number[]; at: string | null; most: number },
): Promise<number> => {
  if (input.pages.length === 0) return 0;

  const missing = await database.query<{
    hash: Buffer;
    title: string;
    text: string;
  }>(
    `SELECT t.hash, r.title, t.text
     FROM passage ${asOf(input.at)} AS p
     JOIN passage_text AS t USING (hash)
     JOIN revision AS r ON r.page_id = p.page_id
     LEFT JOIN passage_vector AS v USING (hash)
     WHERE p.page_id IN (${input.pages.map(() => "?").join(", ")})
       AND v.hash IS NULL AND t.kind IN ('prose', 'list') AND t.chars >= 40
     LIMIT ${input.most}`,
    [...when(input.at), ...input.pages],
  );

  for (let i = 0; i < missing.length; i += 64) {
    const batch = missing.slice(i, i + 64);
    const vectors = await embed(
      batch.map((w) => passageInput(w.title, w.text)),
    );

    await database.batch(
      "INSERT IGNORE INTO passage_vector (hash, embedding) VALUES (?, ?)",
      batch.map((w, index) => [w.hash, toVector(vectors[index])]),
    );
  }

  return missing.length;
};

export type PassageSearch = {
  question: string;
  at: string | null;
  terms: Terms;
  hits: PassageHit[];
  sql: Shown[];
};

/** Searches every embedded passage as the articles stood at a moment. */
export const searchPassages = async (
  question: string,
  options: {
    date?: string | null;
    limit?: number;
    mode?: "hybrid" | "vector" | "keyword";
  } = {},
): Promise<PassageSearch> => {
  const database = db().traced();
  const at = moment(options.date);
  const mode = options.mode ?? "hybrid";
  const terms = await pickTerms(database, question);

  const hits = await passageSearch(database, {
    vector: mode === "keyword" ? null : toVector(await embedOne(question)),
    match: mode === "vector" ? "" : stemQuery(terms),
    at,
    limit: options.limit ?? 10,
  });

  return { question, at, terms, hits, sql: database.statements.map(show) };
};
