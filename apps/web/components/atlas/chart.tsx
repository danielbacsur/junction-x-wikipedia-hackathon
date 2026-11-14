import { day, number } from "@/lib/format";

import { latestSnapshot, when } from "./data";
import { across, percent } from "./format";

/**
 * A chart in its panel: what it shows above, how to read it below. The
 * charts are drawn in pixels down and percentages across, so the type keeps
 * its size on a phone and nothing has to be measured.
 */
export function Figure({
  title,
  read,
  children,
}: {
  title: string;
  read: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <figure className="rounded border border-rule bg-paper-raised">
      <figcaption className="px-4 pt-3 text-xs tracking-wide text-ink-faint uppercase">
        {title}
      </figcaption>
      <div className="px-4 pt-3 pb-4">{children}</div>
      <p className="border-t border-rule px-4 py-2.5 text-xs leading-relaxed text-ink-faint">
        <span className="font-medium text-ink-soft">How to read this.</span>{" "}
        {read}
      </p>
    </figure>
  );
}

/** The plot itself. Its padding is the room for labels left and right of it. */
export function Plot({
  height,
  label,
  className = "",
  children,
}: {
  height: number;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <svg
        width="100%"
        height={height}
        role="img"
        aria-label={label}
        className="block overflow-visible"
      >
        {children}
      </svg>
    </div>
  );
}

/** Lines stretch with the plot: inside, x runs 0 to 100 and y is pixels. */
export function Stretch({
  height,
  children,
}: {
  height: number;
  children: React.ReactNode;
}) {
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {children}
    </svg>
  );
}

/** The points of a line inside a `Stretch`. */
export const path = (points: { x: number; y: number }[]) =>
  points
    .map((point) => `${(point.x * 100).toFixed(3)},${point.y.toFixed(2)}`)
    .join(" ");

/** Horizontal rules with their values hanging left of the plot. */
export function Rules({
  ticks,
  y,
  format,
}: {
  ticks: number[];
  y: (value: number) => number;
  format: (value: number) => string;
}) {
  return (
    <g>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1="0"
            x2="100%"
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-rule"
          />
          <text
            x="0"
            dx={-8}
            y={y(tick)}
            textAnchor="end"
            dominantBaseline="central"
            className="fill-ink-faint text-[10px] tabular-nums"
          >
            {format(tick)}
          </text>
        </g>
      ))}
    </g>
  );
}

/* The line of 23 readings, the end of 2004 to 1 October 2026. */
const FROM = 2004.7;
const TO = when(latestSnapshot);

/** Where a reading sits across the plot, 0 to 1. */
export const along = (date: string) => (when(date) - FROM) / (TO - FROM);

const MARKED = [2004, 2008, 2012, 2016, 2020, 2024];

/** The axis under a chart of readings. Time is red: the last one is named. */
export function Readings({ y }: { y: number }) {
  return (
    <g>
      <line x1="0" x2="100%" y1={y} y2={y} className="stroke-ink-faint" />
      {MARKED.map((year) => {
        const x = across(along(`${year}-12-31`));

        return (
          <g key={year}>
            <line
              x1={x}
              x2={x}
              y1={y}
              y2={y + 4}
              className="stroke-ink-faint"
            />
            <text
              x={x}
              y={y + 17}
              textAnchor="middle"
              className={`fill-ink-faint text-[10px] tabular-nums ${
                // On a phone the last reading's date needs this room.
                year === 2024 ? "max-sm:hidden" : ""
              }`}
            >
              {year}
            </text>
          </g>
        );
      })}
      <text
        x="100%"
        y={y + 17}
        textAnchor="end"
        className="fill-rubric text-[10px] font-medium tabular-nums"
      >
        {/* On a phone the year alone leaves room for the marks before it. */}
        <tspan className="max-sm:hidden">
          {day(latestSnapshot).slice(0, -4)}
        </tspan>
        {latestSnapshot.slice(0, 4)}
      </text>
    </g>
  );
}

/**
 * Labels at the end of their lines must not sit on each other. Each keeps
 * its height if it can and is pushed up by the one below if it cannot.
 */
export const spread = <Label extends { y: number }>(
  labels: Label[],
  gap: number,
  floor: number,
) => {
  let below = floor + gap;

  return [...labels]
    .sort((a, b) => b.y - a.y)
    .map((label) => {
      below = Math.min(label.y, below - gap);

      return { ...label, at: below };
    });
};

/** A bar that fills its box to a share of it. */
export function Meter({
  share,
  className = "fill-ink-soft",
}: {
  share: number;
  className?: string;
}) {
  return (
    <svg width="100%" height="10" aria-hidden className="block">
      <rect width="100%" height="10" className="fill-paper-sunk" />
      <rect width={across(share)} height="10" className={className} />
    </svg>
  );
}

/** The parts of a whole as one bar, each named under it with its count. */
export function Shares({
  parts,
  label,
  shares = true,
}: {
  parts: { name: string; count: number; className: string }[];
  label: string;

  /** Whether a percentage of the whole means anything next to the count. */
  shares?: boolean;
}) {
  const total = parts.reduce((sum, part) => sum + part.count, 0);
  const before = (index: number) =>
    parts.slice(0, index).reduce((sum, part) => sum + part.count, 0);

  return (
    <div>
      <svg
        width="100%"
        height="14"
        role="img"
        aria-label={label}
        className="block"
      >
        {parts.map((part, index) => (
          <rect
            key={part.name}
            x={across(before(index) / total)}
            width={across(part.count / total)}
            height="14"
            className={`stroke-paper-raised ${part.className}`}
          />
        ))}
      </svg>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {parts.map((part) => (
          <div key={part.name}>
            <dt className="text-xs leading-snug text-ink-faint">
              <svg
                width="10"
                height="10"
                aria-hidden
                className="mr-1.5 inline-block align-[-1px]"
              >
                <rect width="10" height="10" className={part.className} />
              </svg>
              {part.name}
            </dt>
            <dd className="mt-0.5 font-serif text-xl tabular-nums">
              {number(part.count)}
              {shares && (
                <span className="ml-2 font-sans text-xs text-ink-faint">
                  {percent(part.count / total, 2)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
