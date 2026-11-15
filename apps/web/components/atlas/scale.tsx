import { Sql } from "@/components/sql";
import { day, number } from "@/lib/format";

import { Figure } from "./chart";
import { scale, when } from "./data";
import { across } from "./format";
import { LAST_SECOND, MISPLACED } from "./queries";

const { moments, sizes, yearly } = scale;

/** A read without a date: the current rows. */
const NOW = "now";

const TALVISOTA = "talvisota";
const HALONEN = "halonen";

type Ran = ReturnType<typeof scale.indexes>[number]["primary"];

function Head({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-xs tracking-wide text-ink-faint uppercase">
      {children}
    </p>
  );
}

function Key({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span>
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

/** Time is red: the moment a statement asks for. */
function Moment({ asOf }: { asOf: string }) {
  return asOf === NOW ? (
    <span className="text-ink-soft">No date: the current rows</span>
  ) : (
    <span className="text-rubric tabular-nums">As of {day(asOf)}</span>
  );
}

const ms = (value: number) =>
  value < 100 ? value.toFixed(2) : number(Math.round(value));

/* ── Rows read against rows returned ──────────────────────────────────── */

/** The keys of the lab's table p_idx, as it defines them. */
const KEYS = [
  {
    plan: "primary",
    name: "PRIMARY",
    columns: "(page_id, hash, dup, row_end)",
  },
  { plan: "pe", name: "pe", columns: "(page_id, row_end)" },
  { plan: "ps", name: "ps", columns: "(page_id, row_start)" },
  { plan: "per", name: "per", columns: "(page_id, row_end, row_start)" },
] as const;

const talvisota = scale.indexes(TALVISOTA);

/** The longest bar: the most a plan read and checked for one answer. */
const most = Math.max(
  ...talvisota.flatMap((moment) =>
    KEYS.map(({ plan }) => moment[plan].read + moment[plan].checked),
  ),
);

/** Rows handed to the server, then the index entries tested to find them. */
function Cost({ run }: { run: Ran }) {
  return (
    <svg width="100%" height="10" aria-hidden className="block">
      <rect width="100%" height="10" className="fill-paper-sunk" />
      <rect
        x={across(run.read / most)}
        y="0.5"
        width={across(run.checked / most)}
        height="9"
        className="fill-paper-raised stroke-ink-faint"
      />
      <rect
        width={across(run.read / most)}
        height="10"
        className="fill-ink-soft"
      />
    </svg>
  );
}

/** What one article costs as of a date, through each key. */
export function Rows() {
  const [early] = talvisota;

  return (
    <Figure
      title={`Rows read to return Talvisota as of a date, through four keys · the article has ${number(scale.allTime(TALVISOTA))} rows over all time`}
      read={
        <>
          Each group is one statement, every block of the article as of a
          moment, run through one key at a time. The solid bar is the rows the
          engine handed to the server, the sum of the session’s{" "}
          <code className="font-mono">Handler_read_%</code> counters. The
          outlined bar is the index entries a pushed-down condition tested
          without fetching a row,{" "}
          <code className="font-mono">Handler_icp_attempts</code>. Both are
          exact counts of one run. Through the primary key the bar is the same
          at every date. <code className="font-mono">per</code> tests the
          entries of rows that ended after the date,{" "}
          <code className="font-mono">ps</code> those of rows that started
          before it, and <code className="font-mono">pe</code> has to fetch each
          row to learn when it started.
        </>
      }
    >
      <div className="grid grid-cols-3 gap-x-6 border-b border-rule pb-4">
        {[
          {
            value: early.primary.returned,
            label: `rows returned as of ${day(early.asOf)}`,
          },
          {
            value: early.primary.read,
            label: "rows read through the primary key",
          },
          {
            value: early.per.read,
            label: "rows read through per",
          },
        ].map((fact) => (
          <div key={fact.label}>
            <p className="font-serif text-2xl tabular-nums sm:text-3xl">
              {number(fact.value)}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-ink-faint">
              {fact.label}
            </p>
          </div>
        ))}
      </div>

      <ol className="divide-y divide-rule">
        {talvisota.map((moment) => (
          <li key={moment.asOf} className="py-3 last:pb-0">
            <p className="mb-2 text-xs text-ink-faint tabular-nums">
              <Moment asOf={moment.asOf} /> · {number(moment.primary.returned)}{" "}
              rows returned
            </p>
            <ol className="flex flex-col gap-1.5">
              {KEYS.map(({ plan, name }) => (
                <li
                  key={plan}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 md:grid-cols-[4.5rem_minmax(0,1fr)_17rem]"
                >
                  <span className="font-mono text-[11px] text-ink-soft">
                    {name}
                  </span>
                  <span className="max-md:order-last max-md:col-span-2">
                    <Cost run={moment[plan]} />
                  </span>
                  <span className="text-xs text-ink-soft tabular-nums max-md:text-right">
                    {number(moment[plan].read)} read
                    {moment[plan].checked > 0 && (
                      <span className="text-ink-faint">
                        {" "}
                        · {number(moment[plan].checked)} checked in the index
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-col gap-2 border-t border-rule pt-3 text-xs text-ink-faint">
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <Key className="fill-ink-soft">rows read</Key>
          <Key className="fill-paper-raised stroke-ink-faint">
            index entries tested by a pushed-down condition
          </Key>
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]">
          {KEYS.map(({ name, columns }) => (
            <span key={name}>
              <span className="text-ink-soft">{name}</span> {columns}
            </span>
          ))}
        </p>
      </div>
    </Figure>
  );
}

/* ── Layouts and indexes, timed ───────────────────────────────────────── */

/** An early date, a late one and today. */
const TIMED = moments.filter((_, index) => index % 2 === 0);

const halonen = {
  layouts: scale.layouts(HALONEN).filter((row) => TIMED.includes(row.asOf)),
  indexes: scale.indexes(HALONEN).filter((row) => TIMED.includes(row.asOf)),
};

const RUNS = [
  {
    name: "Run A · three layouts of the same rows",
    groups: halonen.layouts.map((moment) => ({
      asOf: moment.asOf,
      rows: [
        { name: "flat", run: moment.flat },
        { name: "history + current", run: moment.two },
        { name: "one partition a year", run: moment.yearly },
      ],
    })),
  },
  {
    name: "Run B · one flat table, by the key that is read",
    groups: halonen.indexes.map((moment) => ({
      asOf: moment.asOf,
      rows: [
        { name: "no period index", run: moment.primary },
        {
          name: `optimizer: ${moment.chosen.key?.replaceAll(",", " + ")}`,
          run: moment.chosen,
        },
        { name: "pe, forced", run: moment.pe },
        { name: "ps, forced", run: moment.ps },
        { name: "per, forced", run: moment.per },
      ],
    })),
  },
];

/** One scale for both runs: the slowest single run that is drawn. */
const slowest = Math.max(
  ...RUNS.flatMap((run) =>
    run.groups.flatMap((group) => group.rows.map((row) => row.run.slowest)),
  ),
);

/** The median as a bar, with a line from the fastest run to the slowest. */
function Took({ run, longest }: { run: Ran; longest: number }) {
  return (
    <svg width="100%" height="10" aria-hidden className="block">
      <rect width="100%" height="10" className="fill-paper-sunk" />
      <rect
        width={across(run.ms / longest)}
        height="10"
        className="fill-ink-soft"
      />
      <line
        x1={across(run.fastest / longest)}
        x2={across(run.slowest / longest)}
        y1="5"
        y2="5"
        className="stroke-ink"
      />
      {[run.fastest, run.slowest].map((end) => (
        <line
          key={end}
          x1={across(end / longest)}
          x2={across(end / longest)}
          y1="2"
          y2="8"
          className="stroke-ink"
        />
      ))}
    </svg>
  );
}

/** The same read of one article, by layout and by index. */
export function Times() {
  return (
    <Figure
      title={`Tarja Halonen as of a date, client milliseconds · the article has ${number(scale.allTime(HALONEN))} rows over all time`}
      read={
        <>
          A bar is the median of the timed runs of one statement, the line runs
          from the fastest of them to the slowest, and all bars share one scale
          of 0 to {ms(slowest)} ms. The machine was busy, and the two runs were
          taken at different times: the flat table is the baseline of each, and
          a time should only be set against the others of its run and date. The
          optimizer’s row is the same table with every index present and no
          hint, with the key it chose. The fastest median of a group is in ink.
        </>
      }
    >
      <div className="grid gap-x-12 gap-y-6 lg:grid-cols-2">
        {RUNS.map((run) => (
          <div key={run.name}>
            <Head>{run.name}</Head>
            <ol className="divide-y divide-rule border-t border-rule">
              {run.groups.map((group) => {
                const best = Math.min(...group.rows.map((row) => row.run.ms));

                return (
                  <li key={group.asOf} className="py-3 last:pb-0">
                    <p className="mb-2 text-xs">
                      <Moment asOf={group.asOf} />
                    </p>
                    <ol className="flex flex-col gap-1.5">
                      {group.rows.map((row) => (
                        <li
                          key={row.name}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 sm:grid-cols-[10.5rem_minmax(0,1fr)_9.5rem]"
                        >
                          <span className="truncate text-xs text-ink-soft">
                            {row.name}
                          </span>
                          <span className="max-sm:order-last max-sm:col-span-2">
                            <Took run={row.run} longest={slowest} />
                          </span>
                          <span className="text-xs text-ink-faint tabular-nums max-sm:text-right">
                            <span
                              className={
                                row.run.ms === best
                                  ? "font-medium text-ink"
                                  : "text-ink-soft"
                              }
                            >
                              {ms(row.run.ms)} ms
                            </span>{" "}
                            · {ms(row.run.fastest)} to {ms(row.run.slowest)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </Figure>
  );
}

/* ── Yearly partitions ────────────────────────────────────────────────── */

const pruned = scale.layouts(TALVISOTA);

const FIRST_YEAR = yearly.partitions[0].year ?? 0;
const CELL = 1 / yearly.partitions.length;

/** Where a moment falls on the row of partitions, a year to each. */
const falls = (asOf: string) => (when(asOf) - FIRST_YEAR) * CELL;

const COLUMNS =
  "grid items-center gap-x-4 gap-y-1 md:grid-cols-[10.5rem_minmax(0,1fr)_15rem]";

/** Which partitions an as-of read opens, when there is one for each year. */
export function Yearly() {
  return (
    <Figure
      title={`Yearly partitions prune one side only · the partitions read for Talvisota as of a date, of ${yearly.partitions.length}`}
      read={
        <>
          A cell is a partition: one for each year a row can have ended in,{" "}
          {FIRST_YEAR} to {yearly.partitions.at(-2)?.year}, and the last for the
          current rows. Filled cells were read, as{" "}
          <code className="font-mono">EXPLAIN PARTITIONS</code> lists them. The
          red line is the moment asked for. Pruning is by{" "}
          <code className="font-mono">row_end</code> alone: a row that stood on
          a date may have ended in any later year, so every later partition is
          opened, and none of the earlier ones. The line at the end of a year
          sits on the edge of that year’s cell, which is not read: that is the
          second wrong answer below.
        </>
      }
    >
      <ol className="flex flex-col gap-3">
        {pruned.map(({ asOf, yearly: read, flat }) => (
          <li key={asOf} className={COLUMNS}>
            <span className="text-xs">
              <Moment asOf={asOf} />
            </span>
            <svg
              width="100%"
              height="14"
              role="img"
              aria-label={`${read.partitions.length} of ${yearly.partitions.length} partitions read`}
              className="block overflow-visible"
            >
              {yearly.partitions.map((partition, index) => (
                <rect
                  key={partition.name}
                  x={across(index * CELL)}
                  width={across(CELL)}
                  height="14"
                  className={`stroke-paper-raised ${
                    read.partitions.includes(partition.name)
                      ? "fill-ink-soft"
                      : "fill-paper-sunk"
                  }`}
                >
                  <title>
                    {`${partition.name}: ${number(partition.rows)} rows ${
                      partition.year
                        ? `that ended in ${partition.year}`
                        : "still standing"
                    }`}
                  </title>
                </rect>
              ))}
              {asOf !== NOW && (
                <line
                  x1={across(falls(asOf))}
                  x2={across(falls(asOf))}
                  y1="-3"
                  y2="17"
                  strokeWidth={2}
                  className="stroke-rubric"
                />
              )}
            </svg>
            <span className="text-xs text-ink-soft tabular-nums">
              {read.partitions.length} read · {number(read.read)} rows
              <span className="text-ink-faint">
                {" "}
                against {number(flat.read)} flat
              </span>
            </span>
          </li>
        ))}

        <li aria-hidden className={`${COLUMNS} max-md:hidden`}>
          <span />
          <svg width="100%" height="12" className="block overflow-visible">
            {yearly.partitions.map(
              (partition, index) =>
                index % 5 === 0 && (
                  <text
                    key={partition.name}
                    x={across((index + 0.5) * CELL)}
                    y="10"
                    textAnchor="middle"
                    className="fill-ink-faint text-[10px] tabular-nums"
                  >
                    {partition.year}
                  </text>
                ),
            )}
            <text
              x="100%"
              y="10"
              textAnchor="end"
              className="fill-ink-faint text-[10px]"
            >
              current
            </text>
          </svg>
          <span />
        </li>
      </ol>
    </Figure>
  );
}

const WRONG = [
  {
    name: "History that was loaded before its partitions existed",
    what: "With AUTO the table starts with one history partition, and a history load puts every row into it whatever year the row ended in, without a warning. The first ordinary UPDATE creates the partitions up to today. From then on AS OF prunes the first partition for any later date, and a row that is still in the table is no longer returned.",
    script: "sql/misplaced-history.sql",
    sql: MISPLACED,
  },
  {
    name: "The last second before a partition boundary",
    what: "AS OF the last second of a year reads the partitions from the next year on. A row that ended half a second later stood at that moment and is in the skipped partition. The same rows without partitions return it. No row of this dataset is affected, because Wikipedia’s timestamps are whole seconds.",
    script: "sql/pruning-last-second.sql",
    sql: LAST_SECOND,
  },
];

/** The two cases in which a yearly layout returned fewer rows than stood. */
export function WrongAnswers() {
  return (
    <div className="grid gap-px overflow-hidden rounded border border-rule bg-rule lg:grid-cols-2">
      {WRONG.map((wrong, index) => (
        <div key={wrong.script} className="min-w-0 bg-paper-raised p-4">
          <p className="text-sm">
            <span className="mr-2 font-mono text-xs text-rubric">
              {index + 1}
            </span>
            {wrong.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            {wrong.what}
          </p>
          <p className="mt-2 mb-3 font-mono text-[11px] text-ink-faint">
            labs/history-at-scale/{wrong.script}, shortened
          </p>
          <Sql text={wrong.sql} />
        </div>
      ))}
    </div>
  );
}

/* ── Growth ───────────────────────────────────────────────────────────── */

const CASES = [
  {
    name: "Blocks of Talvisota",
    runs: scale.grown("primary", "blocks", TALVISOTA, moments[0]),
  },
  {
    name: "Blocks of Talvisota",
    runs: scale.grown("ps", "blocks", TALVISOTA, moments[0]),
  },
  {
    name: "Blocks of Talvisota",
    runs: scale.grown("per", "blocks", TALVISOTA, NOW),
  },
  {
    name: "Blocks of Tarja Halonen",
    runs: scale.grown("primary", "blocks", HALONEN, NOW),
  },
  {
    name: "Blocks of Tarja Halonen",
    runs: scale.grown("per", "blocks", HALONEN, NOW),
  },
  {
    name: "Count of every passage",
    runs: scale.grown("primary", "global", null, scale.countedAt),
  },
  {
    name: "Count of every passage",
    runs: scale.grown("primary", "global", null, NOW),
  },
];

const millions = (rows: number) => `${(rows / 1_000_000).toFixed(1)} M rows`;

const GROWN = "md:grid md:grid-cols-[13rem_repeat(3,minmax(0,1fr))] md:gap-x-6";

/** The same statements on a table of one, two and four times the rows. */
export function Growth() {
  return (
    <Figure
      title={`The same statements as the table grows · ${sizes.map((size) => `${size.times}×`).join(", ")} the rows`}
      read={
        <>
          One flat table with <code className="font-mono">ps</code> and{" "}
          <code className="font-mono">per</code>, grown by repeating the real
          rows under shifted ids. Every statement asks for the same original
          article at each size. A bar is the median of the timed runs with a
          line from the fastest to the slowest, and each row has its own scale,
          so bars compare along a row and not down the chart. Under it are the
          rows read plus the index entries checked. The table holds more
          articles as it grows, not longer histories.
        </>
      }
    >
      <div className={`max-md:hidden ${GROWN} border-b border-rule pb-2`}>
        <p className="text-xs tracking-wide text-ink-faint uppercase">
          Statement
        </p>
        {sizes.map((size) => (
          <p
            key={size.times}
            className="text-xs tracking-wide text-ink-faint uppercase"
          >
            {size.times}× · {millions(size.rows)}
          </p>
        ))}
      </div>

      <ol className="divide-y divide-rule">
        {CASES.map(({ name, runs }) => {
          const [first] = runs;
          const longest = Math.max(...runs.map((run) => run.slowest));

          return (
            <li
              key={`${name} ${first.asOf} ${first.key}`}
              className={`${GROWN} flex flex-col gap-2.5 py-3 last:pb-0 md:items-center`}
            >
              <div>
                <p className="text-sm">{name}</p>
                <p className="text-xs text-ink-faint">
                  <Moment asOf={first.asOf} /> ·{" "}
                  <span className="font-mono text-[11px]">
                    {first.key ?? "full scan"}
                  </span>
                </p>
              </div>

              {runs.map((run) => (
                <div key={run.times}>
                  <p className="mb-1 text-[11px] text-ink-faint md:hidden">
                    {run.times}× · {millions(run.rows)}
                  </p>
                  <Took run={run} longest={longest} />
                  <p className="mt-1 text-[11px] text-ink-faint tabular-nums">
                    <span className="text-ink-soft">{ms(run.ms)} ms</span> ·{" "}
                    {ms(run.fastest)} to {ms(run.slowest)} ·{" "}
                    {number(run.read + run.checked)} rows
                  </p>
                </div>
              ))}
            </li>
          );
        })}
      </ol>
    </Figure>
  );
}
