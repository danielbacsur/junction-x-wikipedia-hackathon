"use client";

import { FIRST_YEAR, LAST_YEAR } from "@/lib/format";

/**
 * The control the whole product turns on: a year on a line from the first
 * edit to the last. The far right end means the latest version held, and
 * every other stop means the last day of that year.
 */
export function TimeDial({
  year,
  onChange,
  onCommit,
  label = "As of",
}: {
  /** null is the latest version. */
  year: number | null;
  onChange: (year: number | null) => void;
  onCommit?: (year: number | null) => void;
  label?: string;
}) {
  const latest = LAST_YEAR;
  const value = year ?? latest;
  const read = (raw: string) => (Number(raw) >= latest ? null : Number(raw));

  const ticks = [];
  for (let tick = FIRST_YEAR; tick <= latest; tick++) ticks.push(tick);

  return (
    <div className="select-none">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs tracking-wide text-ink-faint uppercase">
          {label}
        </span>
        <span className="font-serif text-2xl text-rubric tabular-nums">
          {year === null ? "1 Oct 2026" : `31 Dec ${year}`}
          <span className="ml-2 font-sans text-xs text-ink-faint">
            {year === null ? "latest in the dataset" : "end of the year"}
          </span>
        </span>
      </div>

      <input
        type="range"
        className="dial"
        min={FIRST_YEAR}
        max={latest}
        step={1}
        value={value}
        aria-label={`${label} year`}
        aria-valuetext={year === null ? "latest" : String(year)}
        onChange={(event) => onChange(read(event.target.value))}
        onPointerUp={(event) => onCommit?.(read(event.currentTarget.value))}
        onKeyUp={(event) => onCommit?.(read(event.currentTarget.value))}
      />

      <div className="flex justify-between px-[7px] text-[10px] text-ink-faint tabular-nums">
        {ticks.map((tick) => (
          <span
            key={tick}
            className={`w-0 text-center ${tick === value ? "font-medium text-rubric" : ""}`}
          >
            <span className="inline-block -translate-x-1/2">
              {tick % 5 === 0 || tick === FIRST_YEAR || tick === latest
                ? tick === latest
                  ? "now"
                  : tick
                : "·"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
