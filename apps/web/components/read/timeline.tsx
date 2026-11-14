"use client";

import type { Timeline as Life } from "@wtt/package-engine";

import { FIRST_YEAR, LAST_YEAR } from "@/lib/format";

const WIDTH = 1000;
const HEIGHT = 96;
const BASE = 74;
const MONTHS = (LAST_YEAR - FIRST_YEAR + 1) * 12;

const monthIndex = (month: string) =>
  (Number(month.slice(0, 4)) - FIRST_YEAR) * 12 + Number(month.slice(5, 7)) - 1;

/**
 * An article's whole life on one line: a bar for every month it was
 * edited, a mark where editors undid each other, and a red line at the
 * moment on screen. Every month is a door to the article as it stood at
 * the end of that month.
 */
export function Timeline({
  life,
  at,
  onPick,
}: {
  life: Life;

  /** The moment on screen, "YYYY-MM-DD…", or null for the latest. */
  at: string | null;
  onPick: (date: string) => void;
}) {
  const step = WIDTH / MONTHS;
  const most = Math.max(...life.months.map((month) => month.edits), 1);

  // A square root keeps the quiet months visible next to the busiest one.
  const tall = (edits: number) =>
    Math.max(2, Math.sqrt(edits / most) * (BASE - 8));

  const cursor = at
    ? (monthIndex(at.slice(0, 7)) + Number(at.slice(8, 10)) / 31) * step
    : WIDTH - 1;

  const years = [];
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) years.push(year);

  const pick = (index: number) => {
    const year = FIRST_YEAR + Math.floor(index / 12);
    const month = (index % 12) + 1;
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();

    onPick(`${year}-${String(month).padStart(2, "0")}-${last}`);
  };

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full cursor-pointer select-none"
        role="img"
        aria-label={`Edits per month of ${life.title}, ${FIRST_YEAR} to ${LAST_YEAR}`}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - box.left) / box.width) * WIDTH;

          pick(Math.min(MONTHS - 1, Math.max(0, Math.floor(x / step))));
        }}
      >
        <line x1={0} x2={WIDTH} y1={BASE} y2={BASE} stroke="var(--rule)" />

        {years.map((year) => (
          <g key={year}>
            <line
              x1={(year - FIRST_YEAR) * 12 * step}
              x2={(year - FIRST_YEAR) * 12 * step}
              y1={BASE}
              y2={BASE + 4}
              stroke="var(--rule)"
            />
            {(year % 5 === 0 || year === FIRST_YEAR) && (
              <text
                x={(year - FIRST_YEAR) * 12 * step + 3}
                y={HEIGHT - 4}
                fontSize={11}
                fill="var(--ink-faint)"
              >
                {year}
              </text>
            )}
          </g>
        ))}

        {life.months.map((month) => {
          const x = monthIndex(month.month) * step;
          const height = tall(month.edits);

          return (
            <g key={month.month}>
              <title>
                {`${month.month}: ${month.edits} edits, ${month.reverts} reverts` +
                  (month.disputes > 0
                    ? `, ${month.disputes} between named editors`
                    : "")}
              </title>
              <rect
                x={x + 0.4}
                y={BASE - height}
                width={Math.max(1, step - 0.8)}
                height={height}
                fill="var(--ink-soft)"
                opacity={0.75}
              />
              {month.disputes > 0 && (
                <circle
                  cx={x + step / 2}
                  cy={BASE - height - 5}
                  r={Math.min(4, 1.6 + month.disputes * 0.5)}
                  fill="var(--rubric)"
                />
              )}
            </g>
          );
        })}

        <line
          x1={cursor}
          x2={cursor}
          y1={0}
          y2={BASE + 6}
          stroke="var(--rubric)"
          strokeWidth={2}
        />
      </svg>

      <figcaption className="mt-1 flex flex-wrap gap-x-4 text-xs text-ink-faint">
        <span>
          Edits per month. Click a month to read the article as it stood then.
        </span>
        <span>
          <span className="mr-1 inline-block size-2 rounded-full bg-rubric align-middle" />
          a named editor undid another named editor
        </span>
      </figcaption>
    </figure>
  );
}
