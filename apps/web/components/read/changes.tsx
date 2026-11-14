"use client";

import type { Comparison } from "@wtt/package-engine";

import { SqlDrawer } from "@/components/sql-drawer";
import { day, number } from "@/lib/format";

import { Words } from "./words";

const LABEL = {
  added: { text: "added", style: "bg-added-wash text-added" },
  removed: { text: "removed", style: "bg-removed-wash text-removed" },
  reworded: { text: "reworded", style: "bg-rubric-wash text-rubric" },
};

/**
 * What changed in the article between two dates. That a wording was there
 * on one date and not on the other is evidence. Calling two wordings the
 * same paragraph rewritten is our reading, so each pair shows how alike
 * the two are.
 */
export function Changes({
  comparison,
  onSelect,
}: {
  comparison: Comparison;
  onSelect: (hash: string) => void;
}) {
  const counts = { added: 0, removed: 0, reworded: 0 };
  for (const change of comparison.changes) counts[change.change]++;

  return (
    <section className="flex flex-col gap-4">
      <p className="rounded border border-rule bg-paper-sunk px-4 py-3 text-sm text-ink-soft">
        Between{" "}
        <b className="font-medium text-rubric">{day(comparison.from)}</b> and{" "}
        <b className="font-medium text-rubric">{day(comparison.to)}</b> the
        article was saved{" "}
        <b className="font-medium text-ink">{number(comparison.edits)}</b> times
        by {number(comparison.editors)} editors, {number(comparison.reverts)} of
        them reverts. <b className="font-medium text-ink">{comparison.kept}</b>{" "}
        blocks stand unchanged,{" "}
        <b className="font-medium text-added">{counts.added}</b> paragraphs were
        added, <b className="font-medium text-removed">{counts.removed}</b>{" "}
        removed and <b className="font-medium text-rubric">{counts.reworded}</b>{" "}
        reworded.
        {comparison.other.added + comparison.other.removed > 0 &&
          ` ${comparison.other.added + comparison.other.removed} markup blocks (templates, tables, images) also changed.`}
      </p>

      {!comparison.exists.from && (
        <p className="text-sm text-ink-faint">
          The article did not exist yet on {day(comparison.from)}, so everything
          counts as added.
        </p>
      )}

      <ol className="flex flex-col gap-2">
        {comparison.changes.map((change, index) => {
          const label = LABEL[change.change];
          const hash = (change.after ?? change.before)!.hash;

          return (
            <li
              key={`${hash}-${index}`}
              className="rounded border border-rule bg-paper-raised p-3"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={`rounded-sm px-1.5 py-px text-[10px] tracking-wide uppercase ${label.style}`}
                >
                  {label.text}
                </span>
                {change.similarity !== null && (
                  <span className="text-[11px] text-ink-faint">
                    our reading: the same paragraph,{" "}
                    {Math.round(change.similarity * 100)}% of its words shared
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(hash)}
                  className="ml-auto text-[11px] text-ink-faint underline decoration-rule hover:text-rubric"
                >
                  life of this paragraph
                </button>
              </div>

              <p
                className={`font-serif text-[15px] leading-relaxed ${
                  change.change === "removed"
                    ? "text-ink-soft line-through decoration-removed/40"
                    : ""
                }`}
              >
                {change.change === "reworded" ? (
                  <Words words={change.words} />
                ) : (
                  (change.after ?? change.before)!.text
                )}
              </p>
            </li>
          );
        })}
      </ol>

      <SqlDrawer sql={comparison.sql} title="SQL behind this comparison" />
    </section>
  );
}
