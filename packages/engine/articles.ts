import { type Db, db, toVector } from "@wtt/package-db";
import { embedOne } from "@wtt/package-models";
import { type Inline, clean, inline, references } from "@wtt/package-wikitext";

import { type Terms, pickTerms, prefixQuery } from "./keywords.ts";
import { type Shown, show } from "./sql.ts";
import { LAST_EDIT, asOf, moment, when } from "./time.ts";

export type Page = { pageId: number; title: string };

/** Finds an article by its page id, its title today, or a title it had. */
export const resolvePage = async (
  database: Db,
  reference: string | number,
): Promise<Page | null> => {
  if (typeof reference === "number" || /^\d+$/.test(reference)) {
    const [byId] = await database.query<{ page_id: number; title: string }>(
      "SELECT page_id, title FROM revision WHERE page_id = ?",
      [Number(reference)],
    );

    return byId ? { pageId: byId.page_id, title: byId.title } : null;
  }

  const title = reference.replaceAll("_", " ");

  const [current] = await database.query<{ page_id: number }>(
    "SELECT page_id FROM revision WHERE title = ?",
    [title],
  );

  // A renamed article keeps its old titles in its history rows.
  const [found] = current
    ? [current]
    : await database.query<{ page_id: number }>(
        "SELECT page_id FROM revision FOR SYSTEM_TIME ALL WHERE title = ? LIMIT 1",
        [title],
      );

  return found ? resolvePage(database, found.page_id) : null;
};

export type ArticleHit = {
  lang: string;
  pageId: number;
  title: string;
  url: string;
  wikidataId: string | null;
  history: boolean;
  vectorRank: number | null;
  keywordRank: number | null;
  score: number;
  snippet: string;

  /** The same topic in other languages. */
  also: { lang: string; title: string; url: string }[];
};

export type ArticleSearch = {
  question: string;
  mode: "hybrid" | "vector" | "keyword";
  terms: Terms;
  hits: ArticleHit[];
  sql: Shown[];
};

/**
 * Finds articles for a question. Vectors find the meaning across three
 * languages, full-text search finds names and numbers, and reciprocal rank
 * fusion merges the two lists by position, all in one statement.
 */
export const searchArticles = async (
  question: string,
  options: {
    mode?: "hybrid" | "vector" | "keyword";
    lang?: string;
    /** Search all of Finnish Wikipedia by keyword, not only the history set. */
    everything?: boolean;
    limit?: number;
  } = {},
): Promise<ArticleSearch> => {
  const database = db().traced();
  const mode = options.mode ?? "hybrid";
  const limit = options.limit ?? 10;
  const terms = await pickTerms(database, question);

  const match = prefixQuery(terms);
  const useKeywords = mode !== "vector" && match !== "";
  const useVectors = mode !== "keyword";

  const lang = options.lang ? "AND lang = ?" : "";
  const langParam = options.lang ? [options.lang] : [];

  const vector = useVectors ? toVector(await embedOne(question)) : null;

  const lists: string[] = [];
  const params: unknown[] = [];

  if (vector) {
    lists.push(`
      v AS (
        SELECT lang, page_id, ROW_NUMBER() OVER (ORDER BY distance) AS place
        FROM (SELECT lang, page_id,
                     VEC_DISTANCE_COSINE(embedding, ?) AS distance
              FROM article_vector
              WHERE 1 = 1 ${lang}
              ORDER BY distance
              LIMIT 60) AS nearest)`);
    params.push(vector, ...langParam);
  }

  if (useKeywords) {
    lists.push(`
      k AS (
        SELECT lang, page_id, ROW_NUMBER() OVER (ORDER BY relevance DESC) AS place
        FROM (SELECT lang, page_id,
                     MATCH(title, text) AGAINST (? IN BOOLEAN MODE) AS relevance
              FROM article
              WHERE MATCH(title, text) AGAINST (? IN BOOLEAN MODE)
                ${options.everything ? "" : "AND history = 1"} ${lang}
              ORDER BY relevance DESC
              LIMIT 60) AS matched)`);
    params.push(match, match, ...langParam);
  }

  if (lists.length === 0) {
    return {
      question,
      mode,
      terms,
      hits: [],
      sql: database.statements.map(show),
    };
  }

  const both = vector && useKeywords;

  const rows = await database.query<{
    lang: string;
    page_id: number;
    title: string;
    url: string;
    wikidata_id: string | null;
    history: number;
    vector_rank: number | null;
    keyword_rank: number | null;
    score: number;
    snippet: string;
  }>(
    `WITH ${lists.join(",")}
     SELECT a.lang, a.page_id, a.title, a.url, a.wikidata_id, a.history,
            ${vector ? "v.place" : "NULL"} AS vector_rank,
            ${useKeywords ? "k.place" : "NULL"} AS keyword_rank,
            ${vector ? "COALESCE(1 / (60 + v.place), 0)" : "0"} +
            ${useKeywords ? "COALESCE(1 / (60 + k.place), 0)" : "0"} AS score,
            LEFT(a.text, 320) AS snippet
     FROM (${
       both
         ? "SELECT lang, page_id FROM v UNION SELECT lang, page_id FROM k"
         : `SELECT lang, page_id FROM ${vector ? "v" : "k"}`
     }) AS found
     ${vector ? "LEFT JOIN v USING (lang, page_id)" : ""}
     ${useKeywords ? "LEFT JOIN k USING (lang, page_id)" : ""}
     JOIN article AS a USING (lang, page_id)
     ORDER BY score DESC
     LIMIT ${limit * 3}`,
    params,
  );

  // One result per topic: the best language version leads, the others
  // are listed with it.
  const topics = new Map<string, ArticleHit>();

  for (const row of rows) {
    const key = row.wikidata_id ?? `${row.lang}:${row.page_id}`;
    const first = topics.get(key);

    if (first) {
      first.also.push({ lang: row.lang, title: row.title, url: row.url });
      continue;
    }

    topics.set(key, {
      lang: row.lang,
      pageId: row.page_id,
      title: row.title,
      url: row.url,
      wikidataId: row.wikidata_id,
      history: row.history === 1,
      vectorRank: row.vector_rank,
      keywordRank: row.keyword_rank,
      score: Number(row.score),
      snippet: row.snippet.replace(/\s+/g, " ").trim(),
      also: [],
    });
  }

  return {
    question,
    mode,
    terms,
    hits: [...topics.values()].slice(0, limit),
    sql: database.statements.map(show),
  };
};

export type Block = {
  hash: string;
  kind: string;

  /** Readable text with links, for prose, list items and headings. */
  nodes: Inline[];
  text: string;
  references: number;

  /** The version that wrote this exact wording, and who saved it. */
  bornRev: number;
  bornAt: string;
  bornBy: string | null;
  bornEditor: string;

  /** The wording arrived in an edit that was later reverted. */
  bornUndone: boolean;

  /** Interpretation: the paragraph this wording belongs to. */
  slot: number;
  replaced: string | null;
  similarity: number | null;

  embedded: boolean;
};

export type ArticleView = {
  pageId: number;
  title: string;

  /** null means the latest version in the dataset. */
  at: string | null;
  exists: boolean;

  /** The version a reader saw at that moment. */
  revId: number;
  savedAt: string;
  savedBy: string | null;
  comment: string | null;
  bytes: number;
  url: string;

  firstEdit: string;
  blocks: Block[];
  sql: Shown[];
};

const READABLE = new Set(["prose", "list", "heading"]);

/**
 * The article as it stood at a moment, built from its passages. Every
 * block carries the edit that wrote its wording, so a reader can see how
 * old each paragraph is and who it came from.
 */
export const readArticle = async (
  reference: string | number,
  date?: string | null,
): Promise<ArticleView | null> => {
  const database = db().traced();
  const page = await resolvePage(database, reference);
  if (!page) return null;

  const at = moment(date);

  const [version] = await database.query<{
    title: string;
    rev_id: number;
    saved_at: string;
    user: string | null;
    comment: string | null;
    bytes: number;
  }>(
    `SELECT title, rev_id, row_start AS saved_at, user, comment, bytes
     FROM revision ${asOf(at)}
     WHERE page_id = ?`,
    [...when(at), page.pageId],
  );

  const [{ first_edit: firstEdit }] = await database.query<{
    first_edit: string;
  }>("SELECT MIN(saved_at) AS first_edit FROM edit WHERE page_id = ?", [
    page.pageId,
  ]);

  if (!version) {
    return {
      pageId: page.pageId,
      title: page.title,
      at,
      exists: false,
      revId: 0,
      savedAt: "",
      savedBy: null,
      comment: null,
      bytes: 0,
      url: "",
      firstEdit,
      blocks: [],
      sql: database.statements.map(show),
    };
  }

  const rows = await database.query<{
    hash: string;
    kind: string;
    wikitext: string;
    born_rev: number;
    born_at: string;
    born_by: string | null;
    born_editor: string;
    born_undone: number;
    slot: number;
    replaced: string | null;
    sim: number | null;
    embedded: number;
  }>(
    `SELECT HEX(p.hash) AS hash, t.kind, t.wikitext,
            p.born_rev, b.saved_at AS born_at, b.user AS born_by,
            b.editor AS born_editor, b.undone_by IS NOT NULL AS born_undone,
            p.slot, HEX(p.prev_hash) AS replaced, p.sim,
            v.hash IS NOT NULL AS embedded
     FROM passage ${asOf(at)} AS p
     JOIN passage_text AS t USING (hash)
     JOIN edit AS b ON b.rev_id = p.born_rev
     LEFT JOIN passage_vector AS v USING (hash)
     WHERE p.page_id = ?
     ORDER BY p.ord`,
    [...when(at), page.pageId],
  );

  return {
    pageId: page.pageId,
    title: version.title,
    at,
    exists: true,
    revId: version.rev_id,
    savedAt: version.saved_at,
    savedBy: version.user,
    comment: version.comment,
    bytes: version.bytes,
    url: `https://fi.wikipedia.org/?oldid=${version.rev_id}`,
    firstEdit,
    blocks: rows.map((row) => {
      const readable = READABLE.has(row.kind);

      return {
        hash: row.hash,
        kind: row.kind,
        nodes: readable ? inline(row.wikitext) : [],
        text: readable ? clean(row.wikitext) : row.wikitext.slice(0, 160),
        references: references(row.wikitext),
        bornRev: row.born_rev,
        bornAt: row.born_at,
        bornBy: row.born_by,
        bornEditor: row.born_editor,
        bornUndone: row.born_undone === 1,
        slot: row.slot,
        replaced: row.replaced,
        similarity: row.sim,
        embedded: row.embedded === 1,
      };
    }),
    sql: database.statements.map(show),
  };
};

export type Month = {
  month: string;
  edits: number;
  reverts: number;
  undone: number;
  anonymous: number;

  /** Reverts where a named editor undid another named editor. */
  disputes: number;
  bytes: number;
};

export type Timeline = {
  pageId: number;
  title: string;
  edits: number;
  editors: number;
  reverts: number;
  firstEdit: string;
  lastEdit: string;
  months: Month[];
  sql: Shown[];
};

/** An article's whole life by month, read from the slim edit table. */
export const readTimeline = async (
  reference: string | number,
): Promise<Timeline | null> => {
  const database = db().traced();
  const page = await resolvePage(database, reference);
  if (!page) return null;

  // A revert only counts as a dispute when a named editor undid the work
  // of a different named editor. Most reverts clean up anonymous edits.
  const months = await database.query<{
    month: string;
    edits: number;
    reverts: number;
    undone: number;
    anonymous: number;
    disputes: number;
    bytes: number;
  }>(
    `SELECT DATE_FORMAT(e.saved_at, '%Y-%m') AS month,
            COUNT(*) AS edits,
            SUM(e.restores IS NOT NULL) AS reverts,
            SUM(e.undone_by IS NOT NULL) AS undone,
            SUM(e.editor <> 'named') AS anonymous,
            SUM(e.restores IS NOT NULL AND e.editor = 'named' AND EXISTS (
              SELECT 1 FROM edit AS u
              WHERE u.page_id = e.page_id AND u.undone_by = e.seq
                AND u.editor = 'named' AND u.user <> e.user)) AS disputes,
            MAX(e.bytes) AS bytes
     FROM edit AS e
     WHERE e.page_id = ?
     GROUP BY month
     ORDER BY month`,
    [page.pageId],
  );

  const [summary] = await database.query<{
    edits: number;
    editors: number;
    reverts: number;
    first_edit: string;
    last_edit: string;
  }>(
    `SELECT COUNT(*) AS edits, COUNT(DISTINCT user) AS editors,
            SUM(restores IS NOT NULL) AS reverts,
            MIN(saved_at) AS first_edit, MAX(saved_at) AS last_edit
     FROM edit WHERE page_id = ?`,
    [page.pageId],
  );

  return {
    pageId: page.pageId,
    title: page.title,
    edits: summary.edits,
    editors: summary.editors,
    reverts: Number(summary.reverts),
    firstEdit: summary.first_edit,
    lastEdit: summary.last_edit,
    months: months.map((row) => ({
      month: row.month,
      edits: row.edits,
      reverts: Number(row.reverts),
      undone: Number(row.undone),
      anonymous: Number(row.anonymous),
      disputes: Number(row.disputes),
      bytes: row.bytes,
    })),
    sql: database.statements.map(show),
  };
};

export type Version = {
  revId: number;
  seq: number;
  savedAt: string;
  user: string | null;
  editor: string;
  comment: string | null;
  bytes: number;
  delta: number;
  minor: boolean;
  revert: boolean;
  undone: boolean;
};

/** The saved versions of an article around a moment, newest first. */
export const listVersions = async (
  reference: string | number,
  options: { before?: string | null; limit?: number } = {},
): Promise<{ versions: Version[]; sql: Shown[] } | null> => {
  const database = db().traced();
  const page = await resolvePage(database, reference);
  if (!page) return null;

  const before = moment(options.before) ?? LAST_EDIT;

  const rows = await database.query<{
    rev_id: number;
    seq: number;
    saved_at: string;
    user: string | null;
    editor: string;
    comment: string | null;
    bytes: number;
    delta: number;
    minor: number;
    restores: number | null;
    undone_by: number | null;
  }>(
    `SELECT rev_id, seq, saved_at, user, editor, comment, bytes, delta, minor,
            restores, undone_by
     FROM edit
     WHERE page_id = ? AND saved_at <= ?
     ORDER BY saved_at DESC
     LIMIT ${Math.min(options.limit ?? 30, 200)}`,
    [page.pageId, before],
  );

  return {
    versions: rows.map((row) => ({
      revId: row.rev_id,
      seq: row.seq,
      savedAt: row.saved_at,
      user: row.user,
      editor: row.editor,
      comment: row.comment,
      bytes: row.bytes,
      delta: row.delta,
      minor: row.minor === 1,
      revert: row.restores !== null,
      undone: row.undone_by !== null,
    })),
    sql: database.statements.map(show),
  };
};
