import { number } from "@/lib/format";

import { Figure, Meter, Plot } from "./chart";
import { temporary } from "./data";
import { across, percent } from "./format";

/** The bars run from zero to this share, so their lengths compare honestly. */
const MOST = 0.4;

const WINDOWS = [
  {
    // The lab calls this window six months, but its CASE gives March 2025
    // to "before": the monthly file adds up to this row over five months.
    when: "October 2024 to February 2025",
    what: "five months, the winter a year earlier",
    window: temporary.yearEarlier,
    className: "fill-ink-faint",
  },
  {
    when: "March to August 2025",
    what: "before the first temporary account",
    window: temporary.before,
    className: "fill-ink-soft",
  },
  {
    when: "October 2025 to March 2026",
    what: "after",
    window: temporary.after,
    className: "fill-ink",
  },
];

/* The line the difference and its interval are drawn on, in points. */
const FROM = -2;
const TO = 14;
const at = (points: number) => (points - FROM) / (TO - FROM);

/** Anonymous edits undone within a week, before and after the switch. */
export function Temporary() {
  const { shareDifference: difference } = temporary;

  return (
    <Figure
      title="Anonymous edits undone by someone else within seven days · two six-month windows and the winter before"
      read={
        <>
          Each bar is the undone share of the anonymous edits (IP or temporary
          account) made in one window, on a scale from 0 to {percent(MOST)}.
          Below, the difference between the last two bars with the interval it
          could plausibly lie in: if the line reached 0, the data would be
          compatible with no change.
        </>
      }
    >
      <ol className="flex flex-col gap-4">
        {WINDOWS.map(({ when, what, window, className }) => (
          <li
            key={when}
            className="grid items-center gap-x-5 gap-y-1.5 sm:grid-cols-[17rem_minmax(0,1fr)_11rem]"
          >
            <div>
              <p className="text-sm text-rubric">{when}</p>
              <p className="text-xs text-ink-faint">{what}</p>
            </div>
            <Meter share={window.share / MOST} className={className} />
            <p className="tabular-nums">
              <span className="font-serif text-2xl">
                {percent(window.share, 2)}
              </span>
              <span className="ml-2 text-xs text-ink-faint">
                {number(window.undone)} of {number(window.edits)}
              </span>
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6 border-t border-rule pt-4">
        <p className="text-xs tracking-wide text-ink-faint uppercase">
          After minus before, in percentage points
        </p>
        <Plot
          height={62}
          label={`Difference ${difference.estimate.toFixed(2)} points, 95 % interval ${difference.lower.toFixed(2)} to ${difference.upper.toFixed(2)}`}
          className="mt-1 max-w-xl px-3"
        >
          <line x1="0" x2="100%" y1={40} y2={40} className="stroke-rule" />
          {[0, 5, 10].map((tick) => (
            <g key={tick}>
              <line
                x1={across(at(tick))}
                x2={across(at(tick))}
                y1={tick === 0 ? 14 : 36}
                y2={44}
                className={tick === 0 ? "stroke-ink-faint" : "stroke-rule"}
              />
              <text
                x={across(at(tick))}
                y={58}
                textAnchor="middle"
                className="fill-ink-faint text-[10px] tabular-nums"
              >
                {tick === 0 ? "0, no change" : `+${tick}`}
              </text>
            </g>
          ))}

          <line
            x1={across(at(difference.lower))}
            x2={across(at(difference.upper))}
            y1={28}
            y2={28}
            strokeWidth={3}
            className="stroke-ink-soft"
          />
          <circle
            cx={across(at(difference.estimate))}
            cy={28}
            r={5}
            strokeWidth={2}
            className="fill-ink stroke-paper-raised"
          />
          <text
            x={across(at(difference.estimate))}
            y={14}
            textAnchor="middle"
            className="fill-ink text-[11px] font-medium tabular-nums"
          >
            +{difference.estimate.toFixed(2)}
          </text>
          <text
            x={across(at(difference.lower))}
            y={22}
            dx={-5}
            textAnchor="end"
            dominantBaseline="central"
            className="fill-ink-faint text-[10px] tabular-nums"
          >
            {difference.lower.toFixed(2)}
          </text>
          <text
            x={across(at(difference.upper))}
            y={22}
            dx={5}
            dominantBaseline="central"
            className="fill-ink-faint text-[10px] tabular-nums"
          >
            {difference.upper.toFixed(2)}
          </text>
        </Plot>
        <p className="mt-1 text-xs text-ink-faint">
          95 % interval from resampling {number(difference.articles)} articles{" "}
          {number(difference.replicates)} times. An association, not a causal
          effect of the switch.
        </p>
      </div>
    </Figure>
  );
}
