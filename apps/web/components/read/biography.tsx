"use client";

import type { Biography as Life } from "@wtt/package-engine";

import { SqlDrawer } from "@/components/sql-drawer";
import { FIRST_YEAR, LAST_YEAR, LATEST, day, minute, span } from "@/lib/format";
import { useJson } from "@/lib/use-json";

import { Words } from "./words";

const START = Date.UTC(FIRST_YEAR, 0, 1);
const END = Date.UTC(LAST_YEAR + 1, 0, 1);

const place = (at: string) =>
  ((Date.parse(`${at.slice(0, 19).replace(" ", "T")}Z`) - START) /
    (END - START)) *
  100;

function Who({
  edit,
}: {
  edit: {
    revId: number;
    at: string;
    user: string | null;
    editor: string;
    comment: string | null;
    undone: boolean;
  };
}) {
  return (
    <>
      <a
        href={`https://fi.wikipedia.org/?oldid=${edit.revId}`}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-rule hover:text-rubric"
      >
        {edit.user ?? "a hidden user"}
      </a>
      {edit.editor === "ip" || edit.editor === "temp" ? " (anonymous)" : ""} on{" "}
      {minute(edit.at)}
      {edit.comment ? (
        <span className="text-ink-faint"> “{edit.comment.slice(0, 120)}”</span>
      ) : null}
      {edit.undone ? (
        <span className="text-removed"> · this edit was later reverted</span>
      ) : null}
    </>
  );
}

/**
 * The life of one paragraph. Its lifetimes are the history rows of one key
 * in the versioned passage table and are shown as fact. The chain of
 * wordings below them is our reading of which earlier text it replaced.
 */
export function Biography({
  title,
  hash,
  onClose,
  onSelect,
}: {
  title: string;
  hash: string;
  onClose: () => void;
  onSelect: (hash: string) => void;
}) {
  const { data: life, error } = useJson<Life>(
    `/api/article/${encodeURIComponent(title)}/claim/${hash}`,
  );

  return (
    <aside className="rise rounded border border-rubric bg-paper-raised p-5">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-xs tracking-wide text-rubric uppercase">
          Life of this paragraph
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-xs text-ink-faint hover:text-ink"
        >
          close
        </button>
      </div>

      {error && <p className="text-sm text-removed">{error}</p>}
      {!life && !error && (
        <p className="text-sm text-ink-faint">Reading its history…</p>
      )}

      {life && (
        <div className="flex flex-col gap-5">
          <p className="font-serif text-[16px] leading-relaxed">{life.text}</p>

          <p className="text-sm text-ink-soft">
            This exact wording stood in the article for{" "}
            <b className="font-medium text-ink">{span(life.daysAlive)}</b> in{" "}
            {life.lifetimes.length === 1
              ? "one stretch"
              : `${life.lifetimes.length} separate stretches`}
            {life.alive ? (
              <>
                {" "}
                and <b className="font-medium text-added">
                  still stands
                </b> on {day(LATEST)}.
              </>
            ) : (
              <>
                {" "}
                and is <b className="font-medium text-removed">gone</b> today.
              </>
            )}
          </p>

          <svg
            viewBox="0 0 100 9"
            preserveAspectRatio="none"
            className="h-7 w-full"
            role="img"
            aria-label="When this wording stood in the article"
          >
            <line
              x1={0}
              x2={100}
              y1={5}
              y2={5}
              stroke="var(--rule)"
              strokeWidth={0.3}
            />
            {life.lifetimes.map((stay, index) => (
              <rect
                key={index}
                x={place(stay.from)}
                y={2}
                width={Math.max(
                  0.35,
                  place(stay.to ?? LATEST) - place(stay.from),
                )}
                height={6}
                fill={stay.to ? "var(--ink-soft)" : "var(--added)"}
              />
            ))}
          </svg>
          <div className="-mt-4 flex justify-between text-[10px] text-ink-faint tabular-nums">
            <span>{FIRST_YEAR}</span>
            <span>2010</span>
            <span>2018</span>
            <span>{LAST_YEAR}</span>
          </div>

          <ol className="flex flex-col gap-2 text-sm">
            {life.lifetimes.map((stay, index) => (
              <li
                key={index}
                className="border-l-2 border-rule pl-3 text-ink-soft"
              >
                <p>
                  <span className="text-added">Written</span> by{" "}
                  <Who edit={stay.writtenBy} />
                </p>
                {stay.to ? (
                  <p>
                    <span className="text-removed">Removed</span> after{" "}
                    {span(stay.days)}
                    {stay.removedBy ? (
                      <>
                        {" "}
                        by <Who edit={stay.removedBy} />
                      </>
                    ) : null}
                  </p>
                ) : (
                  <p>Standing for {span(stay.days)} so far.</p>
                )}
              </li>
            ))}
          </ol>

          {life.wordings.length > 1 && (
            <div>
              <h3 className="mb-1 text-xs tracking-wide text-ink-faint uppercase">
                How this paragraph was worded over time
              </h3>
              <p className="mb-3 text-xs text-ink-faint">
                Our reading, not evidence: the loader pairs a wording with the
                one it replaced when they share enough words. Each step shows
                how much.
              </p>

              <ol className="flex flex-col gap-2">
                {life.wordings.map((wording, index) => (
                  <li
                    key={wording.hash}
                    className={`rounded border p-3 ${
                      wording.hash === life.hash
                        ? "border-rubric bg-rubric-wash"
                        : "border-rule"
                    }`}
                  >
                    <div className="mb-1 flex flex-wrap gap-x-3 text-[11px] text-ink-faint">
                      <span className="text-rubric tabular-nums">
                        {day(wording.firstSeen)}
                        {wording.lastSeen
                          ? ` – ${day(wording.lastSeen)}`
                          : " – today"}
                      </span>
                      <span>{wording.writtenBy.user ?? "hidden user"}</span>
                      {wording.similarity !== null && (
                        <span>
                          {Math.round(wording.similarity * 100)}% of words kept
                        </span>
                      )}
                      {wording.hash !== life.hash && (
                        <button
                          type="button"
                          onClick={() => onSelect(wording.hash)}
                          className="underline decoration-rule hover:text-rubric"
                        >
                          its life
                        </button>
                      )}
                    </div>
                    <p className="font-serif text-[14px] leading-relaxed">
                      {index === 0 ? (
                        wording.text
                      ) : (
                        <Words words={wording.words} />
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <SqlDrawer sql={life.sql} title="SQL behind this life" />
        </div>
      )}
    </aside>
  );
}
