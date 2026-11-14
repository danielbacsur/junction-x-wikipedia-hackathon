/**
 * Everything the atlas draws, read from the labs' own result files. Nothing
 * here is typed in by hand: a number on the page is either a field of one of
 * these files or arithmetic on such fields. The few numbers the labs report
 * only in their README are in `quoted.ts`, each with the line it comes from.
 */
import clusterSummary from "../../../../labs/exposure-clock/data/cluster-summary.json";
import editorSummary from "../../../../labs/exposure-clock/data/editor-summary.json";
import identity from "../../../../labs/exposure-clock/data/identity-sensitivity.json";
import revertClusters from "../../../../labs/exposure-clock/data/revert-clusters.json";
import exposureSummary from "../../../../labs/exposure-clock/data/summary.json";
import tempComparison from "../../../../labs/exposure-clock/data/temp-comparison.json";
import uncertainty from "../../../../labs/exposure-clock/data/uncertainty.json";
import knownHashByYear from "../../../../labs/exposure-clock/data/valid-exposure-by-year.json";
import mainArticle from "../../../../labs/history-of-history/data/main-article.json";
import termShares from "../../../../labs/history-of-history/data/term-shares.json";
import nameSwaps from "../../../../labs/history-of-history/data/war-name-swaps.json";
import warNames from "../../../../labs/history-of-history/data/war-names.json";
import yearsMentioned from "../../../../labs/history-of-history/data/year-heatmap-years.json";
import decadesMentioned from "../../../../labs/history-of-history/data/year-heatmap.json";
import annCorpus from "../../../../labs/temporal-ann/data/corpus.json";
import annLatency from "../../../../labs/temporal-ann/data/latency.json";
import annRecall from "../../../../labs/temporal-ann/data/recall.json";
import annUnfiltered from "../../../../labs/temporal-ann/data/unfiltered.json";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length / 2;

  return sorted.length % 2
    ? sorted[Math.floor(middle)]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** "2008-12-31" as a point on a line of years: the end of 2008 is 2009.0. */
export const when = (date: string) => {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);

  return year + (month - 1) / 12 + (day - 1) / 365;
};

/** The whole dataset, as the exposure lab counted it in `wtt.edit`. */
export const corpus = {
  edits: exposureSummary.rows[0].edits,
  articles: exposureSummary.rows[0].pages,
  lastEdit: exposureSummary.rows[0].last_edit,
  firstTemporaryAccount: exposureSummary.rows[0].first_temp,
};

/* ── History of history: the name of the 1918 war ─────────────────────── */

/** The 23 dates every history-of-history measurement was taken at. */
export const snapshots = [
  ...new Set(warNames.rows.map((row) => row.date)),
].sort();

export const latestSnapshot = snapshots[snapshots.length - 1];

const namesAt = (date: string) =>
  warNames.rows.filter((row) => row.date === date);

/** Running-text mentions of each name, in all articles as of each date. */
export const names = snapshots.map((date) => {
  const rows = namesAt(date);
  const of = (name: string) =>
    rows.find((row) => row.name === name)!.running_text;

  const total = sum(rows.map((row) => row.running_text));
  const sisallissota = of("sisällissota");
  const vapaussota = of("vapaussota");
  const kansalaissota = of("kansalaissota");

  return {
    date,
    articles: rows[0].articles_total,
    total,
    sisallissota,
    vapaussota,
    kansalaissota,

    /** luokkasota, veljessota and punakapina together. */
    others: total - sisallissota - vapaussota - kansalaissota,
  };
});

/** Every place the string "vapaussota" sits in the latest wikitext. */
export const whiteNameStrings = (() => {
  const row = namesAt(latestSnapshot).find((r) => r.name === "vapaussota")!;

  return {
    all: row.mentions,
    medal: row.medal,
    otherCountries: row.other_countries,
    running: row.running_text,
  };
})();

/* ── History of history: the edit war over the name ───────────────────── */

const MAIN_ARTICLE = nameSwaps.main_article.page_id;

/** Edits that moved mentions from one name to the other and were not reverts. */
const attempts = (from: string, to: string) => {
  const direction = nameSwaps.by_direction.find(
    (row) => row.name_from === from && row.name_to === to,
  )!;

  const edits = nameSwaps.rows
    .filter(
      (row) =>
        row.name_from === from && row.name_to === to && row.is_revert === 0,
    )
    .map((row) => ({
      revId: row.rev_id,
      savedAt: row.saved_at,
      undone: row.was_undone === 1,
      undoneAfterSeconds: row.undone_after_seconds,
      onMainArticle: row.page_id === MAIN_ARTICLE,
      named: row.editor === "named",
    }))
    // Undone first, the main article first among those, then by date.
    .sort(
      (a, b) =>
        Number(b.undone) - Number(a.undone) ||
        Number(b.onMainArticle) - Number(a.onMainArticle) ||
        a.savedAt.localeCompare(b.savedAt),
    );

  const undone = edits.filter((edit) => edit.undone);
  const seconds = undone.map((edit) => edit.undoneAfterSeconds ?? 0);
  const count = (list: typeof edits) => ({
    all: list.length,
    undone: list.filter((edit) => edit.undone).length,
  });

  return {
    from,
    to,
    edits,

    /** The lab's own totals for the direction, which the rows must match. */
    fresh: direction.fresh,
    freshUndone: direction.fresh_undone,
    swaps: direction.swaps,
    articles: direction.articles,

    medianSecondsToUndo: median(seconds),
    undoneWithinHour: seconds.filter((s) => s <= 3600).length,
    onMainArticle: count(edits.filter((edit) => edit.onMainArticle)),
    anonymous: count(edits.filter((edit) => !edit.named)),
    named: count(edits.filter((edit) => edit.named)),
  };
};

export const swaps = {
  toWhite: attempts("sisällissota", "vapaussota"),
  toCivil: attempts("vapaussota", "sisällissota"),
  edits: new Set(nameSwaps.rows.map((row) => row.rev_id)).size,
  articles: new Set(nameSwaps.rows.map((row) => row.page_id)).size,
  pairs: nameSwaps.rows.length,
};

/* ── History of history: the main article ─────────────────────────────── */

const opening = (name: string) =>
  mainArticle.opening_names.find((row) => row.opening_name === name)!;

const side = (name: string) =>
  mainArticle.infobox_belligerent_1.find((row) => row.belligerent_1 === name)!;

export const article = {
  pageId: MAIN_ARTICLE,
  title: nameSwaps.main_article.titles_in_history[0].title,
  versions: nameSwaps.main_article.titles_in_history[0].versions,

  civil: opening("'''Suomen sisällissota'''"),
  warOf1918: opening("'''Suomen vuoden 1918 sota'''"),
  liberation: opening("'''Suomen vapaussota'''"),

  noInfobox: side("no infobox"),
  reds: side("Reds"),
  whites: side("Whites"),
  switched: mainArticle.infobox_side_switches[0],

  /** The opening sentence as it stood at the end of 2004. */
  lead2004: mainArticle.rows.find((row) => row.as_of === "2004-12-31")!,
};

/* ── History of history: which years the articles talk about ──────────── */

export const FIRST_DECADE = 1800;

const decadeRows = new Map(
  decadesMentioned.rows.map((row) => [`${row.date} ${row.decade}`, row]),
);

/** The decades drawn, 1800s to 2020s. */
export const decades = [
  ...new Set(decadesMentioned.rows.map((row) => row.decade)),
]
  .filter((decade) => decade >= FIRST_DECADE)
  .sort((a, b) => a - b);

/** One reading of Wikipedia per date: what share of year mentions each decade has. */
export const readings = yearsMentioned.rows.map((row) => {
  const at = (year: number) => row.mentions[year - yearsMentioned.first_year];

  const top = row.mentions.reduce(
    (best, mentions, index) => (mentions > row.mentions[best] ? index : best),
    0,
  );

  const all = decadesMentioned.rows.filter((r) => r.date === row.date);

  return {
    date: row.date,
    total: row.total,
    topYear: yearsMentioned.first_year + top,
    topMentions: row.mentions[top],
    at,
    cells: decades.map((decade) => ({
      decade,
      mentions: decadeRows.get(`${row.date} ${decade}`)?.mentions ?? 0,
      share:
        (decadeRows.get(`${row.date} ${decade}`)?.mentions ?? 0) / row.total,
    })),
    before: sum(
      all.filter((r) => r.decade < FIRST_DECADE).map((r) => r.mentions),
    ),
  };
});

export const reading = (date: string) =>
  readings.find((row) => row.date === date)!;

/** The largest share any drawn decade has at any date: the top of the scale. */
export const largestDecadeShare = Math.max(
  ...readings.flatMap((row) => row.cells.map((cell) => cell.share)),
);

/** The date at which a decade's share was highest. */
export const peakOf = (decade: number) =>
  readings
    .map((row) => ({
      date: row.date,
      share: row.cells.find((cell) => cell.decade === decade)!.share,
    }))
    .reduce((best, row) => (row.share > best.share ? row : best));

/* ── History of history: words ────────────────────────────────────────── */

const term = (name: string) =>
  termShares.rows
    .filter((row) => row.term === name && row.engine === "mariadb")
    .map((row) => ({
      date: row.date,
      articles: row.articles,
      total: row.articles_total,
      share: row.articles / row.articles_total,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

export const words = {
  nato: term("nato"),
  suomettuminen: term("suomettuminen"),
  patterns: termShares.patterns,
};

/* ── Exposure clock ───────────────────────────────────────────────────── */

const labels = (valid: number) =>
  identity.rows.find((row) => row.identity_valid === valid)!;

const knownHash = labels(1);

export const exposure = {
  /** Undone versions whose restoring revision has a known hash. */
  knownHash: {
    n: knownHash.n,
    medianSeconds: knownHash.median_seconds,
    withinMinute: knownHash.within_minute,
    withinHour: knownHash.within_hour,
    withinDay: knownHash.within_day,
    withinWeek: knownHash.within_week,
  },
  missingHash: labels(0).n,
  allLabels: exposureSummary.rows[0].undone_versions,
  overOneYear: exposureSummary.rows[0].over_one_year,

  /** 2003 has two undone versions and the lab's question starts in 2004. */
  years: knownHashByYear.rows
    .filter((row) => row.year >= 2004)
    .map((row) => ({
      year: row.year,
      n: row.n,
      medianMinutes: row.median_seconds / 60,
      withinHour: row.within_hour,
    })),

  /** All supplied labels, undone by someone else, by who made the edit. */
  byEditor: (editor: string) =>
    editorSummary.rows.find(
      (row) => row.editor === editor && row.self_revert === 0,
    )!,
};

const window = (period: string, group: string) => {
  const row = tempComparison.rows.find(
    (r) => r.period === period && r.editor_group === group,
  )!;

  return {
    edits: row.edits,
    undone: row.other_undone_7d,
    share: row.other_undone_7d / row.edits,
    medianSeconds: row.median_7d_seconds,
  };
};

const interval = (metric: string) =>
  uncertainty.rows.find((row) => row.metric === metric)!;

export const temporary = {
  before: window("before", "anonymous"),
  after: window("after", "anonymous"),
  yearEarlier: window("seasonal_baseline", "anonymous"),
  namedBefore: window("before", "named"),
  namedAfter: window("after", "named"),
  shareDifference: interval(
    "seven_day_undo_share_difference_percentage_points",
  ),
  medianDifference: interval("conditional_median_difference_seconds"),
};

export const clusters = {
  events: clusterSummary.rows[0].named_nonself_revert_events,
  articleMonths: clusterSummary.rows[0].article_months,

  /** The file has one row per pair of editors: keep each article-month once. */
  top: [
    ...new Map(
      revertClusters.rows.map((row) => [
        `${row.page_id} ${row.month}`,
        { title: row.title, month: row.month, events: row.revert_events },
      ]),
    ).values(),
  ].sort((a, b) => b.events - a.events),
};

/* ── Temporal ANN ─────────────────────────────────────────────────────── */

const design = (method: string, ef: number) => {
  const recall = annRecall.rows.find(
    (row) =>
      row.date === "overall" && row.method === method && row.ef_search === ef,
  )!;
  const latency = annLatency.rows.find(
    (row) =>
      row.date === "overall" && row.method === method && row.ef_search === ef,
  )!;

  return {
    pairs: recall.queries,
    recall: recall.recall_at_10,
    underfilled: recall.underfilled_share,
    fullButWrong: recall.full_but_wrong_share,
    medianMs: latency.median_ms,
    p95Ms: latency.p95_ms,
  };
};

const alive = annRecall.rows
  .filter((row) => row.method === "C" && row.alive !== null)
  .map((row) => row.alive ?? 0);

const unfiltered = (table: string, ef: number) => {
  const rows = annUnfiltered.rows.filter(
    (row) => row.table === table && row.ef_search === ef,
  );

  return sum(rows.map((row) => row.recall)) / rows.length;
};

export const ann = {
  vectors: annCorpus.rows,
  articles: annCorpus.pages,
  queries: annCorpus.heldout_queries,
  dates: annCorpus.dates.length,
  fewestAlive: Math.min(...alive),
  mostAlive: Math.max(...alive),

  versioned80: design("A", 80),
  versioned1000: design("A", 1000),
  joined50: design("B50", 80),
  joined200: design("B200", 80),
  joined1000: design("B1000", 80),
  exact: design("C", 80),

  /** The same index with no date at all, on the first ten queries. */
  unfiltered80: unfiltered("a FOR SYSTEM_TIME ALL", 80),
};
