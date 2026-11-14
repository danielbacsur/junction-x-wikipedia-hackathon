import { day } from "@/lib/format";

import { Figure, Plot } from "./chart";
import { article, latestSnapshot, when } from "./data";
import { across } from "./format";

const FROM = 2003.5;
const TO = when(latestSnapshot);

const at = (moment: string) => (when(moment) - FROM) / (TO - FROM);

const BAR = 12;
const OPENING = 50;
const INFOBOX = 142;
const AXIS = 190;

function Stretch({
  from,
  to,
  y,
  className,
}: {
  from: string;
  to: string;
  y: number;
  className: string;
}) {
  return (
    <rect
      x={across(at(from))}
      y={y}
      width={across(at(to) - at(from))}
      height={BAR}
      className={className}
    />
  );
}

const number = (value: number) => Math.round(value).toLocaleString("en");

/** Wikitext links as their labels, bold kept as bold. */
function Lead({ wikitext }: { wikitext: string }) {
  const parts = wikitext
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .split("'''");

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 0 ? (
          part
        ) : (
          <b key={index} className="font-medium text-ink">
            {part}
          </b>
        ),
      )}
    </>
  );
}

/**
 * The article on the war itself: the name it opens with and the side its
 * infobox lists first, over its whole life.
 */
export function MainArticle() {
  const { civil, warOf1918, noInfobox, reds, whites, lead2004 } = article;

  // The opening sentence gives the war one name and then lists the others.
  const otherNames = (lead2004.lead_text.split("'''").length - 1) / 2 - 1;

  return (
    <Figure
      title={`The article ${article.title} · all ${article.versions.toLocaleString("en")} versions`}
      read={
        <>
          Each bar runs from the first to the last version with that opening
          name or that first belligerent. Versions that broke the run for
          minutes are not drawn: the day counts in the labels are the summed
          lifetimes of the versions and leave them out.
        </>
      }
    >
      <Plot
        height={AXIS + 22}
        label="The opening name and the first belligerent of the article, 2003 to 2026"
      >
        <g className="stroke-ink-faint">
          {[2005, 2010, 2015, 2020, 2025].map((year) => (
            <line
              key={year}
              x1={across(at(`${year}-01-01`))}
              x2={across(at(`${year}-01-01`))}
              y1={AXIS}
              y2={AXIS + 4}
            />
          ))}
        </g>

        <text
          x="0"
          y={OPENING - 36}
          className="fill-ink-faint text-[10px] tracking-wide uppercase"
        >
          Opens as
        </text>
        <Stretch
          from={civil.first_seen}
          to={warOf1918.first_seen}
          y={OPENING}
          className="fill-ink-soft"
        />
        <Stretch
          from={warOf1918.first_seen}
          to={warOf1918.last_seen}
          y={OPENING}
          className="fill-gold"
        />
        <Stretch
          from={warOf1918.last_seen}
          to={civil.last_seen}
          y={OPENING}
          className="fill-ink-soft"
        />
        <text
          x={across(at(warOf1918.first_seen))}
          y={OPENING - 7}
          className="fill-gold text-[11px] font-medium"
        >
          Suomen vuoden 1918 sota
          <tspan className="font-normal tabular-nums">
            {" "}
            · {number(warOf1918.days)} days
          </tspan>
        </text>
        <text
          x={across(at(warOf1918.last_seen))}
          y={OPENING + BAR + 15}
          className="fill-ink-soft text-[11px]"
        >
          Suomen sisällissota
          <tspan className="fill-ink-faint tabular-nums">
            {" "}
            · since {day(warOf1918.last_seen)}
          </tspan>
        </text>

        <text
          x="0"
          y={INFOBOX - 36}
          className="fill-ink-faint text-[10px] tracking-wide uppercase"
        >
          Infobox lists first
        </text>
        <Stretch
          from={noInfobox.first_seen}
          to={reds.first_seen}
          y={INFOBOX}
          className="fill-paper-sunk stroke-rule"
        />
        <Stretch
          from={reds.first_seen}
          to={reds.last_seen}
          y={INFOBOX}
          className="fill-removed"
        />
        <Stretch
          from={whites.first_seen}
          to={whites.last_seen}
          y={INFOBOX}
          className="fill-paper stroke-ink-soft"
        />
        <text
          x={across(at(reds.first_seen))}
          y={INFOBOX - 7}
          className="fill-removed text-[11px] font-medium"
        >
          the Reds
          <tspan className="font-normal tabular-nums max-sm:hidden">
            {" "}
            · {number(reds.days)} days
          </tspan>
        </text>
        <text
          x={across(at(whites.first_seen))}
          y={INFOBOX - 7}
          className="fill-ink text-[11px] font-medium"
        >
          the Whites
          <tspan className="fill-ink-faint font-normal tabular-nums">
            {" "}
            · {number(whites.days)} days
          </tspan>
        </text>
        <text
          x={across(at(noInfobox.first_seen))}
          y={INFOBOX + BAR + 15}
          className="fill-ink-faint text-[11px]"
        >
          no infobox
        </text>
        <text
          x={across(at(whites.first_seen))}
          y={INFOBOX + BAR + 15}
          className="fill-rubric text-[11px] tabular-nums"
        >
          {day(whites.first_seen)}
        </text>

        <line
          x1="0"
          x2="100%"
          y1={AXIS}
          y2={AXIS}
          className="stroke-ink-faint"
        />
        {[2005, 2010, 2015, 2020, 2025].map((year) => (
          <text
            key={year}
            x={across(at(`${year}-01-01`))}
            y={AXIS + 16}
            textAnchor="middle"
            className={`fill-ink-faint text-[10px] tabular-nums ${
              year === 2025 ? "max-sm:hidden" : ""
            }`}
          >
            {year}
          </text>
        ))}
        <text
          x="100%"
          y={AXIS + 16}
          textAnchor="end"
          className="fill-rubric text-[10px] font-medium tabular-nums"
        >
          {day(latestSnapshot)}
        </text>
      </Plot>

      <blockquote className="mt-5 border-l-2 border-rule pl-4">
        <p className="font-serif text-[15px] leading-relaxed text-ink-soft">
          <Lead wikitext={lead2004.lead_text} />
        </p>
        <footer className="mt-1.5 text-xs text-ink-faint">
          The opening sentence as of {day(lead2004.as_of)}, revision{" "}
          <span className="font-mono">{lead2004.rev_id}</span>. After its own
          name it lists {otherNames} others, the last of them “the events of
          1918”, which it calls the most neutral.
        </footer>
      </blockquote>
    </Figure>
  );
}
