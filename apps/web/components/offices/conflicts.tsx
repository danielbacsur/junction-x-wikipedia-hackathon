"use client";

import type { TermGap, TermOverlap } from "@wtt/package-engine";

import { LAST_YEAR, day as written, minute, span } from "@/lib/format";

const show =
  "shrink-0 rounded border border-rule px-2 py-1 text-xs text-ink-soft transition-colors hover:bg-paper-sunk";

const days = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;

/**
 * Where the articles disagree with each other. A gap is read at the end of
 * every year; two presidents at once never lasted that long, so those are
 * found by joining the table to itself on both timelines.
 */
export function Conflicts({
  gaps,
  overlaps,
  onShow,
}: {
  gaps: TermGap[];
  overlaps: TermOverlap[];
  onShow: (day: string, at: string | null) => void;
}) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <section className="rounded border border-rule bg-paper-raised">
        <h3 className="border-b border-rule px-4 py-3 font-serif text-xl">
          Days nobody claims
        </h3>
        <ul className="divide-y divide-rule">
          {gaps.map((gap) => {
            const still = gap.lastYear >= LAST_YEAR;

            return (
              <li
                key={`${gap.outgoing}:${gap.statedEnd}`}
                className="flex items-start gap-4 px-4 py-3 text-sm"
              >
                <div className="w-14 shrink-0 font-serif text-2xl tabular-nums">
                  {gap.days}
                  <span className="block font-sans text-[10px] tracking-wide text-ink-faint uppercase">
                    {gap.days === 1 ? "day" : "days"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-ink-soft">
                    {gap.outgoing} until{" "}
                    <span className="tabular-nums">
                      {written(gap.statedEnd)}
                    </span>
                    , {gap.incoming} from{" "}
                    <span className="tabular-nums">
                      {written(gap.statedStart)}
                    </span>
                    .
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    Stated together since{" "}
                    <span className="text-rubric tabular-nums">
                      {written(gap.firstSaid)}
                    </span>
                    {still
                      ? `, and at every year end since, to ${written(null)}.`
                      : `, at the year ends of ${gap.firstYear} to ${gap.lastYear}.`}
                  </p>
                </div>
                <button
                  type="button"
                  className={show}
                  onClick={() =>
                    onShow(
                      gap.statedEnd,
                      still ? null : `${gap.lastYear}-12-31 23:59:59`,
                    )
                  }
                >
                  show
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded border border-rule bg-paper-raised">
        <h3 className="border-b border-rule px-4 py-3 font-serif text-xl">
          Two presidents at once
        </h3>
        <ul className="divide-y divide-rule">
          {overlaps.map((overlap) => (
            <li
              key={`${overlap.from}:${overlap.one.person}:${overlap.other.person}`}
              className="flex items-start gap-4 px-4 py-2.5 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-ink-soft">
                  {overlap.one.person}{" "}
                  {overlap.one.to
                    ? `until ${written(overlap.one.to)}`
                    : "still in office"}
                  , {overlap.other.person} from {written(overlap.other.from)}:{" "}
                  <span className="font-medium text-ink">
                    {overlap.days === null
                      ? "every day since"
                      : `${days(overlap.days)} claimed twice`}
                  </span>
                  .
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  From{" "}
                  <span className="text-rubric tabular-nums">
                    {minute(overlap.from)}
                  </span>
                  , for{" "}
                  {overlap.seconds < 120
                    ? `${overlap.seconds} seconds`
                    : span(overlap.seconds / 86_400)}
                  .
                </p>
              </div>
              <button
                type="button"
                className={show}
                onClick={() =>
                  onShow(overlap.other.from, overlap.from.slice(0, 19))
                }
              >
                show
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
