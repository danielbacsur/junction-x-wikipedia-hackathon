import { number } from "@/lib/format";

import { Figure, Plot, Rules, Shares } from "./chart";
import { sourcing } from "./data";
import { across, percent } from "./format";

const { years, audit } = sourcing;

const BAND = 1 / years.length;
const middle = (index: number) => (index + 0.5) * BAND;

const TOP = 26;
const TALL = 200;
const FOOT = 24;
const BOTTOM = TOP + TALL;

const y = (share: number) => TOP + (1 - share) * TALL;

/** New paragraphs that arrived with a footnote, year by year. */
export function Sourcing() {
  const partial = years[years.length - 1];
  const first = years.find((row) => row.born > 0)!;

  // The largest fall from one year to the next.
  const dip = years
    .slice(1)
    .reduce((worst, row, index) =>
      row.share - years[index].share <
      worst.share - years[years.indexOf(worst) - 1].share
        ? row
        : worst,
    );

  const marked = [first, dip, partial];

  return (
    <Figure
      title={`Share of new prose paragraphs that arrived with an inline reference · ${number(years.reduce((sum, row) => sum + row.paragraphs, 0))} paragraphs, by the year they were first seen`}
      read={
        <>
          A bar is the paragraphs first seen in that year, including those later
          removed, and how many of them carried a{" "}
          <code className="font-mono">&lt;ref&gt;</code> in their first wording.
          The hollow bar is {partial.year}, which ends on 1 October. This
          measures the adoption of one piece of syntax. A paragraph without it
          may still rest on the article’s bibliography, which is not counted,
          and the zeros before {first.year} do not mean the early articles had
          no sources.
        </>
      }
    >
      <Plot
        height={BOTTOM + FOOT}
        label={`Share of new paragraphs born with an inline reference, ${years[0].year} to ${partial.year}`}
        className="pl-9"
      >
        <text
          x="0"
          y={TOP - 14}
          className="fill-ink-faint text-[10px] tracking-wide uppercase"
        >
          Born with an inline reference
        </text>
        <Rules
          ticks={[0.25, 0.5, 0.75, 1]}
          y={y}
          format={(tick) => percent(tick)}
        />

        {years.map((row, index) => (
          <rect
            key={row.year}
            x={across(index * BAND + BAND * 0.2)}
            y={y(row.share)}
            width={across(BAND * 0.6)}
            height={BOTTOM - y(row.share)}
            className={
              row === partial
                ? "fill-paper-sunk stroke-ink-faint"
                : "fill-ink-soft"
            }
          >
            <title>
              {`${row.year}: ${number(row.born)} of ${number(row.paragraphs)} new paragraphs, ${percent(row.share, 2)}`}
            </title>
          </rect>
        ))}

        {marked.map((row) => (
          <text
            key={row.year}
            x={across(middle(years.indexOf(row)))}
            y={y(row.share)}
            dy={-5}
            textAnchor="middle"
            strokeWidth={4}
            paintOrder="stroke"
            className="fill-ink stroke-paper-raised text-[10px] tabular-nums"
          >
            {percent(row.share, 1)}
          </text>
        ))}

        <line
          x1="0"
          x2="100%"
          y1={BOTTOM}
          y2={BOTTOM}
          className="stroke-ink-faint"
        />
        {years.map(
          (row, index) =>
            (row.year % 4 === 0 || row === partial) && (
              <text
                key={row.year}
                x={across(middle(index))}
                y={BOTTOM + 16}
                textAnchor="middle"
                className={`text-[10px] tabular-nums ${
                  row === partial ? "fill-rubric font-medium" : "fill-ink-faint"
                } ${row.year === 2024 ? "max-sm:hidden" : ""}`}
              >
                {row.year}
              </text>
            ),
        )}
      </Plot>
    </Figure>
  );
}

/** The lab's three readings, as the audit file spells them. */
const VERDICTS: Record<string, { name: string; chip: string; fill: string }> = {
  "claim was updated with new information": {
    name: "The claim itself changed in the edit",
    chip: "claim changed",
    fill: "fill-ink-faint",
  },
  "later better source for an old true claim": {
    name: "Probably a later source for an old claim",
    chip: "later source",
    fill: "fill-ink-soft",
  },
  "possible circular sourcing worth a human look": {
    name: "Needs a human to look",
    chip: "needs a human",
    fill: "fill-gold",
  },
};

/** The fifteen longest waits among the candidates, read one by one. */
export function Audit() {
  const parts = Object.entries(VERDICTS).map(([verdict, { name, fill }]) => ({
    name,
    count: audit.filter((row) => row.verdict === verdict).length,
    className: fill,
  }));

  return (
    <Figure
      title={`Claims older than the first source they cite · the ${audit.length} longest waits of ${sourcing.candidates} candidates, read one by one`}
      read={
        <>
          Each of the {audit.length} is a paragraph whose first reference was
          published after the paragraph was first seen, by the year the citation
          template gives. The readings compare the wording before and after the
          reference arrived. They are the lab’s own, by a research agent, not an
          independent editor’s, and “probably a later source” is provisional:
          the outside publications were mostly not read.
        </>
      }
    >
      <Shares
        label={`What the ${audit.length} longest waits turned out to be`}
        shares={false}
        parts={[
          ...parts,
          {
            name: "Confirmed circular sourcing",
            count: sourcing.confirmedCircular,
            className: "fill-removed",
          },
        ]}
      />

      <ol className="mt-5 gap-x-10 border-t border-rule md:columns-2">
        {audit.map((row) => (
          <li
            key={row.rank}
            className="flex break-inside-avoid items-baseline gap-3 border-b border-rule py-1.5"
          >
            <span className="w-4 shrink-0 text-right text-xs text-ink-faint tabular-nums">
              {row.rank}
            </span>
            <span className="min-w-0 flex-1 truncate font-serif text-[15px]">
              {row.article}
            </span>
            <span className="shrink-0 text-xs text-ink-faint tabular-nums max-sm:hidden">
              {number(Math.round(row.waitDays))} days
            </span>
            <span
              className={`shrink-0 rounded-sm bg-paper-sunk px-1.5 py-px text-[10px] tracking-wide uppercase ${
                VERDICTS[row.verdict]?.fill === "fill-gold"
                  ? "text-gold"
                  : "text-ink-soft"
              }`}
            >
              {VERDICTS[row.verdict]?.chip ?? row.verdict}
            </span>
          </li>
        ))}
      </ol>
    </Figure>
  );
}
