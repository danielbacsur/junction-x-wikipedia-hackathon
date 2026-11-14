/**
 * Numbers the labs report only in their READMEs, with no result file to
 * compute them from. Each is copied as written there and says where from.
 */

/** labs/history-of-history/README.md, "One editor shaped the curve". */
export const ONE_ACCOUNT_2008 = { mentions: 1_186, articles: 507 };

/** labs/history-of-history/README.md, "Years from raw wikitext". */
export const ONE_BOOK_1975 = 1_358;

/** labs/history-of-history/README.md, "A swap is not always a rename". */
export const REWRITE = { revId: 16_264_937, kilobytes: 18, moved: 6 };

/** labs/temporal-ann/README.md, "What the executor does", at ef_search 1000. */
export const PLAN_AT_1000 = { rowsRead: 1_608, rowsKept: 2 };

/** labs/temporal-ann/README.md, the exact global top 1,000 before the date filter. */
export const EXACT_GLOBAL_1000 = { recall: 0.9475, underfilled: 0.12 };

/**
 * labs/paragraph-survival/README.md, "What we found": "prose stays of at
 * least 80 clean characters". labs/claims-before-sources/README.md counts
 * from the same floor: "current prose paragraphs of at least 80 characters".
 */
export const WORDING_AT_LEAST = 80;

/** labs/sentence-journeys/README.md, "Headline unit": prose with chars>=120. "Transfer events": "require five distinct hashes". */
export const JOURNEY = { atLeast: 120, paragraphs: 5 };

/** labs/claims-before-sources/README.md, "Candidates": "multiset word Dice overlap at least 0.80". */
export const CANDIDATE_OVERLAP = 0.8;
