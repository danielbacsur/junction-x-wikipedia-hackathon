import { number } from "@/lib/format";

import { Figure, Plot, Readings, Rules, Stretch, along, path } from "./chart";
import { words } from "./data";
import { across, percent } from "./format";

const TOP = 16;
const TALL = 190;
const FOOT = 26;
const MOST = 0.01;

const y = (share: number) => TOP + (1 - share / MOST) * TALL;

const LINES = [
  {
    name: "Nato",
    series: words.nato,
    stroke: "stroke-ink",
    fill: "fill-ink",
  },
  {
    name: "suomettuminen",
    series: words.suomettuminen,
    stroke: "stroke-gold",
    fill: "fill-gold",
  },
];

/** The share of articles that mention a word at least once, at each reading. */
export function Words() {
  const before = words.nato.find((row) => row.date === "2021-12-31")!;

  return (
    <Figure
      title="Share of articles in which the word occurs at least once · articles as they stood at 23 dates"
      read={
        <>
          Each point is the articles containing the word divided by the articles
          that existed on that date. The scale stops at 1 %: these are small
          numbers of articles. Suomettuminen is Finlandization.
        </>
      }
    >
      <Plot
        height={TOP + TALL + FOOT}
        label="Share of articles mentioning Nato and suomettuminen, 2004 to 2026"
        className="pr-24 pl-11 sm:pr-32"
      >
        <Rules
          ticks={[0.0025, 0.005, 0.0075, 0.01]}
          y={y}
          format={(tick) => percent(tick, 2)}
        />

        <Stretch height={TOP + TALL + FOOT}>
          {LINES.map((line) => (
            <polyline
              key={line.name}
              points={path(
                line.series.map((row) => ({
                  x: along(row.date),
                  y: y(row.share),
                })),
              )}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={line.stroke}
            />
          ))}
        </Stretch>

        {LINES.map((line) =>
          line.series.map((row) => (
            <circle
              key={`${line.name} ${row.date}`}
              cx={across(along(row.date))}
              cy={y(row.share)}
              r={2}
              className={line.fill}
            >
              <title>
                {`${line.name}, ${row.date}: ${row.articles} of ${number(row.total)} articles`}
              </title>
            </circle>
          )),
        )}

        <text
          x={across(along(before.date))}
          y={y(before.share)}
          dy={-10}
          textAnchor="end"
          strokeWidth={4}
          paintOrder="stroke"
          className="fill-ink stroke-paper-raised text-[10px] tabular-nums"
        >
          {before.articles} articles
          <tspan className="max-sm:hidden">, end of 2021</tspan>
        </text>

        {LINES.map((line) => {
          const last = line.series[line.series.length - 1];

          return (
            <text
              key={line.name}
              x="100%"
              y={y(last.share)}
              className={`text-[11px] ${line.fill}`}
            >
              <tspan dx={8} dy={-2} className="font-medium">
                {line.name}
              </tspan>
              <tspan x="100%" dx={8} dy={13} className="tabular-nums">
                {last.articles} · {percent(last.share, 2)}
              </tspan>
            </text>
          );
        })}

        <Readings y={TOP + TALL} />
      </Plot>
    </Figure>
  );
}
