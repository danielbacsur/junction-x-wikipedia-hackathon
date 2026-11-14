import { day, number } from "@/lib/format";

import { Figure, Meter, Plot, Rules, Stretch, path } from "./chart";
import { clusters, exposure } from "./data";
import { across, percent } from "./format";

const { years, knownHash } = exposure;

const BAND = 1 / years.length;
const middle = (index: number) => (index + 0.5) * BAND;

const TOP = 26;
const TALL = 170;
const GAP = 44;
const LOW = 84;
const FOOT = 24;

/* Medians run from under five minutes to over an hour, so the scale is a log. */
const LEAST = 4;
const MOST = 80;

const yMinutes = (minutes: number) =>
  TOP + (1 - Math.log(minutes / LEAST) / Math.log(MOST / LEAST)) * TALL;

const LOW_TOP = TOP + TALL + GAP;
const yShare = (share: number) => LOW_TOP + (1 - share) * LOW;

const BOTTOM = LOW_TOP + LOW;

const by = <Row,>(rows: Row[], value: (row: Row) => number, sign: 1 | -1) =>
  rows.reduce((best, row) =>
    sign * value(row) > sign * value(best) ? row : best,
  );

const THRESHOLDS = [
  { label: "within a minute", share: knownHash.withinMinute },
  { label: "within an hour", share: knownHash.withinHour },
  { label: "within a day", share: knownHash.withinDay },
  { label: "within a week", share: knownHash.withinWeek },
];

/**
 * How long a later-undone version stood before the restore, year by year,
 * and how many were undone within the hour.
 */
export function Exposure() {
  const overall = knownHash.medianSeconds / 60;
  const partial = years[years.length - 1];

  const marked = [
    by(years, (row) => row.medianMinutes, -1),
    by(years, (row) => row.medianMinutes, 1),
  ];
  const shares = [
    by(years, (row) => row.withinHour, -1),
    by(years, (row) => row.withinHour, 1),
  ];

  return (
    <Figure
      title={`Time from a later-undone edit to the edit that restored the text · ${number(knownHash.n)} versions, by the year of the edit`}
      read={
        <>
          Above, the median number of minutes in each year, on a log scale: one
          step up is twice as long. Below, the share of that year’s undone edits
          that were undone within an hour. The hollow marks are {partial.year},
          which ends on 1 October and cannot yet count undos that have not
          happened.
        </>
      }
    >
      <Plot
        height={BOTTOM + FOOT}
        label={`Median minutes until the restore and share undone within an hour, ${years[0].year} to ${partial.year}`}
        className="pl-9"
      >
        <text
          x="0"
          y={TOP - 14}
          className="fill-ink-faint text-[10px] tracking-wide uppercase"
        >
          Median minutes until the restore, log scale
        </text>
        <Rules
          ticks={[5, 10, 20, 40, 80]}
          y={yMinutes}
          format={(tick) => `${tick}`}
        />

        {/* Time is red: the median of all the years together. */}
        <line
          x1="0"
          x2="100%"
          y1={yMinutes(overall)}
          y2={yMinutes(overall)}
          strokeDasharray="4 3"
          className="stroke-rubric"
        />

        <Stretch height={BOTTOM + FOOT}>
          <polyline
            points={path(
              years.map((row, index) => ({
                x: middle(index),
                y: yMinutes(row.medianMinutes),
              })),
            )}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-ink"
          />
        </Stretch>

        {years.map((row, index) => (
          <circle
            key={row.year}
            cx={across(middle(index))}
            cy={yMinutes(row.medianMinutes)}
            r={3}
            strokeWidth={1.5}
            className={
              row === partial ? "fill-paper-raised stroke-ink" : "fill-ink"
            }
          >
            <title>
              {`${row.year}: median ${row.medianMinutes.toFixed(2)} minutes over ${number(row.n)} undone versions`}
            </title>
          </circle>
        ))}

        {marked.map((row) => (
          <text
            key={row.year}
            x={across(middle(years.indexOf(row)))}
            y={yMinutes(row.medianMinutes)}
            dy={row === marked[0] ? 16 : -9}
            textAnchor="middle"
            strokeWidth={4}
            paintOrder="stroke"
            className="fill-ink stroke-paper-raised text-[10px] tabular-nums"
          >
            {row.medianMinutes.toFixed(2)} min
          </text>
        ))}

        {/* Written last, so its halo keeps it clear of the line on a phone. */}
        <text
          x="100%"
          y={yMinutes(overall)}
          dy={-5}
          textAnchor="end"
          strokeWidth={4}
          paintOrder="stroke"
          className="fill-rubric stroke-paper-raised text-[10px] font-medium tabular-nums"
        >
          all years: {overall.toFixed(2)} min
        </text>

        <text
          x="0"
          y={LOW_TOP - 14}
          className="fill-ink-faint text-[10px] tracking-wide uppercase"
        >
          Share undone within an hour
        </text>
        <Rules ticks={[0.5, 1]} y={yShare} format={(tick) => percent(tick)} />

        {years.map((row, index) => (
          <rect
            key={row.year}
            x={across(index * BAND + BAND * 0.2)}
            y={yShare(row.withinHour)}
            width={across(BAND * 0.6)}
            height={BOTTOM - yShare(row.withinHour)}
            className={
              row === partial
                ? "fill-paper-sunk stroke-ink-faint"
                : "fill-ink-soft"
            }
          >
            <title>
              {`${row.year}: ${percent(row.withinHour, 2)} undone within an hour`}
            </title>
          </rect>
        ))}

        {shares.map((row) => (
          <text
            key={row.year}
            x={across(middle(years.indexOf(row)))}
            y={yShare(row.withinHour)}
            dy={-5}
            textAnchor="middle"
            strokeWidth={4}
            paintOrder="stroke"
            className="fill-ink stroke-paper-raised text-[10px] tabular-nums"
          >
            {percent(row.withinHour, 1)}
          </text>
        ))}

        <line
          x1="0"
          x2="100%"
          y1={BOTTOM}
          y2={BOTTOM}
          className="stroke-ink-faint"
        />
        {years.map(
          (row, index) =>
            (row.year % 4 === 0 || row === partial) && (
              <text
                key={row.year}
                x={across(middle(index))}
                y={BOTTOM + 16}
                textAnchor="middle"
                className={`text-[10px] tabular-nums ${
                  row === partial ? "fill-rubric font-medium" : "fill-ink-faint"
                } ${row.year === 2024 ? "max-sm:hidden" : ""}`}
              >
                {row.year}
              </text>
            ),
        )}
      </Plot>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4 sm:grid-cols-4">
        {THRESHOLDS.map((threshold) => (
          <div key={threshold.label}>
            <dt className="text-xs text-ink-faint">Undone {threshold.label}</dt>
            <dd className="mt-0.5 mb-1.5 font-serif text-2xl tabular-nums">
              {percent(threshold.share, 2)}
            </dd>
            <Meter share={threshold.share} />
          </div>
        ))}
      </dl>
    </Figure>
  );
}

const SHOWN = 10;

/** The article-months in which named editors undid each other most. */
export function Clusters() {
  const top = clusters.top.slice(0, SHOWN);

  return (
    <Figure
      title={`Reverts between named editors, by article and month · the ${SHOWN} busiest of ${number(clusters.articleMonths)} article-months`}
      read={
        <>
          A bar is the number of reverts in one article in one month in which a
          named editor undid a different named editor. It counts activity. It is
          not a judgment of anyone’s intent, and it does not say what the
          disagreement was about.
        </>
      }
    >
      <ol className="flex flex-col gap-2">
        {top.map((cluster) => (
          <li
            key={`${cluster.title} ${cluster.month}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,15rem)_5rem_minmax(0,1fr)_auto]"
          >
            <span className="truncate font-serif text-[15px]">
              {cluster.title}
            </span>
            <span className="text-xs text-rubric tabular-nums max-sm:text-right">
              {day(`${cluster.month}-01`).slice(2)}
            </span>
            <span className="max-sm:col-start-1">
              <Meter share={cluster.events / top[0].events} />
            </span>
            <span className="text-right text-xs text-ink-soft tabular-nums">
              {cluster.events}
            </span>
          </li>
        ))}
      </ol>
    </Figure>
  );
}
