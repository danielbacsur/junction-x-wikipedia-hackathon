"use client";

import type { StatedTerm } from "@wtt/package-engine";

import { LATEST, day as written } from "@/lib/format";

import {
  FIRST_DAY,
  LAST_DAY,
  PRESIDENT,
  dayAt,
  dayNumber,
  holdingOn,
  standingAt,
  statedToday,
} from "./time";

/** Heights in pixels. Widths are percentages, so nothing has to be measured. */
const TOP = 22;
const ROW = 34;
const FOOT = 22;

const FROM = dayNumber(FIRST_DAY);
const TO = dayNumber(LAST_DAY);

const along = (day: string) =>
  ((Math.min(TO, Math.max(FROM, dayNumber(day))) - FROM) / (TO - FROM)) * 100;

const percent = (value: number) => `${value.toFixed(3)}%`;

const DECADES = [
  1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020,
];

/** A stated term as the infobox writes it: first day, then the handover day. */
export const stated = (term: { from: string; to: string | null }) =>
  `${written(term.from)} – ${term.to ? written(term.to) : "in office"}`;

function Swatch({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="24"
      height="10"
      aria-hidden
      className="mr-1.5 inline-block align-[-1px]"
    >
      {children}
    </svg>
  );
}

/** Handovers that do not meet, among the terms stated at one moment. */
const handovers = (terms: StatedTerm[]) => {
  const inOrder = terms
    .filter((term) => !term.acting)
    .sort((a, b) => a.from.localeCompare(b.from));

  return inOrder.flatMap((term, index) => {
    const before = inOrder[index - 1];
    if (!before?.to || before.to === term.from) return [];

    return [
      {
        outgoing: before,
        incoming: term,
        days: dayNumber(term.from) - dayNumber(before.to),
      },
    ];
  });
};

/**
 * The presidents' terms as Wikipedia stated them at one moment, on a line
 * of the days they cover. A change of a stated date is a day or two, far
 * less than a pixel on a century, so a bar that differs from what
 * Wikipedia states today is drawn differently and its dates are written
 * out underneath.
 */
export function TermsChart({
  terms,
  day,
  at,
  onPick,
}: {
  /** Every statement ever made: the chart picks the ones that stood. */
  terms: StatedTerm[];
  day: string;

  /** The Wikipedia moment, or null for the latest. */
  at: string | null;
  onPick: (day: string) => void;
}) {
  const standing = standingAt(terms, at);
  const today = standingAt(terms, null);
  const holders = new Set(
    holdingOn(standing, day).map((term) => `${term.pageId}:${term.from}`),
  );

  // One row per article, in the order Wikipedia lists the presidents today.
  const rows = today
    .filter((term) => term.office === PRESIDENT)
    .sort((a, b) => a.from.localeCompare(b.from))
    .map((president) => ({
      president,
      bars: standing.filter((term) => term.pageId === president.pageId),
    }));

  const changed = standing.filter((term) => !statedToday(terms, term));
  const unmet = handovers(standing);
  const silent = rows.filter((row) => row.bars.length === 0);

  const bottom = TOP + rows.length * ROW + 4;
  const x = along(day);
  const moment = written(at ?? LATEST);

  return (
    <figure className="rounded border border-rule bg-paper-raised">
      <figcaption className="px-4 pt-3 text-xs tracking-wide text-ink-faint uppercase">
        The stated terms, as Wikipedia stood on{" "}
        <span className="text-rubric">{moment}</span>
      </figcaption>

      <div className="px-4 pt-3 pb-3">
        <svg
          width="100%"
          height={bottom + FOOT}
          role="img"
          aria-label={`Terms of the presidents of Finland as stated on ${moment}`}
          className="block cursor-pointer overflow-visible select-none"
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const share = (event.clientX - box.left) / box.width;

            onPick(
              dayAt(
                Math.round(
                  FROM + Math.min(1, Math.max(0, share)) * (TO - FROM),
                ),
              ),
            );
          }}
        >
          <g className="stroke-rule">
            {DECADES.filter((year) => year % 20 === 0).map((year) => (
              <line
                key={year}
                x1={percent(along(`${year}-01-01`))}
                x2={percent(along(`${year}-01-01`))}
                y1={TOP}
                y2={bottom}
              />
            ))}
          </g>

          {rows.map(({ president, bars }, index) => {
            const y = TOP + index * ROW;
            const held = bars.some((term) =>
              holders.has(`${term.pageId}:${term.from}`),
            );
            const own = bars.filter((term) => !term.acting);
            const differs = own.some((term) => !statedToday(terms, term));

            return (
              <g key={president.pageId}>
                {/* The paper-coloured stroke keeps a name clear of the lines under it. */}
                <text
                  x="0"
                  y={y + 11}
                  strokeWidth={4}
                  paintOrder="stroke"
                  className={`stroke-paper-raised text-[12px] ${held ? "fill-ink font-medium" : "fill-ink-soft"}`}
                >
                  {president.person}
                </text>
                <text
                  x="100%"
                  y={y + 11}
                  textAnchor="end"
                  strokeWidth={4}
                  paintOrder="stroke"
                  className={`stroke-paper-raised text-[11px] tabular-nums ${
                    differs ? "fill-removed" : "fill-ink-faint"
                  }`}
                >
                  {own.length > 0
                    ? own
                        .sort((a, b) => a.from.localeCompare(b.from))
                        .map(stated)
                        .join(", ")
                    : "no term stated"}
                </text>

                {bars.map((term) => {
                  const start = along(term.from);
                  const end = along(term.to ?? LAST_DAY);
                  const same = statedToday(terms, term);

                  return (
                    <rect
                      key={`${term.office}:${term.from}:${term.to}`}
                      x={percent(start)}
                      y={y + (term.acting ? 21 : 18)}
                      width={percent(Math.max(end - start, 0.15))}
                      height={term.acting ? 3 : 8}
                      className={
                        same
                          ? "fill-ink-soft"
                          : "fill-removed-wash stroke-removed"
                      }
                    >
                      <title>
                        {`${term.person}${term.acting ? ", acting" : ""}: ${stated(term)}` +
                          (same ? "" : ". Wikipedia no longer states this.")}
                      </title>
                    </rect>
                  );
                })}
              </g>
            );
          })}

          {/* The day asked about, in ink: it is a day of history, not of Wikipedia. */}
          <line
            x1={percent(x)}
            x2={percent(x)}
            y1={12}
            y2={bottom}
            strokeWidth={1.5}
            className="stroke-ink"
          />
          <text
            x={percent(x)}
            y={9}
            dx={x > 60 ? -5 : 5}
            textAnchor={x > 60 ? "end" : "start"}
            className="fill-ink text-[10px] font-medium tabular-nums"
          >
            {written(day)}
          </text>

          <g className="stroke-ink-faint">
            <line x1="0" x2="100%" y1={bottom} y2={bottom} />
            {DECADES.map((year) => (
              <line
                key={year}
                x1={percent(along(`${year}-01-01`))}
                x2={percent(along(`${year}-01-01`))}
                y1={bottom}
                y2={bottom + (year % 20 === 0 ? 5 : 3)}
              />
            ))}
          </g>
          {DECADES.filter((year) => year % 20 === 0).map((year) => (
            <text
              key={year}
              x={percent(along(`${year}-01-01`))}
              y={bottom + 17}
              textAnchor="middle"
              className="fill-ink-faint text-[10px] tabular-nums"
            >
              {year}
            </text>
          ))}
        </svg>
      </div>

      <div className="border-t border-rule px-4 py-3 text-xs leading-relaxed text-ink-faint">
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <span>
            <Swatch>
              <rect y="1" width="24" height="8" className="fill-ink-soft" />
            </Swatch>
            stated the same on {written(LATEST)}, the latest in the dataset
          </span>
          <span>
            <Swatch>
              <rect
                x="0.5"
                y="1.5"
                width="23"
                height="7"
                className="fill-removed-wash stroke-removed"
              />
            </Swatch>
            a start or end Wikipedia no longer states
          </span>
          <span>
            <Swatch>
              <rect y="4" width="24" height="3" className="fill-ink-soft" />
            </Swatch>
            acting
          </span>
          <span>Click the chart to move the day.</span>
        </p>

        {changed.length > 0 && (
          <ul className="mt-3 grid gap-x-8 gap-y-1 text-ink-soft tabular-nums lg:grid-cols-2">
            {changed.map((term) => {
              const now = today.filter(
                (other) =>
                  other.pageId === term.pageId && other.office === term.office,
              );

              return (
                <li
                  key={`${term.pageId}:${term.office}:${term.from}:${term.to}`}
                >
                  <span className="font-medium">{term.person}</span>
                  {term.acting && " (acting)"}{" "}
                  <span className="text-removed">{stated(term)}</span>
                  <span className="text-ink-faint">
                    {now.length > 0
                      ? `, today ${now.map(stated).join(" and ")}`
                      : ", not stated today"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {(unmet.length > 0 || silent.length > 0) && (
          <p className="mt-3 text-ink-soft">
            {unmet.map((handover) => (
              <span
                key={`${handover.incoming.pageId}:${handover.incoming.from}`}
                className="mr-4 inline-block"
              >
                {handover.days > 0
                  ? `Nobody for ${handover.days} ${handover.days === 1 ? "day" : "days"}`
                  : `Two at once for ${-handover.days} ${handover.days === -1 ? "day" : "days"}`}
                {": "}
                {handover.outgoing.person} to {written(handover.outgoing.to!)},{" "}
                {handover.incoming.person} from{" "}
                {written(handover.incoming.from)}.
              </span>
            ))}
            {silent.length > 0 && (
              <span className="inline-block text-ink-faint">
                No presidential term was stated in the article of{" "}
                {silent.map((row) => row.president.person).join(", ")}.
              </span>
            )}
          </p>
        )}
      </div>
    </figure>
  );
}
