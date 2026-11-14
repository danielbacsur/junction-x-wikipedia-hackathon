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

  /** null means the latest version in the dataset. */
  at: string | null;
  terms: Terms;

  /** The articles the question was routed to. */
  articles: { pageId: number; title: string; revId: number }[];
  sources: Source[];

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
  const terms = await pickTerms(database, question);
  const vector = toVector(await embedOne(question));

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
    .sort((a, b) => b.score - a.score)
    .slice(0, SOURCES)
    .map((hit, index) => ({
      ...hit,
      n: index + 1,
      url: `https://fi.wikipedia.org/?oldid=${hit.revId}`,
      bornUrl: `https://fi.wikipedia.org/?oldid=${hit.bornRev}`,
    }));

  return {
    question,
    at,
    terms,
    articles,
    sources,
    embeddedNow,
    sql: database.statements.map(show),
  };
};
