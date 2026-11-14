import type { Trace } from "@wtt/package-engine";

import { FIRST_YEAR, LATEST } from "@/lib/format";

const DAY = 86_400_000;

/** A timestamp from the data as milliseconds. Times in the data are UTC. */
export const moment = (at: string) =>
  Date.parse(`${at.slice(0, 19).replace(" ", "T")}Z`);

/** The line every lifetime is drawn on: the first year to the last edit. */
export const AXIS = { from: Date.UTC(FIRST_YEAR, 0, 1), to: moment(LATEST) };

/** Where a moment falls on that line, from 0 at its start to 100 at its end. */
export const along = (at: number) =>
  Math.min(100, Math.max(0, ((at - AXIS.from) / (AXIS.to - AXIS.from)) * 100));

/** One wording with its place on the page. */
export type Placed = {
  trace: Trace;

  /** Names the wording in one article; the same words can stand in two. */
  key: string;

  /** The number that ties its line in the chart to its card. */
  n: number;
  from: number;

  /** The end of the dataset while the wording still stands. */
  to: number;

  /**
   * It left and came back, and was away for more than a day in all. Only
   * the first and last day are known then, not each stretch in between.
   */
  onAndOff: boolean;

  /**
   * Interpretation: the wording before this one in the same slot, which
   * we read as the same paragraph before it was reworded.
   */
  before: Placed | null;
};

export type Group = {
  pageId: number;
  title: string;
  placed: Placed[];

  /** Some of its wordings are joined by slot, so the page has to say so. */
  linked: boolean;
};

/**
 * Puts the wordings in reading order: the article that said it first
 * comes first, and inside an article the oldest wording comes first.
 */
export const arrange = (traces: Trace[]): Group[] => {
  const articles = new Map<number, Trace[]>();

  for (const trace of traces) {
    articles.set(trace.pageId, [...(articles.get(trace.pageId) ?? []), trace]);
  }

  const oldestFirst = (a: Trace, b: Trace) =>
    a.firstSeen.localeCompare(b.firstSeen);

  const ordered = [...articles.values()]
    .map((wordings) => wordings.sort(oldestFirst))
    .sort((a, b) => oldestFirst(a[0], b[0]));

  let n = 0;

  return ordered.map((wordings) => {
    const placed: Placed[] = [];

    for (const trace of wordings) {
      const from = moment(trace.firstSeen);
      const to = trace.lastSeen ? moment(trace.lastSeen) : AXIS.to;

      placed.push({
        trace,
        key: `${trace.pageId}-${trace.hash}`,
        n: ++n,
        from,
        to,
        onAndOff: trace.stays > 1 && (to - from) / DAY - trace.days > 1,

        // Slot 0 marks a kind of block whose rewordings are not followed.
        before:
          trace.slot === 0
            ? null
            : (placed.findLast(
                (earlier) => earlier.trace.slot === trace.slot,
              ) ?? null),
      });
    }

    return {
      pageId: wordings[0].pageId,
      title: wordings[0].title,
      placed,
      linked: placed.some((wording) => wording.before !== null),
    };
  });
};
