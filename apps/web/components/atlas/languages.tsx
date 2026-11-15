import Link from "next/link";

import { day, minute, number, readHref } from "@/lib/format";

import { Figure, Meter, Shares } from "./chart";
import { languages } from "./data";
import { across, fullDay, percent } from "./format";
import { LEADS } from "./quoted";

const { history } = languages;

const NAMES: Record<string, string> = {
  fi: "Finnish",
  sv: "Swedish",
  en: "English",
};

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

type Counted = { name: string; count: number; note?: string };

/** Counts on one scale: the largest fills the box. Shares are of the total. */
function Bars({ rows, total }: { rows: Counted[]; total: number }) {
  const largest = Math.max(...rows.map((row) => row.count));

  return (
    <ol className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li
          key={row.name}
          className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[8.5rem_minmax(0,1fr)]"
        >
          <span className="text-xs leading-snug text-ink-soft">{row.name}</span>
          <span>
            <span className="flex items-center gap-2.5">
              <span className="min-w-0 flex-1">
                <Meter share={row.count / largest} />
              </span>
              <span className="w-8 shrink-0 text-right text-xs text-ink-soft tabular-nums">
                {number(row.count)}
              </span>
              <span className="w-12 shrink-0 text-right text-[11px] text-ink-faint tabular-nums">
                {percent(row.count / total, 1)}
              </span>
            </span>
            {row.note && (
              <span className="mt-0.5 block text-[11px] leading-snug text-ink-faint">
                {row.note}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The lab's sizes and shapes of a difference, in a reader's words. */
const SIZES: Record<string, string> = {
  "1 day": "1 day",
  "2 to 31 days": "2 to 31 days",
  "up to a year": "Up to a year",
  "one calendar year, only years given": "One year, only years given",
  "more than a year": "More than a year",
};

const SHAPES: Record<string, string> = {
  "same month and year, other day": "The day",
  "same day number and year, other month": "The month",
  "same day and month, other year": "The year",
  "more than one part differs": "More than one part",
};

/** The labels of the hand reading, as the lab's audit file spells them. */
const LABELS = [
  {
    label: "real",
    name: "The leads give different dates for the same fact",
    className: "fill-ink",
  },
  {
    label: "calendar",
    name: "One leads with the Julian date, the other with the Gregorian",
    className: "fill-ink-faint",
  },
  {
    label: "convention",
    name: "Both hedge, in different words",
    className: "fill-rule",
  },
  {
    label: "different topic",
    name: "Two people behind one Wikidata id",
    className: "fill-gold",
  },
  {
    label: "extraction error",
    name: "The lab misread a lead",
    className: "fill-removed",
  },
];

const notes = (parts: (string | false)[]) =>
  parts.filter(Boolean).join(" · ") || undefined;

/** Where the three leads differ, by how much and in which part of the date. */
export function Disagreements() {
  const largestShare = Math.max(
    ...languages.byPair.flatMap((pair) => [pair.birth.share, pair.death.share]),
  );
  const withADay = languages.shapes.reduce((sum, row) => sum + row.pairs, 0);
  const read = languages.read("lifespan");

  return (
    <Figure
      title={`Birth and death dates in the leads of three Wikipedias · ${number(languages.topics)} topics that open with one in Finnish and in Swedish or English, as of ${LEADS.snapshot}`}
      read={
        <>
          The first bar counts topics. A topic differs when any two of its leads
          give another date for the birth or the death, compared at the coarser
          precision of the two: a full date against a bare year compares years.
          Hedged means a date of the pair is marked as approximate in the lead
          (“noin”, “c.”, “omkring”). The bars under it count pairs of languages
          stating one field of one topic, so a topic in three languages can
          count three times. The Julian gap is the distance between the two
          calendars in the century of the date: such a pair is probably one day
          written in two calendars. The last bar is {read} differing dates drawn
          at random and read with the three leads side by side. Those labels are
          a research agent’s. No outside source was read.
        </>
      }
    >
      <Shares
        label={`${number(languages.differ)} of ${number(languages.topics)} topics give a different birth or death date in at least one pair of languages`}
        parts={[
          {
            name: "Every lead gives the same dates",
            count: languages.agree,
            className: "fill-rule",
          },
          {
            name: "They differ on a date given as exact",
            count: languages.exact,
            className: "fill-ink",
          },
          {
            name: "They differ only where a date is hedged",
            count: languages.hedgedOnly,
            className: "fill-ink-faint",
          },
        ]}
      />

      <div className="mt-6 grid gap-x-12 gap-y-6 border-t border-rule pt-4 md:grid-cols-2">
        <div>
          <Head>
            How far apart · the {number(languages.pairsDiffering)} pairs of
            languages that differ
          </Head>
          <Bars
            total={languages.pairsDiffering}
            rows={languages.sizes.map((row) => ({
              name: SIZES[row.size] ?? row.size,
              count: row.pairs,
              note: notes([
                row.julian > 0 &&
                  `${row.julian} are exactly the Julian gap of their century`,
                row.hedged > 0 && `${row.hedged} hedged`,
              ]),
            }))}
          />
        </div>

        <div>
          <Head>
            Which part of the date differs · the {number(withADay)} pairs with a
            day on both sides
          </Head>
          <Bars
            total={withADay}
            rows={languages.shapes.map((row) => ({
              name: SHAPES[row.shape] ?? row.shape,
              count: row.pairs,
              note: notes([
                row.julian > 0 &&
                  `${row.julian} are exactly the Julian gap of their century`,
              ]),
            }))}
          />
        </div>
      </div>

      <div className="mt-6 border-t border-rule pt-4">
        <Head>
          Share of the dates two languages both give that differ, by pair
        </Head>
        <ol className="grid gap-x-12 gap-y-4 md:grid-cols-3">
          {languages.byPair.map((pair) => (
            <li key={pair.pair}>
              <p className="mb-1.5 text-xs text-ink-soft">
                {pair.pair
                  .split("-")
                  .map((language) => NAMES[language])
                  .join(" and ")}
              </p>
              {(
                [
                  ["births", pair.birth],
                  ["deaths", pair.death],
                ] as const
              ).map(([name, field]) => (
                <div
                  key={name}
                  className="mt-1 grid grid-cols-[3rem_minmax(0,1fr)_7.5rem] items-center gap-x-2.5"
                >
                  <span className="text-xs text-ink-faint">{name}</span>
                  <Meter share={field.share / largestShare} />
                  <span className="text-right text-xs text-ink-soft tabular-nums">
                    {percent(field.share, 1)}
                    <span className="ml-1.5 text-[11px] text-ink-faint">
                      {number(field.differ)} of {number(field.compared)}
                    </span>
                  </span>
                </div>
              ))}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 border-t border-rule pt-4">
        <Head>
          {read} differing dates drawn at random, three leads read side by side
        </Head>
        <Shares
          label={`What ${read} differing dates read by hand turned out to be`}
          shares={false}
          parts={LABELS.map(({ label, name, className }) => ({
            name,
            count: languages.read("lifespan", label),
            className,
          }))}
        />
      </div>
    </Figure>
  );
}

const SHOWN = 8;

type Disputed = (typeof languages.disputed)[number];

/** A date of the Finnish lead as the lab stores it: a day, a month, a year. */
const stated = (value: string | null) => {
  if (value === null) return "no date";

  const [year, month, date] = value.split("-");
  if (date) return fullDay(value);

  return month
    ? new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : `${year}, the year alone`;
};

/** Ink is the date the Finnish lead gives today, gold the one it does not. */
const TONES = {
  today: { fill: "fill-ink-soft", text: "text-ink" },
  theirs: { fill: "fill-gold", text: "text-gold" },
  other: { fill: "fill-ink-faint", text: "text-ink-soft" },
};

const UNDERLINED =
  "underline decoration-rule underline-offset-4 hover:decoration-rubric";

/** One date three leads give two ways, and what the Finnish lead said when. */
function Dispute({ row }: { row: Disputed }) {
  return (
    <li className="grid gap-x-10 gap-y-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <Link
            href={readHref(row.title)}
            className={`font-serif text-[17px] ${UNDERLINED}`}
          >
            {row.title}
          </Link>
          <span className="text-xs text-ink-faint">{row.field}</span>
          <span className="rounded-sm bg-paper-sunk px-1.5 py-px text-[10px] tracking-wide text-ink-soft uppercase">
            {NAMES[row.alone]} stands alone
          </span>
        </div>

        <dl className="mt-2.5 grid gap-x-4 gap-y-1 sm:grid-cols-3">
          {row.values.map((value) => (
            <div
              key={value.language}
              className="max-sm:flex max-sm:items-baseline max-sm:gap-x-3"
            >
              <dt className="text-[10px] tracking-wide text-ink-faint uppercase max-sm:w-14 max-sm:shrink-0">
                {NAMES[value.language]}
              </dt>
              <dd className="font-serif text-[15px] leading-snug sm:mt-0.5">
                <a
                  href={value.url}
                  className={`${UNDERLINED} ${
                    value.differs ? TONES.theirs.text : TONES.today.text
                  }`}
                >
                  {value.shown}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <svg
          width="100%"
          height="10"
          role="img"
          aria-label={`The Finnish lead from ${day(row.created)} to ${day(row.until)}: ${row.said.map((step) => `${stated(step.value)} from ${day(step.from)}`).join(", ")}`}
          className="block overflow-visible"
        >
          <rect width="100%" height="10" className="fill-paper-sunk" />
          {row.timeline.map(
            (stay, index) =>
              stay.value !== null && (
                <rect
                  key={`${stay.from} ${index}`}
                  x={across(stay.starts)}
                  width={across(stay.ends - stay.starts)}
                  height="10"
                  className={TONES[stay.says].fill}
                >
                  <title>{`${stated(stay.value)}: ${stay.from} to ${stay.to} UTC`}</title>
                </rect>
              ),
          )}
          {/* Time is red: the moment the date the lead gives today arrived. */}
          <line
            x1={across(row.sinceAt)}
            x2={across(row.sinceAt)}
            y1="-3"
            y2="13"
            strokeWidth={2}
            className="stroke-rubric"
          />
        </svg>
        <p className="mt-1 flex justify-between gap-4 text-[10px] text-ink-faint tabular-nums">
          <span>article created {day(row.created)}</span>
          <span>{day(row.until)}</span>
        </p>

        <ol className="mt-2 flex flex-wrap items-start gap-x-2.5 gap-y-2">
          {row.said.map((step, index) => (
            <li key={step.from} className="flex items-start gap-x-2.5">
              {index > 0 && (
                <span aria-hidden className="text-ink-faint">
                  →
                </span>
              )}
              <span className="inline-flex flex-col">
                <span
                  className={`font-serif text-[15px] leading-tight whitespace-nowrap tabular-nums ${
                    step.value === null
                      ? "text-ink-faint italic"
                      : TONES[step.says].text
                  }`}
                >
                  {stated(step.value)}
                </span>
                <span className="text-[10px] whitespace-nowrap text-rubric tabular-nums">
                  {day(step.from)}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-2.5 text-xs leading-relaxed text-ink-faint">
          The Finnish lead has said this since{" "}
          <span className="text-rubric tabular-nums">{minute(row.since)}</span>,
          revision <span className="font-mono">{row.revId}</span>.{" "}
          <Link
            href={readHref(row.title, row.since)}
            className={`text-ink-soft ${UNDERLINED}`}
          >
            Read the article as it stood then
          </Link>
        </p>
      </div>
    </li>
  );
}

/** The list an editor would want, and what the Finnish history says of it. */
export function Moved() {
  const shown = languages.moved.slice(0, SHOWN);

  return (
    <Figure
      title={`Two languages against one, and the Finnish lead once gave the other date · ${shown.length} of the ${languages.moved.length} such dates among the ${languages.candidates} on the lab’s list`}
      read={
        <>
          Each row is one birth or death that all three leads give in full, two
          of them alike. The three dates are in each lead’s own words, as of{" "}
          {LEADS.snapshot}, and link to the three Wikipedias. The bar is the
          Finnish lead alone, from the day the article was created to 1 October
          2026: ink while it gave the date it gives today, gold while it gave
          the date another lead still gives, grey for anything else, such as a
          bare year. An empty stretch is a time when the lead gave no such date
          or the lab could not follow it. The red line is the moment today’s
          date arrived, and the link opens the article here as it stood at that
          moment. Under the bar are the values in order with the day each
          arrived, versions that were reverted left out. Rows where Finnish
          stands alone come first, then the lab’s own order. Only the Finnish
          side has a history: the Swedish and English dates are one snapshot. Of
          the {languages.twoAgainstOne} dates that stand two against one, the
          Finnish history could be read for {languages.historyKnown}.
        </>
      }
    >
      <ol className="divide-y divide-rule">
        {shown.map((row) => (
          <Dispute key={row.id} row={row} />
        ))}
      </ol>

      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-rule pt-3 text-xs text-ink-faint">
        <Key className={TONES.today.fill}>
          the date the Finnish lead gives today
        </Key>
        <Key className={TONES.theirs.fill}>
          the date another lead gives and Finnish does not
        </Key>
        <Key className={TONES.other.fill}>another value</Key>
      </p>

      <div className="mt-5 grid gap-x-12 gap-y-6 border-t border-rule pt-4 lg:grid-cols-2">
        <div>
          <Head>
            Which language stands alone · {languages.twoAgainstOne} dates all
            three give in full, two against one
          </Head>
          <ol className="grid grid-cols-3 gap-x-6">
            {languages.alone.map((row) => (
              <li key={row.language}>
                <p className="text-xs text-ink-faint">{NAMES[row.language]}</p>
                <p className="mt-0.5 mb-1.5 font-serif text-xl tabular-nums">
                  {row.facts}
                </p>
                <svg width="100%" height="10" aria-hidden className="block">
                  <rect width="100%" height="10" className="fill-paper-sunk" />
                  <rect
                    width={across(row.left / row.facts)}
                    height="10"
                    className={TONES.theirs.fill}
                  />
                  <rect
                    x={across(row.left / row.facts)}
                    width={across(row.never / row.facts)}
                    height="10"
                    className={TONES.today.fill}
                  />
                </svg>
                <p className="mt-1.5 text-[11px] leading-snug text-ink-faint">
                  <span className="text-ink-soft tabular-nums">{row.left}</span>{" "}
                  Finnish once gave{" "}
                  {row.language === "fi"
                    ? "the date the other two share"
                    : `the ${NAMES[row.language]} date`}{" "}
                  and left it ·{" "}
                  <span className="text-ink-soft tabular-nums">
                    {row.never}
                  </span>{" "}
                  it never did
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <Head>
            Since when the Finnish date has stood · {history.facts} Finnish
            dates another language gives differently
          </Head>
          <Bars
            total={history.facts}
            rows={history.since.map((row) => ({
              name: row.years,
              count: row.facts,
            }))}
          />
        </div>
      </div>
    </Figure>
  );
}
