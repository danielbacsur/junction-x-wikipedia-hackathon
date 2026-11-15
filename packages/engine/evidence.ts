import { type Db, db, toVector } from "@wtt/package-db";
import { embedOne } from "@wtt/package-models";

import { type Terms, pickTerms, stemQuery } from "./keywords.ts";
import {
  type PassageHit,
  embedMissing,
  passageSearch,
  passagesWithin,
} from "./passages.ts";
import { type Shown, show } from "./sql.ts";
import { understandQuestion } from "./understand.ts";
import { whoHeld } from "./offices.ts";
import { asOf, moment, when } from "./time.ts";

export type Source = PassageHit & {
  /** The number an answer cites it by. */
  n: number;

  /** The article exactly as a reader saw it at that moment. */
  url: string;

  /** The edit that first wrote this wording. */
  bornUrl: string;
};

export type Evidence = {
  question: string;
  language?: string;

  /** null means the latest version in the dataset. */
  at: string | null;
  terms: Terms;

  /** The articles the question was routed to. */
  articles: { pageId: number; title: string; revId: number }[];

  /** Empty when even the nearest passage is too far to be about the question. */
  sources: Source[];

  /**
   * Cosine distance from the question to the nearest passage found, and
   * the distance beyond which we take it to be about something else. Both
   * are our reading, not evidence.
   */
  nearest: number | null;
  tooFar: number;

  /** Passages embedded on the spot because the background job had not reached them. */
  embeddedNow: number;
  sql: Shown[];
};

/** How many articles a question is routed to. */
const ARTICLES = 8;
const SOURCES = 8;

/** How much an article matching the question counts for its passages. */
const ARTICLE_WEIGHT = 1;

/**
 * When even the nearest passage is farther than this, nothing that stood
 * that day is about the question. Questions about the history of Finland
 * in three languages had their nearest passage between 0.31 and 0.50, and
 * questions about pizza and routers between 0.54 and 0.57. Search always
 * returns its nearest eight, so without this a model was handed eight
 * passages about something else and asked to answer from them.
 */
const TOO_FAR = 0.53;

/**
 * Finds the Finnish articles a question is about, among those that existed
 * at the moment. This step only decides where to look: it uses today's
 * article vectors, so it knows things the past did not. What gets cited is
 * decided afterwards, from passages that stood at that moment.
 */
const route = async (database: Db, vector: Buffer, at: string | null) => {
  const nearest = await database.query<{
    lang: string;
    page_id: number;
    wikidata_id: string | null;
  }>(
    `SELECT a.lang, a.page_id, a.wikidata_id
     FROM (SELECT lang, page_id,
                  VEC_DISTANCE_COSINE(embedding, ?) AS distance
           FROM article_vector
           ORDER BY distance
           LIMIT 30) AS nearest
     JOIN article AS a USING (lang, page_id)
     ORDER BY nearest.distance`,
    [vector],
  );

  if (nearest.length === 0) return [];

  // A Swedish or English hit leads to the Finnish article on the same
  // topic, because only the Finnish articles have their history loaded.
  const pages = nearest
    .filter((row) => row.lang === "fi")
    .map((row) => row.page_id);
  const topics = nearest.flatMap((row) =>
    row.lang !== "fi" && row.wikidata_id ? [row.wikidata_id] : [],
  );

  const conditions = [
    pages.length > 0 ? `a.page_id IN (${pages.map(() => "?").join(", ")})` : "",
    topics.length > 0
      ? `a.wikidata_id IN (${topics.map(() => "?").join(", ")})`
      : "",
  ].filter(Boolean);

  const existing = await database.query<{
    page_id: number;
    wikidata_id: string | null;
    title: string;
    rev_id: number;
  }>(
    `SELECT a.page_id, a.wikidata_id, r.title, r.rev_id
     FROM article AS a
     JOIN revision ${asOf(at)} AS r ON r.page_id = a.page_id
     WHERE a.lang = 'fi' AND a.history = 1 AND (${conditions.join(" OR ")})`,
    [...when(at), ...pages, ...topics],
  );

  const rank = (page: (typeof existing)[number]) =>
    nearest.findIndex(
      (row) =>
        (row.lang === "fi" && row.page_id === page.page_id) ||
        (row.wikidata_id !== null && row.wikidata_id === page.wikidata_id),
    );

  return existing
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, ARTICLES)
    .map((page) => ({
      pageId: page.page_id,
      title: page.title,
      revId: page.rev_id,
    }));
};

/**
 * Gathers what wikipedia said about a question at one moment: the passages
 * an answer may cite, each tied to the exact version that held it.
 */
export const gatherEvidence = async (
  question: string,
  date?: string | null,
): Promise<Evidence> => {
  const database = db().traced();
  const at = moment(date);
  const understood = await understandQuestion(question);
  const terms = await pickTerms(database, understood.query);
  terms.foreign = false;
  if (understood.office) {
    const holding = await whoHeld(understood.office.name, understood.office.day, date);
    if (holding) return {
      question, language: understood.language, at, terms,
      articles: holding.holders.map(h => ({ pageId: h.pageId, title: h.person, revId: h.revId })),
      sources: holding.holders.map((h, index) => ({
        n: index + 1, pageId: h.pageId, title: h.person, hash: "", kind: "office",
        text: `${h.person}: ${h.office}, ${h.from} – ${h.to ?? "open-ended"}. On ${holding.day}: ${h.sourceText}`,
        revId: h.revId, bornRev: h.revId, bornAt: h.saidSince, bornBy: h.editor,
        bornEditor: h.editorKind, since: h.saidSince, slot: 0, distance: null,
        vectorRank: null, keywordRank: null, score: 1, url: h.url, bornUrl: h.url,
      })), nearest: null, tooFar: TOO_FAR, embeddedNow: 0, sql: holding.sql,
    };
  }
  const vector = toVector(await embedOne(understood.query));

  // Two ways to find where to look, at the same time: the articles nearest
  // in meaning, and the passages nearest in meaning or sharing a rare word.
  const match = stemQuery(terms);

  const [routed, everywhere] = await Promise.all([
    route(database, vector, at),
    passageSearch(database, { vector, match, at, limit: SOURCES }),
  ]);

  const articles = [...routed];

  for (const hit of everywhere) {
    if (articles.length >= ARTICLES + 2) break;
    if (articles.some((article) => article.pageId === hit.pageId)) continue;

    articles.push({ pageId: hit.pageId, title: hit.title, revId: hit.revId });
  }

  const pages = articles.map((article) => article.pageId);

  // One batch at most, about a second: the background job does the rest.
  const embeddedNow = await embedMissing(database, { pages, at, most: 64 });

  const within = await passagesWithin(database, {
    vector,
    pages,
    at,
    limit: SOURCES,
  });

  // Three signals merged by position: how near a passage is among those of
  // the routed articles, how near it is among every embedded passage, and
  // how well its article matches the question as a whole. The last one
  // keeps a good paragraph of the right article above a slightly nearer
  // paragraph of a neighbouring one.
  const merged = new Map<string, PassageHit>();
  const routedAt = new Map(
    articles.map((article, place) => [article.pageId, place]),
  );

  [within, everywhere].forEach((list) =>
    list.forEach((hit, place) => {
      const key = `${hit.pageId}:${hit.hash}`;
      const seen = merged.get(key);
      const score = 1 / (60 + place + 1);

      if (seen) {
        seen.score += score;
        seen.vectorRank ??= hit.vectorRank;
        seen.keywordRank ??= hit.keywordRank;
      } else {
        const article = routedAt.get(hit.pageId);

        merged.set(key, {
          ...hit,
          score:
            score +
            (article === undefined ? 0 : ARTICLE_WEIGHT / (60 + article + 1)),
        });
      }
    }),
  );

  const sources = [...merged.values()]
    .filter(hit => hit.distance !== null && hit.distance <= TOO_FAR)
    .sort((a, b) => b.score - a.score)
    .slice(0, SOURCES)
    .map((hit, index) => ({
      ...hit,
      n: index + 1,
      url: `https://fi.wikipedia.org/?oldid=${hit.revId}`,
      bornUrl: `https://fi.wikipedia.org/?oldid=${hit.bornRev}`,
    }));

  const distances = sources.flatMap((source) =>
    source.distance === null ? [] : [source.distance],
  );
  const nearest = distances.length > 0 ? Math.min(...distances) : null;

  return {
    question,
    language: understood.language,
    at,
    terms,
    articles,
    sources: nearest !== null && nearest > TOO_FAR ? [] : sources,
    nearest,
    tooFar: TOO_FAR,
    embeddedNow,
    sql: database.statements.map(show),
  };
};
