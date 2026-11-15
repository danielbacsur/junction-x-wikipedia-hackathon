import Link from "next/link";

import { day, minute, number, readHref, span } from "@/lib/format";

import { Figure, Shares } from "./chart";
import { infobox } from "./data";
import { across, duration, fullDay } from "./format";
import { MOVING_FIELDS } from "./quoted";

const { dates } = infobox;

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

/** The Finnish parameter names that are drawn, for a reader without Finnish. */
const GLOSS: Record<string, string> = {
  arvo: "office or rank",
  edeltäjä: "predecessor",
  johtajan_arvonimi1: "leader’s title",
  koordinaatit: "coordinates",
  kotisivu: "website",
  kuolinaika: "date of death",
  kuolinpaikka: "place of death",
  kuva: "image",
  kuvateksti: "caption",
  maakunta: "region",
  nimi: "name",
  puoliso: "spouse",
  puolue: "party",
  raiteita: "tracks",
  seuraaja: "successor",
  sijainti: "location",
  syntymäaika: "date of birth",
  syntymäpaikka: "place of birth",
  vaakuna: "coat of arms",
  vaalipiiri: "constituency",
  virassa: "in office",
  virassa2: "in office, second post",
  vuosi: "year",
  väkiluku: "population",
};

function Field({ name }: { name: string }) {
  return (
    <span className="min-w-0 leading-tight">
      <span className="block truncate font-mono text-[11px] text-ink-soft">
        {name}
      </span>
      {GLOSS[name] && (
        <span className="block truncate text-[10px] text-ink-faint">
          {GLOSS[name]}
        </span>
      )}
    </span>
  );
}

const MOST = 10;
const LEAST = 5;

const mebibytes = (bytes: number) => number(Math.round(bytes / 2 ** 20));

/** What the table holds, which fields move and how long a value stands. */
export function Lifetimes() {
  const most = infobox.mostReplaced.slice(0, MOST);
  const least = infobox.leastReplaced.slice(0, LEAST);
  const largest = Math.max(...most.map((row) => row.replacements));

  const stands = [...infobox.stands].sort((a, b) => b.median - a.median);
  const longest = Math.max(...stands.map((row) => row.p90));

  const [first] = infobox.oneField;

  return (
    <Figure
      title={`Every field of every recognised infobox as a row with a lifetime · ${number(infobox.rows)} rows from ${number(infobox.articlesWithBox)} of ${number(infobox.articles)} articles`}
      read={
        <>
          A statement is one non-empty field of an infobox in one accepted
          version. Versions that agree on the exact raw text of a field, one
          after another, become a single row: its{" "}
          <code className="font-mono">row_start</code> is the edit that first
          wrote the value and its <code className="font-mono">row_end</code> the
          first accepted version that no longer has it. The bar of one field is
          the result of statement b in the drawer: {infobox.oneField.length}{" "}
          rows and one date, because a short gap, a renamed template and a date
          template that came and went each ended a row. A replacement is one raw
          value straight after another in the same field. The solid part of a
          bar changed what a reader sees, the outlined part only markup or a
          reference. Rates are per 1,000 statements, not per year. For how long
          a value stands, only rows that have ended count: the thick line runs
          from the first quartile to the third with the median marked, the thin
          one to the 90th percentile, on one scale of 0 to{" "}
          {number(Math.round(longest))} days.
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { value: number(infobox.versions), label: "versions read" },
          {
            value: number(infobox.statements),
            label: "statements: a non-empty field in one version",
          },
          {
            value: number(infobox.rows),
            label: "rows: a raw value and the time it stood",
          },
          {
            value: infobox.perRow.toFixed(2),
            label: "statements collapse into one row, on average",
          },
          {
            value: `${infobox.loadSeconds.toFixed(2)} s`,
            label: "to load the rows with their real edit times",
          },
          {
            value: `${mebibytes(infobox.bytes)} MiB`,
            label: "of table and indexes, as InnoDB allocates them",
          },
        ].map((fact) => (
          <div key={fact.label}>
            <dt className="font-serif text-2xl tabular-nums">{fact.value}</dt>
            <dd className="mt-0.5 text-xs leading-snug text-ink-faint">
              {fact.label}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 border-t border-rule pt-4">
        <Head>What the {number(infobox.versions)} versions gave</Head>
        <Shares
          label={`${number(infobox.withBox)} of ${number(infobox.versions)} versions are accepted and have a recognised infobox`}
          parts={[
            {
              name: "Accepted, with a recognised infobox",
              count: infobox.withBox,
              className: "fill-ink",
            },
            {
              name: "Accepted, with none the lab recognises",
              count: infobox.accepted - infobox.withBox,
              className: "fill-ink-faint",
            },
            {
              name: "Skipped: the version was reverted",
              count: infobox.skipped,
              className: "fill-rule",
            },
          ]}
        />
      </div>

      <div className="mt-6 border-t border-rule pt-4">
        <Head>
          One field over all time · {first.title},{" "}
          <span className="font-mono normal-case">{first.field}</span>
        </Head>
        <svg
          width="100%"
          height="10"
          role="img"
          aria-label={`${infobox.oneField.length} rows of one field from ${day(first.from)} to ${day(infobox.oneField.at(-1)?.to)}`}
          className="block"
        >
          <rect width="100%" height="10" className="fill-paper-sunk" />
          {infobox.oneField.map((row, index) => (
            <rect
              key={row.revId}
              x={across(row.starts)}
              width={across(row.ends - row.starts)}
              height="10"
              className={`stroke-paper-raised ${
                row.standing
                  ? "fill-added"
                  : index % 2
                    ? "fill-ink-faint"
                    : "fill-ink-soft"
              }`}
            >
              <title>{`${row.value}: ${row.from} to ${row.standing ? "today" : `${row.to} UTC`}`}</title>
            </rect>
          ))}
        </svg>
        <ol className="mt-2 flex flex-wrap items-start gap-x-2.5 gap-y-2">
          {infobox.oneField.map((row, index) => (
            <li key={row.revId} className="flex items-start gap-x-2.5">
              {index > 0 && (
                <span aria-hidden className="text-ink-faint">
                  →
                </span>
              )}
              <span className="inline-flex flex-col">
                <span className="font-serif text-[15px] leading-tight whitespace-nowrap tabular-nums">
                  {row.value}
                </span>
                <span className="text-[10px] whitespace-nowrap text-ink-faint tabular-nums">
                  <span className={row.standing ? "text-added" : "text-rubric"}>
                    {day(row.from)}
                  </span>{" "}
                  · {row.template} ·{" "}
                  <span className="font-mono">{row.revId}</span>
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid gap-x-12 gap-y-6 border-t border-rule pt-4 lg:grid-cols-2">
        <div>
          <Head>
            Replaced most often · of the {infobox.ranked} fields with at least{" "}
            {number(MOVING_FIELDS.observations)} statements in{" "}
            {MOVING_FIELDS.slots} places
          </Head>
          <ol className="flex flex-col gap-2">
            {most.map((row) => (
              <li
                key={row.field}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 sm:grid-cols-[7rem_minmax(0,1fr)_9.5rem]"
              >
                <Field name={row.field} />
                <svg
                  width="100%"
                  height="10"
                  aria-hidden
                  className="block max-sm:order-last max-sm:col-span-2"
                >
                  <rect width="100%" height="10" className="fill-paper-sunk" />
                  <rect
                    x={across(row.cleaned / largest)}
                    y="0.5"
                    width={across(row.rawOnly / largest)}
                    height="9"
                    className="fill-paper-raised stroke-ink-faint"
                  />
                  <rect
                    width={across(row.cleaned / largest)}
                    height="10"
                    className="fill-ink-soft"
                  />
                </svg>
                <span className="text-right text-xs text-ink-soft tabular-nums">
                  {number(row.replacements)}
                  <span className="ml-1.5 text-[11px] text-ink-faint">
                    {row.per1000.toFixed(1)} per 1,000
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-faint">
            <Key className="fill-ink-soft">the reading text changed</Key>
            <Key className="fill-paper-raised stroke-ink-faint">
              only markup or a reference did
            </Key>
          </p>
        </div>

        <div>
          <Head>Replaced least often · the same fields, lowest rate first</Head>
          <ol className="divide-y divide-rule border-y border-rule">
            {least.map((row) => (
              <li
                key={row.field}
                className="grid items-center gap-x-3 gap-y-0.5 py-1.5 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <Field name={row.field} />
                <span className="text-xs text-ink-soft tabular-nums sm:text-right">
                  {number(row.replacements)} in {number(row.observations)}
                  <span className="ml-1.5 text-[11px] text-ink-faint">
                    {row.per1000.toFixed(2)} per 1,000 · {number(row.slots)}{" "}
                    places
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-6 border-t border-rule pt-4">
        <Head>
          How long a value stands · rows that have ended, in the {stands.length}{" "}
          fields seen most often, longest median first
        </Head>
        <ol className="gap-x-12 md:columns-2">
          {stands.map((row) => (
            <li
              key={row.field}
              className="grid break-inside-avoid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 py-1 sm:grid-cols-[7rem_minmax(0,1fr)_10.5rem]"
            >
              <Field name={row.field} />
              <svg
                width="100%"
                height="10"
                aria-hidden
                className="block max-sm:order-last max-sm:col-span-2"
              >
                <rect width="100%" height="10" className="fill-paper-sunk" />
                <line
                  x1={across(row.p25 / longest)}
                  x2={across(row.p90 / longest)}
                  y1="5"
                  y2="5"
                  className="stroke-ink-faint"
                />
                <rect
                  x={across(row.p25 / longest)}
                  y="2"
                  width={across((row.p75 - row.p25) / longest)}
                  height="6"
                  className="fill-ink-faint"
                />
                <line
                  x1={across(row.median / longest)}
                  x2={across(row.median / longest)}
                  y1="0"
                  y2="10"
                  strokeWidth={2}
                  className="stroke-ink"
                />
              </svg>
              <span className="text-right text-xs text-ink-soft tabular-nums">
                {number(Math.round(row.median))} days
                <span className="ml-1.5 text-[11px] text-ink-faint">
                  {number(row.completed)} ended, {number(row.current)} stand
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Figure>
  );
}

/** The lab's bins of a shift, smallest first. */
const SHIFTS = [
  "fill-rule",
  "fill-ink-faint",
  "fill-ink-soft",
  "fill-ink",
  "fill-gold",
];

/** The lab's readings, as its audit file spells them. */
const VERDICTS: Record<string, { name: string; chip: string; fill: string }> = {
  correction: {
    name: "An apparent correction",
    chip: "apparent correction",
    fill: "fill-ink-soft",
  },
  "calendar or format change": {
    name: "A change of format with a passing error",
    chip: "format change",
    fill: "fill-ink-faint",
  },
};

const READ = 6;

/** Seconds as a reader would say them, from a blink to years. */
const stood = (seconds: number) =>
  seconds < 86_400 ? duration(seconds) : span(seconds / 86_400);

/** The birth and death dates that were replaced, and the largest of them. */
export function Dates() {
  const shown = dates.read.slice(0, READ);

  return (
    <Figure
      title={`Birth and death dates that were replaced · ${dates.events} times, in ${dates.slots} fields of ${dates.articles} articles`}
      read={
        <>
          A replacement is two rows of one birth or death field, one straight
          after the other, that both parse to a full day and to different days.
          The bar sorts all {dates.events} by the distance between the two
          dates. Below are the {shown.length} largest shifts of the{" "}
          {dates.read.length} the lab read by hand: the date before in red and
          the date after, as the parser read them, then the raw text of the
          field, how long the first value stood and the lab’s reading. A year of
          three digits or a year in the future is what the source said. The
          links open the article here at the moment of the change. The readings
          are a research agent’s, from the infobox, the edit summary and the
          lead. No outside source was consulted, so “correction” means that the
          article’s own text, mostly its lead, points to a repair. It does not
          mean the later date is verified.
        </>
      }
    >
      <Shares
        label={`How far apart the two dates are in ${dates.events} replacements`}
        parts={dates.shifts.map((shift, index) => ({
          name: `${shift.bin} apart`,
          count: shift.events,
          className: SHIFTS[index] ?? "fill-ink",
        }))}
      />

      <div className="mt-6 border-t border-rule pt-4">
        <Head>
          The largest shifts, read by hand · {shown.length} of{" "}
          {dates.read.length}
        </Head>
        <ol className="grid gap-x-12 md:grid-cols-2">
          {shown.map((row) => (
            <li
              key={row.id}
              className="min-w-0 border-b border-rule py-3.5 md:nth-last-[-n+2]:border-b-0"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <Link
                  href={readHref(row.article, row.at)}
                  className="font-serif text-[17px] underline decoration-rule underline-offset-4 hover:decoration-rubric"
                >
                  {row.article}
                </Link>
                <span className="font-mono text-[11px] text-ink-faint">
                  {row.field}
                </span>
                <span className="rounded-sm bg-paper-sunk px-1.5 py-px text-[10px] tracking-wide text-ink-soft uppercase">
                  {VERDICTS[row.verdict]?.chip ?? row.verdict}
                </span>
              </div>

              <p className="mt-1.5 font-serif text-xl leading-snug tabular-nums">
                <span className="text-removed">{fullDay(row.old.date)}</span>{" "}
                <span className="text-ink-faint">→</span>{" "}
                {fullDay(row.new.date)}
              </p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed break-all text-ink-faint">
                {row.old.raw} <span aria-hidden>→</span> {row.new.raw}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
                The first value stood {stood(row.old.seconds)}, until{" "}
                <span className="text-rubric tabular-nums">
                  {minute(row.at)}
                </span>
                , revision <span className="font-mono">{row.revId}</span>
                {row.summary && <> with the summary “{row.summary}”</>}.
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                <span className="text-ink-faint">Read by hand:</span>{" "}
                {row.reason}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <Head>
          What the {dates.read.length} largest shifts turned out to be
        </Head>
        <Shares
          label={`The lab’s reading of the ${dates.read.length} largest shifts`}
          shares={false}
          parts={[
            ...Object.entries(VERDICTS).map(([verdict, { name, fill }]) => ({
              name,
              count: dates.read.filter((row) => row.verdict === verdict).length,
              className: fill,
            })),
            {
              name: "A dispute between sources",
              count: dates.read.filter((row) => /dispute/.test(row.verdict))
                .length,
              className: "fill-removed",
            },
          ]}
        />
      </div>
    </Figure>
  );
}

/** What each showcase statement asks, by its file in the lab's sql folder. */
const ASKS: Record<string, string> = {
  "a-asof.sql": "The whole infobox of one article as it stood at a moment",
  "b-field-history.sql": "Every value one field of one article ever had",
  "c-changed-dates.sql":
    "Fields whose date was replaced by another, most changes first",
  "d-returned-values.sql":
    "Values that were replaced and came back, over every field of the table",
  "e-month.sql": "Every replacement of a date of birth in one month",
};

const ms = (value: number) =>
  value < 100 ? value.toFixed(2) : number(Math.round(value));

/** The five statements of the lab, timed, and one index tried both ways. */
export function Asked() {
  const [{ runs }] = infobox.asked;

  return (
    <Figure
      title={`${infobox.asked.length} questions asked of the table, timed · and one of them with its index taken away`}
      read={
        <>
          A time is the client’s, with the fetch of the result, as the median of{" "}
          {runs} runs one after another on a shared server with warm caches,
          followed by the fastest and the slowest. The statements are in the
          drawer under their letters. Statements c and d end with a LIMIT, so
          their count of rows is capped. The two lines under the table are the
          first statement run with the key{" "}
          <code className="font-mono">
            article_asof (page_id, row_end, row_start)
          </code>{" "}
          forced and then ignored, with the rows{" "}
          <code className="font-mono">EXPLAIN</code> expects to read: one
          article at one date, not a claim about every date.
        </>
      }
    >
      <ol className="divide-y divide-rule">
        {infobox.asked.map((row) => (
          <li
            key={row.query}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-0.5 py-2 first:pt-0 md:grid-cols-[10.5rem_minmax(0,1fr)_5.5rem_12rem]"
          >
            <span className="font-mono text-[11px] text-ink-soft max-md:order-1">
              {row.query}
            </span>
            <span className="text-sm max-md:order-3 max-md:col-span-2">
              {ASKS[row.query] ?? row.query}
            </span>
            <span className="text-right text-xs text-ink-faint tabular-nums max-md:order-4 max-md:col-span-2 max-md:text-left">
              {number(row.returned)} rows
            </span>
            <span className="text-right text-xs text-ink-faint tabular-nums max-md:order-2">
              <span className="font-medium text-ink">{ms(row.ms)} ms</span> ·{" "}
              {ms(row.fastest)} to {ms(row.slowest)}
            </span>
          </li>
        ))}
      </ol>

      <ol className="mt-3 flex flex-col gap-1 border-t border-rule pt-3">
        {infobox.index.map((row) => (
          <li
            key={row.hint}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5"
          >
            <span className="font-mono text-[11px] text-ink-soft">
              {row.hint}
            </span>
            <span className="text-xs text-ink-faint tabular-nums">
              <span className="font-medium text-ink">{ms(row.ms)} ms</span> ·{" "}
              {number(row.expected)} rows expected,{" "}
              {row.key ? (
                <>
                  through <span className="font-mono">{row.key}</span>
                </>
              ) : (
                "a scan of the whole table"
              )}
            </span>
          </li>
        ))}
      </ol>
    </Figure>
  );
}
