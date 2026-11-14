import {
  Figure,
  Plot,
  Readings,
  Rules,
  Stretch,
  along,
  path,
  spread,
} from "./chart";
import { names } from "./data";
import { across, percent } from "./format";

const TOP = 14;
const TALL = 300;
const FOOT = 26;

const y = (share: number) => TOP + (1 - share) * TALL;

type Reading = (typeof names)[number];

const LINES: {
  name: string;
  count: (reading: Reading) => number;
  stroke: string;
  fill: string;
  width: number;
}[] = [
  {
    name: "sisällissota",
    count: (reading) => reading.sisallissota,
    stroke: "stroke-ink",
    fill: "fill-ink",
    width: 2,
  },
  {
    name: "vapaussota",
    count: (reading) => reading.vapaussota,
    stroke: "stroke-rubric",
    fill: "fill-rubric",
    width: 2,
  },
  {
    name: "kansalaissota",
    count: (reading) => reading.kansalaissota,
    stroke: "stroke-gold",
    fill: "fill-gold",
    width: 1.5,
  },
  {
    name: "three others",
    count: (reading) => reading.others,
    stroke: "stroke-ink-faint",
    fill: "fill-ink-faint",
    width: 1.5,
  },
];

const share = (line: (typeof LINES)[number], reading: Reading) =>
  line.count(reading) / reading.total;

/** The highest and lowest readings of a line, which get their value written. */
const extreme = (
  line: (typeof LINES)[number],
  pick: (a: number, b: number) => boolean,
  from = 0,
) =>
  names
    .slice(from)
    .reduce((best, reading) =>
      pick(share(line, reading), share(line, best)) ? reading : best,
    );

/**
 * What the 1918 war is called in running text, at each of the 23 readings.
 * The names are written at the end of their lines, not in a legend.
 */
export function WarNames() {
  const last = names[names.length - 1];
  const [civil, white] = LINES;

  const ends = spread(
    LINES.map((line) => ({ line, y: y(share(line, last)) })),
    14,
    TOP + TALL - 5,
  );

  const whitePeak = extreme(white, (a, b) => a > b);
  const whiteLow = extreme(white, (a, b) => a < b, names.indexOf(whitePeak));
  const civilPeak = extreme(civil, (a, b) => a > b);

  const notes = [
    { line: civil, reading: names[0], dy: -9, anchor: "start" as const },
    { line: civil, reading: civilPeak, dy: -9, anchor: "middle" as const },
    { line: white, reading: whitePeak, dy: -9, anchor: "middle" as const },
    { line: white, reading: whiteLow, dy: -9, anchor: "middle" as const },
  ];

  return (
    <Figure
      title="Share of running-text mentions of the war, by name · articles as they stood at 23 dates"
      read={
        <>
          Each point is every article as it stood at the end of a year (the last
          on 1 October 2026), and the four lines add up to 100 %. Sisällissota
          is civil war, vapaussota war of liberation (the White name),
          kansalaissota citizens’ war. The three others are luokkasota (class
          war), veljessota (war of brothers) and punakapina (red rebellion).
        </>
      }
    >
      <Plot
        height={TOP + TALL + FOOT}
        label={`Share of mentions by name of the 1918 war, ${names[0].date} to ${last.date}`}
        className="pr-[7.4rem] pl-9 sm:pr-44"
      >
        <Rules
          ticks={[0.25, 0.5, 0.75, 1]}
          y={y}
          format={(tick) => percent(tick)}
        />

        <Stretch height={TOP + TALL + FOOT}>
          {LINES.map((line) => (
            <polyline
              key={line.name}
              points={path(
                names.map((reading) => ({
                  x: along(reading.date),
                  y: y(share(line, reading)),
                })),
              )}
              fill="none"
              strokeWidth={line.width}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={line.stroke}
            />
          ))}
        </Stretch>

        {LINES.map((line) =>
          names.map((reading) => (
            <circle
              key={`${line.name} ${reading.date}`}
              cx={across(along(reading.date))}
              cy={y(share(line, reading))}
              r={line.width}
              className={line.fill}
            >
              <title>
                {`${line.name}, ${reading.date}: ${line.count(reading)} of ${reading.total} mentions`}
              </title>
            </circle>
          )),
        )}

        {notes.map(({ line, reading, dy, anchor }) => (
          <text
            key={`${line.name} ${reading.date}`}
            x={across(along(reading.date))}
            y={y(share(line, reading))}
            dy={dy}
            textAnchor={anchor}
            strokeWidth={4}
            paintOrder="stroke"
            className={`stroke-paper-raised text-[10px] tabular-nums ${line.fill}`}
          >
            {percent(share(line, reading), 1)}
          </text>
        ))}

        {ends.map(({ line, at }) => (
          <text
            key={line.name}
            x="100%"
            dx={8}
            y={at}
            dominantBaseline="central"
            className={`text-[11px] ${line.fill}`}
          >
            <tspan className="font-medium">{line.name}</tspan>
            <tspan dx={5} className="tabular-nums">
              {percent(share(line, last), 1)}
            </tspan>
          </text>
        ))}

        <Readings y={TOP + TALL} />
      </Plot>
    </Figure>
  );
}
