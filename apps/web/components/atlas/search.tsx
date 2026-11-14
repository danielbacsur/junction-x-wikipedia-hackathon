import { Sql } from "@/components/sql";

import { Figure, Meter } from "./chart";
import { ann } from "./data";
import { across, percent } from "./format";
import { EXACT, JOINED, VERSIONED } from "./queries";

type Design = typeof ann.exact;

const ROWS: {
  letter: string;
  name: string;
  setting: string;
  design: Design;
}[] = [
  {
    letter: "A",
    name: "Versioned table with a vector index",
    setting: "ef_search 80",
    design: ann.versioned80,
  },
  {
    letter: "A",
    name: "Versioned table with a vector index",
    setting: "ef_search 1,000",
    design: ann.versioned1000,
  },
  {
    letter: "B",
    name: "Plain vector table, joined to lifetimes",
    setting: "50 candidates",
    design: ann.joined50,
  },
  {
    letter: "B",
    name: "Plain vector table, joined to lifetimes",
    setting: "200 candidates",
    design: ann.joined200,
  },
  {
    letter: "B",
    name: "Plain vector table, joined to lifetimes",
    setting: "1,000 candidates",
    design: ann.joined1000,
  },
  {
    letter: "C",
    name: "Lifetime filter first, then exact distance",
    setting: "no vector index",
    design: ann.exact,
  },
];

/** The time axis ends here, just past the slowest 95th percentile. */
const SLOWEST = 80;

/** What a search returned, as shares of the query and date pairs. */
function Outcome({ design }: { design: Design }) {
  const right = 1 - design.underfilled - design.fullButWrong;

  return (
    <svg width="100%" height="10" aria-hidden className="block">
      <rect
        width={across(design.underfilled)}
        height="10"
        className="fill-ink-faint"
      />
      <rect
        x={across(design.underfilled)}
        width={across(design.fullButWrong)}
        height="10"
        className="fill-removed"
      />
      <rect
        x={across(design.underfilled + design.fullButWrong)}
        width={across(right)}
        height="10"
        className="fill-added"
      />
    </svg>
  );
}

/** The median as a bar, with a line on to the 95th percentile. */
function Time({ design }: { design: Design }) {
  return (
    <svg width="100%" height="10" aria-hidden className="block">
      <rect width="100%" height="10" className="fill-paper-sunk" />
      <line
        x1={across(design.medianMs / SLOWEST)}
        x2={across(design.p95Ms / SLOWEST)}
        y1="5"
        y2="5"
        className="stroke-ink-soft"
      />
      <line
        x1={across(design.p95Ms / SLOWEST)}
        x2={across(design.p95Ms / SLOWEST)}
        y1="1"
        y2="9"
        className="stroke-ink-soft"
      />
      <rect
        width={across(design.medianMs / SLOWEST)}
        height="10"
        className="fill-ink-soft"
      />
    </svg>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs tracking-wide text-ink-faint uppercase">{children}</p>
  );
}

/** The label a bar carries on a phone, where the column heads are gone. */
function Small({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] text-ink-faint md:hidden">{children}</p>
  );
}

const COLUMNS =
  "md:grid md:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] md:gap-x-6";

function Key({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span className="whitespace-nowrap">
      <svg
        width="14"
        height="10"
        aria-hidden
        className="mr-1.5 inline-block align-[-1px]"
      >
        <rect width="14" height="10" className={className} />
      </svg>
      {children}
    </span>
  );
}

/** Three ways to search by meaning as of a date, measured against the exact answer. */
export function Search() {
  return (
    <Figure
      title={`Top-10 search as of a date, three designs · ${ann.versioned80.pairs.toLocaleString("en")} query and date pairs each`}
      read={
        <>
          Recall is the share of the exact ten nearest live rows that a search
          found, averaged over the pairs. The middle bar splits the pairs by
          what came back. The right bar is the median time on a scale from 0 to{" "}
          {SLOWEST} ms, with a line on to the 95th percentile. The times are
          from a shared laptop with warm caches, not a benchmark.
        </>
      }
    >
      <div className={`max-md:hidden ${COLUMNS} border-b border-rule pb-2`}>
        <Head>Design</Head>
        <Head>Recall of the true ten</Head>
        <Head>What came back</Head>
        <Head>Median time, to p95</Head>
      </div>

      <ol className="divide-y divide-rule">
        {ROWS.map(({ letter, name, setting, design }) => (
          <li
            key={`${letter} ${setting}`}
            className={`${COLUMNS} flex flex-col gap-2.5 py-3 md:items-center`}
          >
            <div>
              <p className="text-sm">
                <span className="mr-2 font-mono text-xs text-rubric">
                  {letter}
                </span>
                {name}
              </p>
              <p className="text-xs text-ink-faint tabular-nums">{setting}</p>
            </div>

            <div>
              <Small>Recall of the true ten</Small>
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0 font-serif text-lg tabular-nums">
                  {percent(design.recall, design.recall === 1 ? 0 : 2)}
                </span>
                <span className="flex-1">
                  <Meter share={design.recall} className="fill-ink" />
                </span>
              </div>
            </div>

            <div>
              <Small>What came back</Small>
              <Outcome design={design} />
              <p className="mt-1 text-[11px] text-ink-faint tabular-nums">
                {percent(design.underfilled, 1)} short ·{" "}
                {percent(design.fullButWrong, 1)} full but wrong
              </p>
            </div>

            <div>
              <Small>Median time, to p95</Small>
              <Time design={design} />
              <p className="mt-1 text-[11px] text-ink-faint tabular-nums">
                <span className="text-ink-soft">
                  {design.medianMs.toFixed(2)} ms
                </span>{" "}
                · p95 {design.p95Ms.toFixed(2)} ms
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-rule pt-3 text-xs text-ink-faint">
        <Key className="fill-ink-faint">fewer than ten rows came back</Key>
        <Key className="fill-removed">
          ten rows, at least one true neighbour missing
        </Key>
        <Key className="fill-added">the true ten</Key>
      </p>
    </Figure>
  );
}

const SHAPES = [
  {
    letter: "A",
    name: "Versioned table with a vector index",
    verdict: "Runs, uses the index, and is mostly short of ten rows.",
    sql: VERSIONED,
  },
  {
    letter: "B",
    name: "Plain vector table, joined to lifetimes",
    verdict: "Ten rows more often, and usually not the right ten.",
    sql: JOINED,
  },
  {
    letter: "C",
    name: "Lifetime filter first, then exact distance",
    verdict: "What the product runs. No vector index is involved.",
    sql: EXACT,
  },
];

/** The three statements, side by side, as they were timed. */
export function Shapes() {
  return (
    <div className="grid gap-px overflow-hidden rounded border border-rule bg-rule lg:grid-cols-3">
      {SHAPES.map((shape) => (
        <div key={shape.letter} className="min-w-0 bg-paper-raised p-4">
          <p className="text-sm">
            <span className="mr-2 font-mono text-xs text-rubric">
              {shape.letter}
            </span>
            {shape.name}
          </p>
          <p className="mt-0.5 mb-3 text-xs text-ink-faint">{shape.verdict}</p>
          <Sql text={shape.sql} />
        </div>
      ))}
    </div>
  );
}
