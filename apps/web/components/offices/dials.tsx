"use client";

import { day as written } from "@/lib/format";

import { dayAt, dayNumber } from "./time";

/**
 * A dial that moves by days. Dragging it is coarse, a century is a few
 * hundred pixels wide, so the exact day can also be typed or stepped to.
 * The Wikipedia dial is red like every other time dial in the product; the
 * day of history is in ink, because it is what the article says.
 */
export function DayDial({
  label,
  hint,
  value,
  first,
  last,
  marks,
  ink = false,
  onChange,
  onCommit,
}: {
  label: string;

  /** What the value means, next to the date. */
  hint: string;
  value: string;
  first: string;
  last: string;

  /** The years named under the line. */
  marks: number[];
  ink?: boolean;
  onChange: (day: string) => void;
  onCommit: (day: string) => void;
}) {
  const from = dayNumber(first);
  const to = dayNumber(last);
  const at = dayNumber(value);
  const read = (raw: string) => dayAt(Number(raw));

  const step = (days: number) =>
    onCommit(dayAt(Math.min(to, Math.max(from, at + days))));

  const button =
    "rounded border border-rule px-2 py-1 text-xs text-ink-soft tabular-nums transition-colors hover:bg-paper-sunk disabled:opacity-40";

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-xs tracking-wide text-ink-faint uppercase">
          {label}
        </span>
        <span
          className={`font-serif text-2xl whitespace-nowrap tabular-nums ${ink ? "text-ink" : "text-rubric"}`}
        >
          {written(value)}
        </span>
      </div>

      <input
        type="range"
        className={`dial select-none ${
          // The dial's own red is set outside Tailwind's layers.
          ink
            ? "[&::-moz-range-thumb]:bg-ink! [&::-webkit-slider-thumb]:bg-ink!"
            : ""
        }`}
        min={from}
        max={to}
        step={1}
        value={at}
        aria-label={label}
        aria-valuetext={written(value)}
        onChange={(event) => onChange(read(event.target.value))}
        onPointerUp={(event) => onCommit(read(event.currentTarget.value))}
        onKeyUp={(event) => onCommit(read(event.currentTarget.value))}
      />

      <div
        aria-hidden
        className="relative mx-[7px] h-4 text-[10px] text-ink-faint tabular-nums select-none"
      >
        {marks.map((year) => (
          <span
            key={year}
            className="absolute -translate-x-1/2"
            style={{
              left: `${((dayNumber(`${year}-01-01`) - from) / (to - from)) * 100}%`,
            }}
          >
            {year}
          </span>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={button}
          disabled={at <= from}
          onClick={() => step(-1)}
        >
          − 1 day
        </button>
        <input
          type="date"
          value={value}
          min={first}
          max={last}
          aria-label={`${label}, exact day`}
          className="rounded border border-rule bg-paper px-2 py-[3px] text-xs text-ink tabular-nums"
          onChange={(event) => {
            const typed = event.target.value;

            if (typed >= first && typed <= last) onCommit(typed);
          }}
        />
        <button
          type="button"
          className={button}
          disabled={at >= to}
          onClick={() => step(1)}
        >
          + 1 day
        </button>
        <span className="text-xs text-ink-faint">{hint}</span>
      </div>
    </div>
  );
}
