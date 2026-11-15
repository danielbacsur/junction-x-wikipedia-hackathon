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

/**
 * labs/numbers-that-moved/README.md, "What we found": the Winter War death
 * toll, "26 600 → 26662, 2009-08-22 10:30:30 UTC, revision 7215959". The
 * days are the stays of the old and the new figure in that exact sentence.
 */
export const WINTER_WAR = {
  article: "Talvisota",
  old: "26 600",
  new: "26662",
  at: "2009-08-22 10:30:30",
  revId: 7_215_959,
  oldDays: 290.798125,
  newDays: 1829.256863,
};

/** labs/history-at-scale/README.md, "What we found" and "How it was measured". */
export const SCALE_SETUP = { mariadb: "12.3.3", runs: 7, bufferPoolGiB: 2 };

/**
 * labs/history-at-scale/README.md, "What the full Finnish Wikipedia would
 * need", under "Inferred, not measured": "at most about 85 million rows",
 * "20 to 22 GB".
 */
export const FULL_FIWIKI = { millionRows: 85, gigabytes: [20, 22] };

/**
 * labs/numbers-that-moved/README.md, "Number rules": "Standalone, ungrouped
 * four-digit values in 1000–2099 are year-shaped".
 */
export const YEAR_SHAPED = { from: 1000, to: 2099 };

/**
 * labs/three-wikipedias/README.md. "What we found": "The texts are the
 * August 2025 snapshot in wtt.article". The table under "Time travel on the
 * Finnish side": "has stood since the article's first 30 days", "standing
 * only since 1 August 2023 or later". "Wider": "within 31 days or within
 * 10 %". "Manual read": "With 30 cases, an error rate up to about 10 %
 * cannot be ruled out".
 */
export const LEADS = {
  snapshot: "August 2025",
  firstDays: 30,
  recentSince: "2023-08-01",
  nearMiss: { days: 31, share: 0.1 },
  errorCeiling: 0.1,
};

/**
 * labs/infobox-time-machine/README.md, "Which fields move": "Among fields
 * with at least 1,000 observations and 50 distinct field slots".
 */
export const MOVING_FIELDS = { observations: 1_000, slots: 50 };
