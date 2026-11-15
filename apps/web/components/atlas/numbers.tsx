import Link from "next/link";

import { day, minute, number, readHref } from "@/lib/format";

import { Figure, Meter, Shares } from "./chart";
import { numbers } from "./data";
import { across, percent } from "./format";
import { WINTER_WAR } from "./quoted";

const { size, stood } = numbers;

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

type Counted = { count: number; share: number };

type Band = { name: string; within?: boolean; first: Counted; second: Counted };

function Bar({
  value,
  largest,
  className,
}: {
  value: Counted;
  largest: number;
  className: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="min-w-0 flex-1">
        <Meter share={value.share / largest} className={className} />
      </span>
      <span className="w-10 shrink-0 text-right text-xs text-ink-soft tabular-nums">
        {number(value.count)}
      </span>
      <span className="w-12 shrink-0 text-right text-[11px] text-ink-faint tabular-nums">
        {percent(value.share, 1)}
      </span>
    </span>
  );
}

/**
 * Two distributions over the same bands, one bar under the other. A bar is a
 * share of its own total, and the largest share in the chart fills the box.
 */
function Bands({ bands }: { bands: Band[] }) {
  const largest = Math.max(
    ...bands.flatMap((band) => [band.first.share, band.second.share]),
  );

  return (
    <ol className="flex flex-col gap-2.5">
      {bands.map((band) => (
        <li
          key={band.name}
          className="grid grid-cols-[6.25rem_minmax(0,1fr)] items-center gap-x-3"
        >
          <span
            className={`text-xs leading-snug ${
              band.within ? "pl-3 text-ink-faint" : "text-ink-soft"
            }`}
          >
            {band.name}
          </span>
          <span className="flex flex-col gap-1">
            <Bar
              value={band.first}
              largest={largest}
              className="fill-ink-faint"
            />
            <Bar value={band.second} largest={largest} className="fill-ink" />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The lab's own bands of time, in the words a reader would use for them. */
const STAYS: Record<string, string> = {
  "<1 day": "Under a day",
  "1–30 days": "1 to 30 days",
  "30–365 days": "30 to 365 days",
  "1–5 years": "1 to 5 years",
  "5+ years": "5 years or more",
};

const EDITORS: Record<string, string> = {
  named: "Named accounts",
  ip: "IP addresses",
  temp: "Temporary accounts",
};

/** One number replaced in a sentence that otherwise stayed as it was. */
export function Substitutions() {
  return (
    <Figure
      title={`One number replaced, every other character kept · ${number(numbers.all)} substitutions in ${number(numbers.articles)} articles`}
      read={
        <>
          A substitution is two wordings of a paragraph, one straight after the
          other, that differ in one number and in nothing else. The first bar
          sorts all of them by whether the edit that brought the old figure, or
          the new one, was later reverted. The filter sets aside a reverted
          figure and the change back out of it. Below it, each bar is a share of
          its own total. Size is the change against the old value and is given
          for quantities only, not for dates or years. A stay is how long a
          figure was observed in that exact sentence: for a new figure that
          still stands on 1 October 2026 it is a lower bound. Still standing
          means the value is in that sentence at the cutoff, also when it left
          and came back.
        </>
      }
    >
      <div className="grid items-center gap-x-8 gap-y-2 md:grid-cols-[auto_minmax(0,1fr)]">
        <p className="font-serif text-3xl whitespace-nowrap tabular-nums">
          <span className="text-removed">{WINTER_WAR.old}</span>{" "}
          <span className="text-ink-faint">→</span>{" "}
          <span className="text-added">{WINTER_WAR.new}</span>
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          The product’s running example is one of them: the death toll of the
          Winter War in{" "}
          <Link
            href={readHref(WINTER_WAR.article, WINTER_WAR.at)}
            className="text-ink underline decoration-rule underline-offset-4 hover:decoration-rubric"
          >
            {WINTER_WAR.article}
          </Link>
          , changed on{" "}
          <span className="text-rubric tabular-nums">
            {minute(WINTER_WAR.at)}
          </span>{" "}
          by revision <span className="font-mono">{WINTER_WAR.revId}</span>.
          Neither edit was reverted. The old figure had stood{" "}
          {number(Math.round(WINTER_WAR.oldDays))} days in that exact sentence
          and the new one stood {number(Math.round(WINTER_WAR.newDays))}. Those
          are stays of the sentence, not the age of the claim.
        </p>
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <Head>What the revert filter keeps</Head>
        <Shares
          label={`${number(numbers.kept)} of ${number(numbers.all)} substitutions have no reverted edit at either end`}
          parts={[
            {
              name: "Neither figure came in with a reverted edit",
              count: numbers.kept,
              className: "fill-ink",
            },
            {
              name: "Only the old figure did",
              count: numbers.newKept - numbers.kept,
              className: "fill-ink-faint",
            },
            {
              name: "The new figure did",
              count: numbers.all - numbers.newKept,
              className: "fill-rule",
            },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-x-12 gap-y-6 border-t border-rule pt-4 md:grid-cols-2">
        <div>
          <Head>Size of the change · quantities only</Head>
          <Bands
            bands={[
              {
                name: "Under 1 %",
                first: size.all.under1,
                second: size.kept.under1,
              },
              {
                name: "1 to 10 %",
                first: size.all.upTo10,
                second: size.kept.upTo10,
              },
              {
                name: "Over 10 %",
                first: size.all.over10,
                second: size.kept.over10,
              },
              {
                name: "of them tenfold or more",
                within: true,
                first: size.all.tenfold,
                second: size.kept.tenfold,
              },
            ]}
          />
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-faint">
            <Key className="fill-ink-faint">
              all {number(size.all.quantities)}
            </Key>
            <Key className="fill-ink">
              the {number(size.kept.quantities)} kept
            </Key>
            <span>
              {size.kept.fromZero.count} more started from zero and have no
              percentage
            </span>
          </p>
        </div>

        <div>
          <Head>How long a figure was observed · the kept</Head>
          <Bands
            bands={stood.old.bands.map((band, index) => ({
              name: STAYS[band.band] ?? band.band,
              first: band,
              second: stood.new.bands[index],
            }))}
          />
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-faint">
            <Key className="fill-ink-faint">the figure that was replaced</Key>
            <Key className="fill-ink">the one that replaced it</Key>
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-rule pt-4">
        <Head>
          Whose new figure still stands on 1 October 2026 · the kept, by the
          account that made the change
        </Head>
        <ol className="grid gap-x-12 gap-y-4 md:grid-cols-3">
          {numbers.editors.map((editor) => (
            <li key={editor.editor}>
              <p className="text-xs text-ink-faint tabular-nums">
                {EDITORS[editor.editor] ?? editor.editor} ·{" "}
                {number(editor.changes)} substitutions
              </p>
              <p className="mt-0.5 mb-1.5 font-serif text-xl tabular-nums">
                {percent(editor.share, 1)}
                <span className="ml-2 font-sans text-xs text-ink-faint">
                  {number(editor.standing)} still stand
                </span>
              </p>
              <Meter share={editor.share} className="fill-added" />
            </li>
          ))}
        </ol>
      </div>
    </Figure>
  );
}

const SHOWN = 6;

/* A long timeline keeps its first and its last values. */
const OPENING = 4;
const CLOSING = 3;

type Figured = (typeof numbers.unsettled)[number];

/** The lab's verdicts, as its audit file spells them. */
const VERDICTS: Record<string, { name: string; fill: string }> = {
  "update to newer data": {
    name: "An update to newer data",
    fill: "fill-ink-soft",
  },
  unclear: {
    name: "Unclear: update or correction",
    fill: "fill-ink-faint",
  },
  "correction with a source": {
    name: "A correction with a source",
    fill: "fill-gold",
  },
};

function Value({ stay }: { stay: Figured["timeline"][number] }) {
  return (
    <span className="inline-flex flex-col">
      <span className="font-serif text-[15px] leading-tight whitespace-nowrap tabular-nums">
        {stay.value}
      </span>
      <span className="text-[10px] whitespace-nowrap text-rubric tabular-nums">
        {day(stay.from)}
      </span>
    </span>
  );
}

function Arrow() {
  return (
    <span aria-hidden className="text-ink-faint">
      →
    </span>
  );
}

/** One position in one sentence, and every value it held in order. */
function Timeline({ figure }: { figure: Figured }) {
  const { timeline } = figure;
  const first = timeline[0];
  const last = timeline[timeline.length - 1];

  const long = timeline.length > OPENING + CLOSING + 1;
  const opening = long ? timeline.slice(0, OPENING) : timeline;
  const closing = long ? timeline.slice(-CLOSING) : [];

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <Link
          href={readHref(figure.article)}
          className="font-serif text-[17px] underline decoration-rule underline-offset-4 hover:decoration-rubric"
        >
          {figure.article}
        </Link>
        <span className="rounded-sm bg-paper-sunk px-1.5 py-px text-[10px] tracking-wide text-ink-soft uppercase">
          {figure.kind}
        </span>
        <span className="text-xs text-ink-faint tabular-nums sm:ml-auto">
          {figure.values} values · {figure.substitutions} strict substitutions
        </span>
      </div>
      <p className="mt-1 line-clamp-2 max-w-3xl font-serif text-[15px] leading-relaxed text-ink-soft">
        {figure.sentence}
      </p>

      <svg
        width="100%"
        height="10"
        role="img"
        aria-label={`${timeline.length} stays of a value from ${day(first.from)} to ${day(last.to)}`}
        className="mt-2.5 block"
      >
        <rect width="100%" height="10" className="fill-paper-sunk" />
        {timeline.map((stay, index) => (
          <rect
            key={`${stay.from} ${index}`}
            x={across(stay.starts)}
            width={across(stay.ends - stay.starts)}
            height="10"
            className={
              stay.standing
                ? "fill-added"
                : index % 2
                  ? "fill-ink-faint"
                  : "fill-ink-soft"
            }
          >
            <title>{`${stay.value}: ${stay.from} to ${stay.to} UTC`}</title>
          </rect>
        ))}
      </svg>
      <p className="mt-1 flex justify-between gap-4 text-[10px] tabular-nums">
        <span className="text-rubric">{day(first.from)}</span>
        <span className={last.standing ? "text-added" : "text-rubric"}>
          {last.standing ? "still stands on " : ""}
          {day(last.to)}
        </span>
      </p>

      <ol className="mt-2 flex flex-wrap items-start gap-x-2.5 gap-y-2">
        {opening.map((stay, index) => (
          <li
            key={`${stay.from} ${index}`}
            className="flex items-start gap-x-2.5"
          >
            {index > 0 && <Arrow />}
            <Value stay={stay} />
          </li>
        ))}
        {long && (
          <li className="flex items-start gap-x-2.5 text-xs text-ink-faint">
            <Arrow />
            <span className="pt-0.5">
              {timeline.length - OPENING - CLOSING} more
            </span>
          </li>
        )}
        {closing.map((stay, index) => (
          <li
            key={`${stay.from} ${index}`}
            className="flex items-start gap-x-2.5"
          >
            <Arrow />
            <Value stay={stay} />
          </li>
        ))}
      </ol>

      {figure.read && (
        <p className="mt-2.5 text-xs leading-relaxed text-ink-faint">
          <span className="mr-2 rounded-sm bg-paper-sunk px-1.5 py-px text-[10px] tracking-wide text-ink-soft uppercase">
            {figure.read.verdict}
          </span>
          Read by hand: {figure.read.old} → {figure.read.new} on{" "}
          {day(figure.read.at)}, its first kept substitution.
        </p>
      )}
    </li>
  );
}

/** The figures that changed most often, and what a close reading found. */
export function Unsettled() {
  const shown = numbers.unsettledByArticle.slice(0, SHOWN);
  const { audit } = numbers;

  return (
    <Figure
      title={`The least settled figures · the highest-ranked of each article, the first ${SHOWN} of the ${numbers.unsettled.length} the lab lists`}
      read={
        <>
          A row is one position in one sentence. The bar runs from the first
          value to the last one, a block for each stay of a value, in two tones
          so that neighbours can be told apart. Green is a value that still
          stands. Under it are the values in order, each with the day it
          arrived. The count of values includes changes that came with other
          edits to the sentence. Only the strict substitutions changed the one
          number alone. The chip is the lab’s reading of one change, not of the
          whole timeline. Titles are today’s.
        </>
      }
    >
      <ol className="divide-y divide-rule">
        {shown.map((figure) => (
          <Timeline key={figure.id} figure={figure} />
        ))}
      </ol>

      <div className="mt-5 border-t border-rule pt-4">
        <Head>
          The first kept substitution of each of the {audit.length} least
          settled figures, read one by one
        </Head>
        <Shares
          label={`What the ${audit.length} substitutions read by hand turned out to be`}
          shares={false}
          parts={[
            ...Object.entries(VERDICTS).map(([verdict, { name, fill }]) => ({
              name,
              count: audit.filter((row) => row.verdict === verdict).length,
              className: fill,
            })),
            {
              name: "A dispute between sources, or vandalism that survived",
              count: audit.filter((row) =>
                /dispute|vandalism/.test(row.verdict),
              ).length,
              className: "fill-removed",
            },
          ]}
        />
      </div>
    </Figure>
  );
}
