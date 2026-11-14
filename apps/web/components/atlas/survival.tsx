import Link from "next/link";

import { day, number, readHref } from "@/lib/format";

import { Figure, Plot, Rules, Stretch, path, spread } from "./chart";
import { survival } from "./data";
import { across, percent } from "./format";

const { all, raw, named, anonymous } = survival;

const TOP = 14;
const TALL = 280;
const FOOT = 26;
const BOTTOM = TOP + TALL;

/* The ages run from an hour to twenty years, so the scale is a log. */
const YOUNGEST = all.points[0].seconds;
const OLDEST = all.points[all.points.length - 1].seconds;

const x = (seconds: number) =>
  Math.log(seconds / YOUNGEST) / Math.log(OLDEST / YOUNGEST);

const y = (share: number) => TOP + (1 - share) * TALL;

const YEAR = 365.25 * survival.DAY;

const AGES = [
  { seconds: survival.HOUR, name: "1 hour", phone: true },
  { seconds: survival.DAY, name: "1 day", phone: true },
  { seconds: 7 * survival.DAY, name: "1 week", phone: false },
  { seconds: 30 * survival.DAY, name: "30 days", phone: true },
  { seconds: YEAR, name: "1 year", phone: true },
  { seconds: 5 * YEAR, name: "5 years", phone: false },
  { seconds: 20 * YEAR, name: "20 years", phone: true },
];

type Stays = typeof all;

const LINES: {
  name: string;
  what: string;
  stays: Stays;
  stroke: string;
  fill: string;
  width: number;
  dash?: string;
}[] = [
  {
    name: "named",
    what: "Introduced by a named account",
    stays: named,
    stroke: "stroke-ink-soft",
    fill: "fill-ink-soft",
    width: 1.5,
  },
  {
    name: "all",
    what: "All wordings",
    stays: all,
    stroke: "stroke-ink",
    fill: "fill-ink",
    width: 2.5,
  },
  {
    name: "undone removals too",
    what: "If removals that were later undone count as endings",
    stays: raw,
    stroke: "stroke-ink-faint",
    fill: "fill-ink-faint",
    width: 1.5,
    dash: "4 3",
  },
  {
    name: "anonymous",
    what: "Introduced by an IP or temporary account",
    stays: anonymous,
    stroke: "stroke-gold",
    fill: "fill-gold",
    width: 1.5,
  },
];

/**
 * The curve with the moment it comes down to a half put in: the median is
 * a step of the lab's curve that falls between two of its fixed ages.
 */
const drawn = (stays: Stays) =>
  [
    ...stays.points,
    { seconds: (stays.medianDays ?? 0) * survival.DAY, share: 0.5 },
  ]
    .filter((point) => point.seconds >= YOUNGEST)
    .sort((a, b) => a.seconds - b.seconds);

const days = (value: number | null) => `${(value ?? 0).toFixed(1)} days`;

/** How long an exact wording of a paragraph stays in its article. */
export function Survival() {
  const halfLife = (all.medianDays ?? 0) * survival.DAY;

  const ends = spread(
    LINES.map((line) => ({
      line,
      y: y(line.stays.points[line.stays.points.length - 1].share),
    })),
    13,
    BOTTOM - 4,
  );

  return (
    <Figure
      title={`Share of exact wordings still standing, by age · ${number(all.n)} stays of prose paragraphs`}
      read={
        <>
          A stay is one exact wikitext of a paragraph in one article, from the
          edit that put it there to the edit after which it is gone. Any change
          ends it, a moved comma or an added footnote as much as a deletion.
          Each line is the share of stays that have lasted at least that long,
          on a log scale: an hour at the left edge, twenty years at the right.
          Stays that still stand on 1 October 2026 are counted as unfinished,
          not as ended (a Kaplan–Meier estimate).
        </>
      }
    >
      <Plot
        height={BOTTOM + FOOT}
        label={`Share of prose wordings still standing from one hour to twenty years: half are gone after ${days(all.medianDays)}`}
        className="pr-3 pl-9 sm:pr-32"
      >
        <Rules
          ticks={[0.25, 0.5, 0.75, 1]}
          y={y}
          format={(tick) => percent(tick)}
        />

        {/* What the first hour takes, before the curve begins. */}
        <line
          x1="0"
          x2="0"
          y1={y(1)}
          y2={y(1 - all.goneBy(survival.HOUR))}
          strokeWidth={3}
          className="stroke-removed"
        />
        <text
          x="0"
          dx={9}
          y={y(1 - all.goneBy(survival.HOUR) / 2)}
          dominantBaseline="central"
          className="fill-removed text-[10px] tabular-nums"
        >
          {percent(all.goneBy(survival.HOUR), 2)} gone within the first hour
        </text>

        {/* Time is red: the age at which half of all wordings are gone. */}
        <line
          x1={across(x(halfLife))}
          x2={across(x(halfLife))}
          y1={y(0.5)}
          y2={BOTTOM}
          strokeDasharray="4 3"
          className="stroke-rubric"
        />
        <text
          x={across(x(halfLife))}
          dx={-7}
          y={BOTTOM - 8}
          textAnchor="end"
          className="fill-rubric text-[10px] font-medium tabular-nums"
        >
          half are gone after {days(all.medianDays)}
        </text>

        <Stretch height={BOTTOM + FOOT}>
          {LINES.map((line) => (
            <polyline
              key={line.name}
              points={path(
                drawn(line.stays).map((point) => ({
                  x: x(point.seconds),
                  y: y(point.share),
                })),
              )}
              fill="none"
              strokeWidth={line.width}
              strokeDasharray={line.dash}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={line.stroke}
            />
          ))}
        </Stretch>

        {LINES.map((line) => (
          <circle
            key={line.name}
            cx={across(x((line.stays.medianDays ?? 0) * survival.DAY))}
            cy={y(0.5)}
            r={3.5}
            strokeWidth={1.5}
            className={`stroke-paper-raised ${line.fill}`}
          >
            <title>
              {`${line.what}: half are gone after ${days(line.stays.medianDays)}`}
            </title>
          </circle>
        ))}

        {ends.map(({ line, at }) => (
          <text
            key={line.name}
            x="100%"
            dx={8}
            y={at}
            dominantBaseline="central"
            className={`text-[11px] font-medium max-sm:hidden ${line.fill}`}
          >
            {line.name}
          </text>
        ))}

        <line
          x1="0"
          x2="100%"
          y1={BOTTOM}
          y2={BOTTOM}
          className="stroke-ink-faint"
        />
        {AGES.map((age, index) => (
          <g key={age.name}>
            <line
              x1={across(x(age.seconds))}
              x2={across(x(age.seconds))}
              y1={BOTTOM}
              y2={BOTTOM + 4}
              className="stroke-ink-faint"
            />
            <text
              x={across(x(age.seconds))}
              y={BOTTOM + 17}
              textAnchor={
                index === 0
                  ? "start"
                  : index === AGES.length - 1
                    ? "end"
                    : "middle"
              }
              className={`fill-ink-faint text-[10px] tabular-nums ${
                age.phone ? "" : "max-sm:hidden"
              }`}
            >
              {age.name}
            </text>
          </g>
        ))}
      </Plot>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4 lg:grid-cols-4">
        {LINES.map((line) => (
          <div key={line.name}>
            <dt className="text-xs leading-snug text-ink-faint">
              <svg
                width="18"
                height="8"
                aria-hidden
                className="mr-1.5 inline-block align-[1px]"
              >
                <line
                  x2="18"
                  y1="4"
                  y2="4"
                  strokeWidth={line.width}
                  strokeDasharray={line.dash}
                  className={line.stroke}
                />
              </svg>
              {line.what}
            </dt>
            <dd className="mt-0.5 font-serif text-2xl tabular-nums">
              {days(line.stays.medianDays)}
            </dd>
            <dd className="text-xs text-ink-faint tabular-nums">
              until half are gone · {number(line.stays.endings)} endings in{" "}
              {number(line.stays.n)} stays
            </dd>
          </div>
        ))}
      </dl>
    </Figure>
  );
}

const SHOWN = 5;

/** The wordings that have stood longest without a character changing. */
export function Oldest() {
  const shown = survival.oldest.slice(0, SHOWN);

  return (
    <Figure
      title={`The oldest wordings still standing · the first ${SHOWN} of the ${survival.oldest.length} the lab lists`}
      read={
        <>
          Each is a paragraph whose wikitext has not changed by a character
          since the date, with the days it has stood up to 1 October 2026. It
          says nothing about whether the paragraph is right, or sourced.
        </>
      }
    >
      <ol className="divide-y divide-rule">
        {shown.map((wording) => (
          <li
            key={`${wording.revId} ${wording.text}`}
            className="grid gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
          >
            <div className="max-sm:flex max-sm:items-baseline max-sm:gap-3">
              <p className="text-sm text-rubric tabular-nums">
                {day(wording.since)}
              </p>
              <p className="text-xs text-ink-faint tabular-nums">
                {number(Math.floor(wording.days))} days
              </p>
            </div>
            <div className="min-w-0">
              <p className="line-clamp-3 font-serif text-[15px] leading-relaxed text-ink-soft">
                {wording.text}
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                <Link
                  href={readHref(wording.title)}
                  className="underline decoration-rule hover:text-ink"
                >
                  {wording.title}
                </Link>
                , since revision{" "}
                <span className="font-mono">{wording.revId}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Figure>
  );
}
