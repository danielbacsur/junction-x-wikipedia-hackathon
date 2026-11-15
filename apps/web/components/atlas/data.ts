/**
 * Everything the atlas draws, read from the labs' own result files. Nothing
 * here is typed in by hand: a number on the page is either a field of one of
 * these files or arithmetic on such fields. The few numbers the labs report
 * only in their README are in `quoted.ts`, each with the line it comes from.
 */
import gapsByYearEnd from "../../../../labs/bitemporal-offices/data/gaps-by-asof.json";
import officeTimings from "../../../../labs/bitemporal-offices/data/query-timings.json";
import officeSummary from "../../../../labs/bitemporal-offices/data/summary.json";
import termChanges from "../../../../labs/bitemporal-offices/data/term-changes.json";
import termsAsOf from "../../../../labs/bitemporal-offices/data/terms-by-asof.json";
import candidateWaits from "../../../../labs/claims-before-sources/data/all-candidate-metrics.json";
import sourceAudit from "../../../../labs/claims-before-sources/data/audit.json";
import neverSourced from "../../../../labs/claims-before-sources/data/never-unsourced-age.json";
import publicationYears from "../../../../labs/claims-before-sources/data/publication-summary.json";
import sourcingByYear from "../../../../labs/claims-before-sources/data/sourcing-by-year.json";
import sourcingSummary from "../../../../labs/claims-before-sources/data/summary.json";
import clusterSummary from "../../../../labs/exposure-clock/data/cluster-summary.json";
import editorSummary from "../../../../labs/exposure-clock/data/editor-summary.json";
import identity from "../../../../labs/exposure-clock/data/identity-sensitivity.json";
import revertClusters from "../../../../labs/exposure-clock/data/revert-clusters.json";
import exposureSummary from "../../../../labs/exposure-clock/data/summary.json";
import tempComparison from "../../../../labs/exposure-clock/data/temp-comparison.json";
import uncertainty from "../../../../labs/exposure-clock/data/uncertainty.json";
import knownHashByYear from "../../../../labs/exposure-clock/data/valid-exposure-by-year.json";
import scaleGrowth from "../../../../labs/history-at-scale/data/growth.json";
import scaleIndexes from "../../../../labs/history-at-scale/data/indexes.json";
import scaleInside from "../../../../labs/history-at-scale/data/inside-server.json";
import rowsByEndYear from "../../../../labs/history-at-scale/data/rows-by-end-year.json";
import scaleRowsRead from "../../../../labs/history-at-scale/data/rows-read.json";
import scaleSizes from "../../../../labs/history-at-scale/data/sizes.json";
import scaleLayouts from "../../../../labs/history-at-scale/data/timings.json";
import mainArticle from "../../../../labs/history-of-history/data/main-article.json";
import termShares from "../../../../labs/history-of-history/data/term-shares.json";
import nameSwaps from "../../../../labs/history-of-history/data/war-name-swaps.json";
import warNames from "../../../../labs/history-of-history/data/war-names.json";
import yearsMentioned from "../../../../labs/history-of-history/data/year-heatmap-years.json";
import decadesMentioned from "../../../../labs/history-of-history/data/year-heatmap.json";
import numberDurations from "../../../../labs/numbers-that-moved/data/durations.json";
import numberEditors from "../../../../labs/numbers-that-moved/data/editors.json";
import numberAudit from "../../../../labs/numbers-that-moved/data/manual-audit.json";
import numberSizes from "../../../../labs/numbers-that-moved/data/size-of-change.json";
import numberSummary from "../../../../labs/numbers-that-moved/data/summary.json";
import unsettledFigures from "../../../../labs/numbers-that-moved/data/unsettled.json";
import removalsReread from "../../../../labs/paragraph-survival/data/containment.json";
import survivalMedians from "../../../../labs/paragraph-survival/data/medians.json";
import oldestStanding from "../../../../labs/paragraph-survival/data/oldest-standing.json";
import survivalSummary from "../../../../labs/paragraph-survival/data/summary.json";
import survivalByEditor from "../../../../labs/paragraph-survival/data/survival-by-editor.json";
import survivalOverall from "../../../../labs/paragraph-survival/data/survival-overall.json";
import delayBins from "../../../../labs/sentence-journeys/data/delay-bins.json";
import sameReadingText from "../../../../labs/sentence-journeys/data/same-reading-text.json";
import transferCandidates from "../../../../labs/sentence-journeys/data/splits-and-merges.json";
import journeySummary from "../../../../labs/sentence-journeys/data/summary.json";
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

/* ── Paragraph survival ───────────────────────────────────────────────── */

const HOUR = 3_600;
const DAY = 86_400;

type Curve = {
  endpoint: string;
  grp: string;
  age_seconds: number;
  survival: number | null;
  at_risk: number;
}[];

/**
 * One Kaplan–Meier curve at the lab's fixed ages, an hour to twenty years,
 * with its median. An age past the group's follow-up has no value.
 */
const stays = (
  curve: Curve,
  endpoint: string,
  dimension: string,
  group: string,
) => {
  const median = survivalMedians.rows.find(
    (row) =>
      row.endpoint === endpoint &&
      row.dimension === dimension &&
      row.grp === group,
  )!;

  const points = curve
    .filter(
      (row) =>
        row.endpoint === endpoint &&
        row.grp === group &&
        row.age_seconds >= HOUR,
    )
    .flatMap((row) =>
      row.survival === null
        ? []
        : [{ seconds: row.age_seconds, share: row.survival }],
    );

  return {
    n: median.n,
    endings: median.deaths,

    /** Null when the curve has not come down to a half. */
    medianDays: median.median_days,
    points,

    /** The share already gone at one of the fixed ages. */
    goneBy: (seconds: number) =>
      1 - points.find((point) => point.seconds === seconds)!.share,
  };
};

const wordingCounts = survivalSummary.rows.find(
  (row) => row.prose_stays !== undefined,
)!;

export const survival = {
  HOUR,
  DAY,

  /** Every prose wording, removals that were later undone left open. */
  all: stays(survivalOverall.rows, "wording", "overall", "all"),

  /** The same with every removal counted as an ending. */
  raw: stays(survivalOverall.rows, "wording_raw", "overall", "all"),

  named: stays(survivalByEditor.rows, "wording", "editor", "named"),
  anonymous: stays(survivalByEditor.rows, "wording", "editor", "anonymous"),

  /** Inferred paragraphs, from first appearance to final disappearance. */
  slots: stays(survivalOverall.rows, "slot", "overall", "all"),

  standing: wordingCounts.standing ?? 0,
  undoneRemovals: wordingCounts.censored_removals ?? 0,
  standingSinceBefore2010: (wordingCounts.before_2010_pct ?? 0) / 100,

  /** The file is in order of age: the first row is the oldest. */
  oldest: oldestStanding.rows.map((row) => ({
    title: row.title,
    since: row.written_at,
    days: row.days,
    text: row.text,
    revId: row.born_rev,
  })),

  /** The longest-lived "removals", checked for their text still being there. */
  removals: {
    checked: removalsReread.rows[0].candidates,
    stillThereAfter: removalsReread.rows[0].present_at_removal,
    stillThereNow: removalsReread.rows[0].present_at_cutoff,
  },
};

/* ── Bitemporal offices ───────────────────────────────────────────────── */

const PRESIDENCY = "Suomen tasavallan presidentti";

const counted = (measure: string) =>
  officeSummary.rows.find((row) => row.measure === measure)!.value;

/** "2012-03-14 19:17:02", or a date alone, as seconds. */
const seconds = (moment: string) =>
  Date.parse(
    `${moment.replace(" ", "T").padEnd(11, "T").padEnd(19, "00:00:00")}Z`,
  ) / 1000;

/** A stated term includes its first day and not its last. */
const covers = (from: string, to: string | null, date: string) =>
  from <= date && (to === null || date < to);

const presidencyChanges = termChanges.rows
  .filter((row) => row.office === PRESIDENCY)
  .sort((a, b) => a.changed_at.localeCompare(b.changed_at));

/** The four moments a2-answer-that-flips.sql asks Wikipedia at. */
const ASKED_AT = [
  "2006-12-31 23:59:59",
  "2008-12-31 23:59:59",
  "2012-12-31 23:59:59",
  null,
];

/**
 * Who the presidents' articles named for one day, over Wikipedia's own
 * time. Only the changes that moved a stated term across the day are
 * replayed, so this holds for a day whose answer came from them alone.
 */
const answersFor = (date: string) => {
  const moves = presidencyChanges
    .map((row) => ({
      at: row.changed_at,
      person: row.person,
      revId: row.rev_id,
      before: covers(row.from_before, row.to_before, date),
      after: covers(row.from_after, row.to_after, date),
    }))
    .filter((move) => move.before !== move.after);

  // Whoever a first move takes the day from was named for it from the start.
  const first = termsAsOf.rows.find(
    (row) =>
      row.as_of === "2006-12-31" &&
      covers(row.valid_from, row.valid_to, date) &&
      moves.find((move) => move.person === row.person)?.before,
  )!;

  let named = [
    { person: first.person, revId: first.rev_id, since: first.said_since },
  ];
  let since = first.said_since;

  const stretches = moves.map((move) => {
    const stretch = { from: since, to: move.at, named };

    named = move.after
      ? [...named, { person: move.person, revId: move.revId, since: move.at }]
      : named.filter((holder) => holder.person !== move.person);
    since = move.at;

    return stretch;
  });

  const all = [...stretches, { from: since, to: null, named }].map(
    (stretch) => ({
      ...stretch,
      seconds: seconds(stretch.to ?? corpus.lastEdit) - seconds(stretch.from),
    }),
  );

  /** An answer stood for days. Between two edits of one sitting, seconds. */
  const answers = all.filter((stretch) => stretch.seconds >= DAY);

  return {
    date,
    answers,
    inBetween: all.filter((stretch) => stretch.seconds < DAY),
    asked: ASKED_AT.map((moment) => ({
      asOf: moment,
      answer: answers.find((stretch) =>
        moment === null || stretch.to === null
          ? moment === stretch.to
          : stretch.from <= moment && stretch.to > moment,
      )!,
    })),
  };
};

const statedToday = termsAsOf.rows
  .filter((row) => row.as_of === "now")
  .sort((a, b) => a.valid_from.localeCompare(b.valid_from));

/** Handovers at which today's articles leave days to nobody. */
const unclaimed = statedToday.slice(1).flatMap((incoming, index) => {
  const outgoing = statedToday[index];
  if (outgoing.valid_to === null) return [];

  const days =
    (seconds(incoming.valid_from) - seconds(outgoing.valid_to)) / DAY;

  // When each side of the handover was first moved to the date it has today.
  const ended = presidencyChanges.find(
    (row) =>
      row.person === outgoing.person &&
      row.to_before !== row.to_after &&
      row.to_after === outgoing.valid_to,
  );
  const started = presidencyChanges.find(
    (row) =>
      row.person === incoming.person &&
      row.from_before !== row.from_after &&
      row.from_after === incoming.valid_from,
  );

  // The gap is as old as the later of the two.
  const since = [ended, started]
    .flatMap((change) => (change ? [change.changed_at] : []))
    .sort()
    .at(-1);

  return days > 0 && since
    ? [
        {
          outgoing: outgoing.person,
          ends: outgoing.valid_to,
          incoming: incoming.person,
          starts: incoming.valid_from,
          days,
          since,
        },
      ]
    : [];
});

const timed = (query: string) =>
  officeTimings.rows.find((row) => row.query === query)!.ms;

export const offices = {
  articles: counted("articles read"),
  versions: counted("versions read"),
  skipped: counted("versions skipped as reverted within 30 days"),
  withoutInfobox: counted("accepted versions without an office infobox"),
  statements: counted("stated terms read (version x term)"),
  refused: counted("stated terms refused (version x field)"),
  rows: counted("claim lifetime rows loaded (office_term, all system time)"),
  statedToday: counted("of those, current statements"),
  rowsWithEveryVersion: counted("none: claim rows"),
  presidencyRows: officeSummary.by_office.find(
    (row) => row.office === PRESIDENCY,
  )!.claim_rows,

  changes: termChanges.rows.length,
  presidencyChanges: presidencyChanges.length,
  changesToTodaysValue: termChanges.rows.filter(
    (row) => row.verdict === "to today's value",
  ).length,
  changesWithoutSummary: termChanges.rows.filter((row) => !row.comment).length,

  /** Who was president on 1 March 1925? */
  flip: answersFor("1925-03-01"),

  unclaimed,

  /** Days no article claims, as Wikipedia stood at each year end. */
  gaps: gapsByYearEnd.rows.map((row) => ({
    year: row.year_end,
    handovers: row.gaps,
    days: row.gap_days,
  })),

  flipMs: timed("a2-answer-that-flips"),
  changesMs: timed("c-term-changes"),
};

/* ── Numbers that moved ───────────────────────────────────────────────── */

const substituted = (metric: string) =>
  numberSummary.rows.find((row) => row.metric === metric)!.value;

/**
 * The lab's two populations. "all" is every substitution, "clean" the ones
 * where neither the old nor the new wording came in with a reverted edit.
 */
const sized = (population: string) => {
  const band = (name: string) => {
    const row = numberSizes.rows.find(
      (r) => r.population === population && r.band === name,
    )!;

    return { count: row.count, share: row.share };
  };

  return {
    quantities: numberSizes.rows.find((r) => r.population === population)!
      .denominator,
    under1: band("under 1%"),
    upTo10: band("1–10%"),
    over10: band("over 10%"),

    /** Counted inside "over 10 %": the larger value is ten times the smaller. */
    tenfold: band("at least tenfold (overlapping)"),
    fromZero: band("zero baseline"),

    oneDigitReplaced: band("single digit replacement shape"),
    oneDigitMore: band("single digit insertion/deletion shape"),
    twoDigitsSwapped: band("digit transposition shape"),
  };
};

/** How long a figure was observed in its exact sentence, in the lab's bands. */
const observed = (population: string, side: string) => {
  const row = numberDurations.rows.find(
    (r) => r.population === population && r.side === side,
  )!;

  return {
    n: row.n,
    medianDays: row.median_observed_days,

    /** Stays that reach the cutoff: their length is only a lower bound. */
    standing: row.censored,
    bands: Object.entries(row.bands).map(([band, count]) => ({
      band,
      count,
      share: count / row.n,
    })),
  };
};

const readByHand = new Map(numberAudit.rows.map((row) => [row.figure_id, row]));

/** The lab's 25 least settled figures, in its own order. */
const unsettled = unsettledFigures.rows.map((row, index) => {
  const read = readByHand.get(row.figure_id);
  const from = seconds(row.timeline[0].a);
  const to = seconds(row.timeline[row.timeline.length - 1].b);

  return {
    rank: index + 1,
    id: row.figure_id,
    article: row.article,
    kind: row.kind,

    /** One wording of the sentence the figure sits in. */
    sentence: row.sentence,
    values: row.distinct_values,
    substitutions: row.flips,
    returns: row.returns,

    /** Every value the position held, with where its stay lies from 0 to 1. */
    timeline: row.timeline.map((stay) => ({
      from: stay.a,
      to: stay.b,
      value: stay.display,
      standing: stay.censored,
      starts: (seconds(stay.a) - from) / (to - from),
      ends: (seconds(stay.b) - from) / (to - from),
    })),

    /** The one substitution of this figure that was read by hand. */
    read: read && {
      old: read.old,
      new: read.new,
      at: read.at,
      verdict: read.classification,
    },
  };
});

export const numbers = {
  all: substituted("all_substitutions"),

  /** Neither wording came in with an edit that was later reverted. */
  kept: substituted("both_endpoints_not_reverted"),

  /** The new wording did not. The old one may have. */
  newKept: substituted("new_endpoint_not_reverted"),

  articles: substituted("articles_with_substitutions"),
  scanned: substituted("pages_scanned"),
  proseRows: substituted("prose_rows"),

  /** Left out by the strict rule. */
  formattingOnly: substituted("formatting_only_edges"),
  severalNumbers: substituted("multiple_number_edges"),

  kinds: {
    quantity: substituted("clean_quantity"),
    year: substituted("clean_year"),
    date: substituted("clean_date"),
    mixed: substituted("clean_mixed"),
  },

  size: { all: sized("all"), kept: sized("clean") },

  stood: {
    old: observed("clean", "old"),
    new: observed("clean", "new"),
    oldOfAll: observed("all", "old"),
    newOfAll: observed("all", "new"),
  },

  /** Who made the kept substitutions, and whose value is there at the cutoff. */
  editors: numberEditors.rows
    .filter((row) => row.population === "clean" && row.n > 0)
    .map((row) => ({
      editor: row.editor,
      changes: row.n,
      standing: row.value_standing,
      unbroken: row.uninterrupted_new_stay_at_cutoff,
      share: row.standing_share ?? 0,
    })),

  positions: substituted("unsettled_figures"),
  withReturn: substituted("figures_with_return"),
  unsettled,

  /** The same list with the highest-ranked figure of each article only. */
  unsettledByArticle: unsettled.filter(
    (figure, index) =>
      unsettled.findIndex((other) => other.article === figure.article) ===
      index,
  ),

  audit: numberAudit.rows.map((row) => ({
    rank: row.rank,
    article: row.article,
    verdict: row.classification,
  })),
};

/* ── History at scale ─────────────────────────────────────────────────── */

type Run = {
  layout: string;
  statement: string;
  page: string | null;
  as_of: string;
  rows_returned: number;
  handler_reads: number;
  icp_attempts: number | null;
  median_ms: number;
  min_ms: number;
  max_ms: number;
  key: string | null;
  partitions: string | null;
};

/** One case of the lab: a statement, an article, a moment and a plan. */
const ran = (
  rows: Run[],
  layout: string,
  statement: string,
  page: string | null,
  asOf: string,
) => {
  const row = rows.find(
    (r) =>
      r.layout === layout &&
      r.statement === statement &&
      r.page === page &&
      r.as_of === asOf,
  )!;

  return {
    asOf,
    returned: row.rows_returned,

    /** The session's Handler_read_% counters, summed, for one run. */
    read: row.handler_reads,

    /** Index entries a pushed-down condition tested: Handler_icp_attempts. */
    checked: row.icp_attempts ?? 0,

    /** Client time: the median of the timed runs, the fastest, the slowest. */
    ms: row.median_ms,
    fastest: row.min_ms,
    slowest: row.max_ms,

    /** The key EXPLAIN names, or none for a scan of the whole table. */
    key: row.key === "None" ? null : row.key,
    partitions: row.partitions?.split(",") ?? [],
  };
};

/** The moments every article was asked at. "now" is a read with no date. */
const MOMENTS = [...new Set(scaleRowsRead.rows.map((row) => row.as_of))];

/** The table at one, two and four times its rows. */
const SIZES = [
  ...new Map(
    scaleGrowth.rows.map((row) => [row.scale, row.table_rows]),
  ).entries(),
].map(([times, rows]) => ({ times, rows }));

const copy = (table: string, copies: number) =>
  scaleSizes.rows.find((row) => row.table === table && row.copy === copies)!;

/** The flat table after its last load, with four copies of the rows. */
const largestCopy = scaleSizes.rows
  .filter((row) => row.table === "p_flat")
  .reduce((last, row) => (row.copy > last.copy ? row : last));

export const scale = {
  moments: MOMENTS,

  /** `passage` over all time, and the rows that are current. */
  rows: copy("p_flat", 0).rows_inserted,
  current: rowsByEndYear.rows.find((row) => typeof row.ended !== "number")!
    .rows,

  /** Rows the article has over all time. */
  allTime: (page: string) =>
    scaleRowsRead.rows.find((row) => row.page === page)!.page_rows_all,

  /** Run B: one flat table, read through its primary key and each index. */
  indexes: (page: string) =>
    MOMENTS.map((asOf) => ({
      asOf,
      primary: ran(scaleIndexes.rows, "flat", "blocks", page, asOf),
      chosen: ran(scaleIndexes.rows, "idx", "blocks", page, asOf),
      pe: ran(scaleIndexes.rows, "idx_pe", "blocks", page, asOf),
      ps: ran(scaleIndexes.rows, "idx_ps", "blocks", page, asOf),
      per: ran(scaleIndexes.rows, "idx_per", "blocks", page, asOf),
    })),

  /** Run A: the same rows flat, in two partitions and in yearly ones. */
  layouts: (page: string) =>
    MOMENTS.map((asOf) => ({
      asOf,
      flat: ran(scaleLayouts.rows, "flat", "blocks", page, asOf),
      two: ran(scaleLayouts.rows, "hc", "blocks", page, asOf),
      yearly: ran(scaleLayouts.rows, "year", "blocks", page, asOf),
    })),

  /** One ANALYZE run: what the server did, without sending the rows. */
  inside: (layout: string, page: string, asOf: string) => {
    const row = scaleInside.rows.find(
      (r) => r.layout === layout && r.page === page && r.as_of === asOf,
    )!;

    return {
      read: row.rows_read,
      checked: row.index_entries_checked,
      pages: row.pages_accessed,
      ms: row.server_ms,
    };
  },

  yearly: {
    /** One partition per year a row can have ended in, and the current one. */
    partitions: rowsByEndYear.rows.map((row, index, all) => ({
      name: index === all.length - 1 ? "pn" : `p${index}`,
      year: typeof row.ended === "number" ? row.ended : null,
      rows: row.rows,
    })),

    /** The search join: 300 candidate wordings as of the earliest moment. */
    search: {
      flat: ran(scaleLayouts.rows, "flat", "search", null, MOMENTS[0]),
      yearly: ran(scaleLayouts.rows, "year", "search", null, MOMENTS[0]),
    },
  },

  sizes: SIZES,

  /** The one moment the count over all articles has that no article has. */
  countedAt: scaleGrowth.rows.find(
    (row) => row.statement === "global" && !MOMENTS.includes(row.as_of),
  )!.as_of,

  /** One case at each size of the table. */
  grown: (plan: string, statement: string, page: string | null, asOf: string) =>
    SIZES.map(({ times, rows }) => ({
      times,
      rows,
      ...ran(
        scaleGrowth.rows.filter((row) => row.scale === times),
        plan,
        statement,
        page,
        asOf,
      ),
    })),

  /** The largest table: its rows and its indexes on disk. */
  largest: {
    dataBytes: largestCopy.data_bytes,
    indexBytes: largestCopy.index_bytes,
  },
};

/* ── Sentence journeys ────────────────────────────────────────────────── */

const travelled = journeySummary.rows[0];

export const journeys = {
  articles: travelled.articles,
  wordings: travelled.prose_wordings,
  shared: travelled.shared,
  inFiveOrMore: travelled.five_plus,
  mostArticles: travelled.max_articles,
  sharedToday: travelled.current_shared,

  /** The same reading text can sit under more than one hash. */
  readingTexts: sameReadingText.rows[0].clean_texts,

  delay: {
    medianDays: travelled.delay.median_seconds / DAY,
    withinHour: travelled.delay.within_hour,
    withinDay: travelled.delay.within_day,
    bins: delayBins.rows.map((row) => ({
      bin: row.bin,
      wordings: row.wordings,
    })),
  },

  transfers: {
    events: travelled.transfers.events,
    moves: travelled.transfers.move_events,
    copies: travelled.transfers.copy_events,
    withComment: travelled.comment_corroboration.either_comment_matches,
    wordings: travelled.bulk_reused_wordings,

    /** The file holds the thirty largest, largest first. */
    largest: transferCandidates.rows.map((row) => ({
      source: row.source,
      destination: row.destination,
      at: row.at,
      revId: row.dst_rev,
      paragraphs: row.paragraphs,
      moved: row.moved,
      retained: row.retained,
      comment: row.comment,
    })),
  },

  bornWithEarlierText: travelled.birth.any_reused_at_birth,
  bornWithFive: travelled.birth.five_reused_at_birth,

  /** First and second article, where the first still had the text. */
  outlasting: {
    pairs: travelled.survival.overlapping_first_second,
    later: travelled.survival.destination_outlives,
    first: travelled.survival.source_outlives,
    bothStanding: travelled.survival.both_censored,
    followedAYear: travelled.survival.eligible_year,
    laterAfterAYear: travelled.survival.destination_survives_year,
    firstAfterAYear: travelled.survival.source_survives_year,
  },
};

/* ── Claims before sources ────────────────────────────────────────────── */

const sourced = sourcingSummary.rows[0];

const waited = new Map(
  candidateWaits.rows.map((row) => [
    `${row.page_id} ${row.slot}`,
    row.wait_days,
  ]),
);

export const sourcing = {
  paragraphs: sourced.current_paragraphs,
  referenced: sourced.referenced_today,
  bornReferenced: sourced.born_with_reference,
  gained: sourced.gained_reference,
  unreferenced: sourced.no_reference_today,
  lostTheirs: sourced.reference_removed,

  wait: {
    medianDays: sourced.gained_wait_median_days,
    q25Days: sourced.gained_wait_p25_days,
    q75Days: sourced.gained_wait_p75_days,
  },

  /** No inline reference now or at any time, in a slot this old. */
  neverIn15Years: neverSourced.rows[0].years15,
  unreferencedFor15Years: sourced.unsourced_15_years,

  references: sourced.publication_reference_occurrences,
  dated: sourced.publication_year_parsed,
  namedElsewhere: publicationYears.rows[0].current_unresolved_named,

  candidates: sourced.candidate_paragraphs,

  /** New prose paragraphs of each year, with those later removed. */
  years: sourcingByYear.rows.map((row) => ({
    year: row.year,
    paragraphs: row.paragraphs,
    born: row.born_referenced,
    share: row.born_referenced / row.paragraphs,
  })),

  /** The longest waits, read one by one, in order of the wait. */
  audit: sourceAudit.rows.map((row) => ({
    rank: row.rank,
    article: row.article,
    verdict: row.classification,
    waitDays: waited.get(`${row.page_id} ${row.slot}`) ?? 0,
  })),

  confirmedCircular: sourced.confirmed_circular_sourcing,
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
