"use client";

import Link from "next/link";
import { useState } from "react";

import { day, readHref, span } from "@/lib/format";

import type { Placed } from "./arrange";

const LABEL = "rounded-sm px-1.5 text-[10px] tracking-wide uppercase";

const CHIP = `${LABEL} py-px`;

/** Our reading wears a dotted outline, so it is never taken for evidence. */
const READING = `${LABEL} border border-dotted border-ink-faint text-ink-faint`;

const times = (count: number) =>
  count === 1 ? "once" : count === 2 ? "twice" : `${count} times`;

/** A passage longer than this is folded until someone asks for all of it. */
const LONG = 520;

/**
 * One exact wording in one article: what it said, when it stood and who
 * wrote it. Pointing at the card lights its line in the chart above.
 */
export function WordingCard({
  placed,
  lit,
  onLight,
}: {
  placed: Placed;
  lit: boolean;
  onLight: (key: string | null) => void;
}) {
  const [whole, setWhole] = useState(false);

  const { trace, before } = placed;
  const { writtenBy } = trace;
  const here = readHref(trace.title, trace.firstSeen);
  const long = trace.text.length > LONG;
  const anonymous = writtenBy.editor === "ip" || writtenBy.editor === "temp";

  return (
    <li
      id={`w-${placed.key}`}
      onMouseEnter={() => onLight(placed.key)}
      onMouseLeave={() => onLight(null)}
      onFocus={() => onLight(placed.key)}
      onBlur={() => onLight(null)}
      className={`rise scroll-mt-6 rounded border bg-paper-raised p-4 transition-colors target:border-rubric ${
        lit ? "border-rubric" : "border-rule"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-baseline gap-2 text-sm">
        <span className="flex h-5 min-w-5 items-center justify-center rounded-sm bg-rubric-wash px-1 text-[11px] font-medium text-rubric tabular-nums">
          {placed.n}
        </span>
        <Link
          href={`${here}#p-${trace.hash}`}
          className="font-medium hover:underline"
        >
          {trace.title}
        </Link>

        {trace.alive ? (
          <span className={`${CHIP} bg-added-wash text-added`}>
            still stands
          </span>
        ) : (
          <span className={`${CHIP} bg-removed-wash text-removed`}>
            removed {day(trace.lastSeen)}
          </span>
        )}
        <span className={`${CHIP} bg-paper-sunk text-ink-faint`}>
          stood {span(trace.days)}
          {trace.alive && " so far"}
        </span>
        {trace.stays > 1 && (
          <span
            title={`It stood ${trace.stays} separate times.`}
            className={`${CHIP} bg-paper-sunk text-ink-faint`}
          >
            came back {times(trace.stays - 1)}
          </span>
        )}
        {trace.distance !== null && (
          <span
            title="Cosine distance between your claim and this wording. 0 is the same meaning. It is our reading, not evidence."
            className={READING}
          >
            distance {trace.distance.toFixed(2)}
          </span>
        )}
        {before && (
          <a
            href={`#w-${before.key}`}
            title="We read the two as one paragraph, rewritten. It is our reading, not evidence."
            className={`${READING} hover:border-ink-soft hover:text-ink-soft`}
          >
            rewording of {before.n}
          </a>
        )}
      </div>

      <p
        className={`font-serif text-[15px] leading-relaxed text-ink ${
          long && !whole ? "line-clamp-5" : ""
        }`}
      >
        {trace.text}
      </p>

      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-faint">
        <span title={writtenBy.comment ?? undefined}>
          written {day(writtenBy.at)}{" "}
          {writtenBy.user ? `by ${writtenBy.user}` : "by a hidden user"}
          {anonymous && (
            <span
              title={
                writtenBy.editor === "ip"
                  ? "Not logged in: Wikipedia shows the address instead of a name."
                  : "Not logged in: Wikipedia gave a temporary account."
              }
              className={`${CHIP} ml-1.5 bg-paper-sunk`}
            >
              anonymous
            </span>
          )}
          {writtenBy.undone && ", in an edit that was later undone"}
        </span>
        {long && (
          <button
            type="button"
            onClick={() => setWhole(!whole)}
            aria-expanded={whole}
            className="underline decoration-rule hover:text-ink"
          >
            {whole ? "fold the wording" : "the whole wording"}
          </button>
        )}
        <Link
          href={`${here}&claim=${trace.hash}`}
          className="underline decoration-rule hover:text-ink"
        >
          life of this paragraph
        </Link>
        <a
          href={`https://fi.wikipedia.org/?oldid=${writtenBy.revId}`}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-rule hover:text-ink"
        >
          Wikipedia&apos;s own version ↗
        </a>
      </p>
    </li>
  );
}
