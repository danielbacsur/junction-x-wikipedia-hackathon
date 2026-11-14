"use client";

import type { TermChange } from "@wtt/package-engine";

import { day as written, minute, span } from "@/lib/format";

import { PRESIDENT, justBefore } from "./time";

const OFFICE: Record<string, string> = {
  "Suomen pääministeri": "prime minister",
  "Suomen tasavallan presidentti (vt.)": "acting president",
  "Suomen valtionhoitaja": "regent",
};

const VERDICT: Record<TermChange["verdict"], { label: string; tone: string }> =
  {
    "to today's value": {
      label: "to today’s value",
      tone: "bg-added-wash text-added",
    },
    "away from today's value": {
      label: "away from today’s value",
      tone: "bg-removed-wash text-removed",
    },
    between: {
      label: "both values since replaced",
      tone: "bg-paper-sunk text-ink-faint",
    },
  };

const end = (to: string | null) => (to ? written(to) : "in office");

/** The dates an edit replaced, each as what it was and what it became. */
const moved = (change: TermChange) => [
  ...(change.before.from !== change.after.from
    ? [
        {
          side: "starts",
          before: written(change.before.from),
          after: written(change.after.from),
        },
      ]
    : []),
  ...(change.before.to !== change.after.to
    ? [
        {
          side: "ends",
          before: end(change.before.to),
          after: end(change.after.to),
        },
      ]
    : []),
];

/**
 * Every time Wikipedia replaced a stated start or end of a term with
 * another, oldest first. Each row can set both dials to the moment just
 * before the edit or just after it.
 */
export function Changes({
  changes,
  onShow,
}: {
  changes: TermChange[];
  onShow: (day: string, at: string) => void;
}) {
  return (
    <ol className="divide-y divide-rule rounded border border-rule bg-paper-raised">
      {changes.map((change) => {
        const verdict = VERDICT[change.verdict];

        // A day the edit gave to somebody else, or took from everybody.
        const affected =
          change.before.from !== change.after.from
            ? [change.before.from, change.after.from].sort()[0]
            : [change.before.to, change.after.to]
                .filter((to) => to !== null)
                .sort()[0];

        return (
          <li
            key={`${change.revId}:${change.office}:${change.before.from}:${change.after.from}:${change.after.to}`}
            className="grid gap-x-5 gap-y-1 px-4 py-3 text-sm sm:grid-cols-[6.5rem_minmax(0,17rem)_minmax(0,1fr)]"
          >
            <div className="text-rubric tabular-nums">
              <span title={minute(change.at)}>{written(change.at)}</span>
            </div>

            <div>
              <p>
                <span className="font-serif text-[17px]">{change.person}</span>
                {change.office !== PRESIDENT && (
                  <span className="ml-2 rounded-sm bg-paper-sunk px-1.5 py-px text-[10px] tracking-wide text-ink-faint uppercase">
                    {OFFICE[change.office] ?? change.office}
                  </span>
                )}
              </p>
              {moved(change).map((date) => (
                <p key={date.side} className="text-ink-soft tabular-nums">
                  {date.side}{" "}
                  <del className="text-removed decoration-removed/50">
                    {date.before}
                  </del>{" "}
                  <span aria-hidden className="text-ink-faint">
                    →
                  </span>{" "}
                  <ins className="font-medium text-added no-underline">
                    {date.after}
                  </ins>
                </p>
              ))}
            </div>

            <div className="min-w-0 text-xs text-ink-faint">
              <p className="text-ink-soft">
                {change.editor ?? "hidden editor"}
                {change.editorKind === "ip" && " (not logged in)"}
                {" · "}
                <a
                  href={change.url}
                  className="font-mono underline decoration-rule hover:decoration-rubric"
                >
                  {change.revId}
                </a>
              </p>
              <p
                className={`font-serif text-[14px] ${change.comment ? "text-ink-soft" : "italic"}`}
              >
                {change.comment ? `“${change.comment}”` : "no edit summary"}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  className={`rounded-sm px-1.5 py-px text-[10px] tracking-wide uppercase ${verdict.tone}`}
                >
                  {verdict.label}
                </span>
                <span>
                  {change.stoodDays === null
                    ? "still stated"
                    : `stood ${span(change.stoodDays)}`}
                  {change.putBack && ", then put back"}
                </span>
                {affected && (
                  <span className="ml-auto whitespace-nowrap">
                    <button
                      type="button"
                      className="underline decoration-rule hover:decoration-rubric"
                      onClick={() => onShow(affected, justBefore(change.at))}
                    >
                      before
                    </button>
                    {" / "}
                    <button
                      type="button"
                      className="underline decoration-rule hover:decoration-rubric"
                      onClick={() => onShow(affected, change.at.slice(0, 19))}
                    >
                      after
                    </button>
                  </span>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
