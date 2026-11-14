import { number } from "@/lib/format";

import { Figure, Plot } from "./chart";
import { decades, largestDecadeShare, latestSnapshot, readings } from "./data";
import { across, percent } from "./format";

const TOP = 34;
const ROW = 14;
const FOOT = 24;

const CELL = 1 / decades.length;
const BOTTOM = TOP + readings.length * ROW;

/** The decade that holds 1918, and the readings at which 1918 leads. */
const RIDGE = decades.indexOf(1910);
const LEADS = readings.findIndex((reading) => reading.topYear === 1918);

const SCALE = [0.03, 0.06, 0.09, 0.12];

/**
 * Which decades of history the articles mention (across), at each date
 * Wikipedia is read (down). A row is one reading and adds up to 100 %.
 */
export function YearHeat() {
  const last = readings[readings.length - 1];

  return (
    <Figure
      title="Decade of history mentioned, by the date Wikipedia is read · share of that reading’s year mentions"
      read={
        <>
          Read across a row for what one reading of Wikipedia talks about, and
          down a column for how a decade’s share changed. The stronger the ink,
          the larger the share of the row, on one linear scale. The step at the
          right is the present arriving. Years before {decades[0]} are{" "}
          {percent(last.before / last.total, 2)} of the mentions at the last
          reading and are not drawn. The last row is 1 October 2026.
        </>
      }
    >
      <Plot
        height={BOTTOM + FOOT}
        label="Heat map of the share of year mentions per decade, 1800s to 2020s, at 23 dates"
        className="pr-11 pl-9 sm:pr-28"
      >
        <text
          x="100%"
          dx={8}
          y={TOP - 8}
          className="fill-ink-faint text-[10px] tracking-wide uppercase"
        >
          Top year
        </text>
        <text
          x={across((RIDGE + 0.5) * CELL)}
          y={TOP - 18}
          textAnchor="middle"
          className="fill-rubric text-[11px] font-medium"
        >
          1910s, the decade of 1918
        </text>
        <line
          x1={across((RIDGE + 0.5) * CELL)}
          x2={across((RIDGE + 0.5) * CELL)}
          y1={TOP - 13}
          y2={TOP + LEADS * ROW - 2}
          className="stroke-rubric"
        />

        {readings.map((reading, row) => (
          <g key={reading.date}>
            <text
              x="0"
              dx={-8}
              y={TOP + row * ROW + ROW / 2}
              textAnchor="end"
              dominantBaseline="central"
              className={`text-[10px] tabular-nums ${
                reading.date === latestSnapshot
                  ? "fill-rubric font-medium"
                  : "fill-ink-faint"
              }`}
            >
              {reading.date.slice(0, 4)}
            </text>

            {reading.cells.map((cell, column) => (
              <rect
                key={cell.decade}
                x={across(column * CELL)}
                y={TOP + row * ROW}
                width={across(CELL)}
                height={ROW}
                fillOpacity={cell.share / largestDecadeShare}
                className="fill-ink stroke-paper-raised"
              >
                <title>
                  {`${cell.decade}s as of ${reading.date}: ${percent(cell.share, 2)} (${number(cell.mentions)} of ${number(reading.total)})`}
                </title>
              </rect>
            ))}

            <text
              x="100%"
              dx={8}
              y={TOP + row * ROW + ROW / 2}
              dominantBaseline="central"
              className={`text-[10px] tabular-nums ${
                reading.topYear === 1918
                  ? "fill-rubric font-medium"
                  : "fill-ink-soft"
              }`}
            >
              {reading.topYear}
              <tspan className="fill-ink-faint font-normal max-sm:hidden">
                {" "}
                · {number(reading.topMentions)} mentions
              </tspan>
            </text>
          </g>
        ))}

        {/* The readings at which 1918 is the most mentioned year. */}
        <rect
          x={across(RIDGE * CELL)}
          y={TOP + LEADS * ROW}
          width={across(CELL)}
          height={(readings.length - LEADS) * ROW}
          fill="none"
          strokeWidth={1.5}
          className="stroke-rubric"
        />

        {decades.map(
          (decade, column) =>
            decade % 50 === 0 && (
              <g key={decade}>
                <line
                  x1={across(column * CELL)}
                  x2={across(column * CELL)}
                  y1={BOTTOM}
                  y2={BOTTOM + 4}
                  className="stroke-ink-faint"
                />
                <text
                  x={across(column * CELL)}
                  y={BOTTOM + 16}
                  className="fill-ink-faint text-[10px] tabular-nums"
                >
                  {decade}s
                </text>
              </g>
            ),
        )}
      </Plot>

      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint tabular-nums">
        <span>Share of the row:</span>
        {SCALE.map((share) => (
          <span key={share} className="whitespace-nowrap">
            <svg
              width="14"
              height="12"
              aria-hidden
              className="mr-1.5 inline-block align-[-1px]"
            >
              <rect
                width="14"
                height="12"
                fillOpacity={share / largestDecadeShare}
                className="fill-ink"
              />
            </svg>
            {percent(share)}
          </span>
        ))}
        <span className="whitespace-nowrap">
          <svg
            width="14"
            height="12"
            aria-hidden
            className="mr-1.5 inline-block align-[-1px]"
          >
            <rect
              x="1"
              y="1"
              width="12"
              height="10"
              fill="none"
              strokeWidth={1.5}
              className="stroke-rubric"
            />
          </svg>
          1918 is the most mentioned single year
        </span>
      </p>
    </Figure>
  );
}
