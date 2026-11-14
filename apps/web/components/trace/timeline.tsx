"use client";

import { FIRST_YEAR, LAST_YEAR, LATEST, day, span } from "@/lib/format";

import { type Group, type Placed, along, moment } from "./arrange";

/** Heights in pixels. Widths are percentages, so nothing has to be measured. */
const TOP = 22;
const HEAD = 24;
const ROW = 20;
const FOOT = 24;
const GUTTER = 24;

const percent = (value: number) => `${value.toFixed(3)}%`;

const yearAt = (year: number) => along(Date.UTC(year, 0, 1));

/** Where each article's name and each wording's line sit, top to bottom. */
const layOut = (groups: Group[]) => {
  let y = TOP;

  const heads: { group: Group; y: number }[] = [];
  const rows: { placed: Placed; y: number }[] = [];
  const middle = new Map<string, number>();

  for (const group of groups) {
    heads.push({ group, y });
    y += HEAD;

    for (const placed of group.placed) {
      rows.push({ placed, y });
      middle.set(placed.key, y + ROW / 2);
      y += ROW;
    }
  }

  return { heads, rows, middle, bottom: y + 6 };
};

function Swatch({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="27"
      height="12"
      aria-hidden
      className="mr-1.5 inline-block align-[-2px]"
    >
      {children}
    </svg>
  );
}

/**
 * Every wording on one line of time, from 2003 to the last edit in the
 * dataset. A line starts the day the wording was written and ends the day
 * it left the article; the positions come straight from those timestamps.
 */
export function Timeline({
  groups,
  earliest,
  lit,
  onLight,
}: {
  groups: Group[];

  /** The key of the wording that appeared first. */
  earliest: string | null;
  lit: string | null;
  onLight: (key: string | null) => void;
}) {
  const { heads, rows, middle, bottom } = layOut(groups);

  const years = [];
  for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) years.push(year);

  const all = rows.map((row) => row.placed);
  const first = all.find((placed) => placed.key === earliest);
  const read = all.find((placed) => placed.key === lit) ?? first;
  const firstAt = first ? along(first.from) : 0;
  const litAt = lit ? middle.get(lit) : undefined;

  return (
    <figure
      aria-label={`When each wording stood, from ${FIRST_YEAR} to ${day(null)}`}
      className="rounded border border-rule bg-paper-raised p-4"
    >
      {/* The numbers hang in this gutter, left of where 2003 begins. */}
      <div style={{ paddingLeft: GUTTER }}>
        <svg
          width="100%"
          height={bottom + FOOT}
          className="block overflow-visible"
        >
          {litAt !== undefined && (
            <g className="fill-paper-sunk">
              <rect
                x={-GUTTER}
                y={litAt - ROW / 2}
                width={GUTTER}
                height={ROW}
              />
              <rect x="0" y={litAt - ROW / 2} width="100%" height={ROW} />
            </g>
          )}

          <g className="stroke-rule">
            {years
              .filter((year) => year % 5 === 0)
              .map((year) => (
                <line
                  key={year}
                  x1={percent(yearAt(year))}
                  x2={percent(yearAt(year))}
                  y1={TOP}
                  y2={bottom}
                />
              ))}
            <line x1="100%" x2="100%" y1={TOP} y2={bottom} />
          </g>

          {/* Time is red: nothing close to the claim is older than this. */}
          {first && (
            <g className="rise">
              <line
                x1={percent(firstAt)}
                x2={percent(firstAt)}
                y1={2}
                y2={bottom}
                className="stroke-rubric"
              />
              <text
                x={percent(firstAt)}
                y={12}
                dx={firstAt > 60 ? -6 : 6}
                textAnchor={firstAt > 60 ? "end" : "start"}
                className="fill-rubric text-[11px] font-medium tabular-nums"
              >
                earliest found {day(first.trace.firstSeen)}
              </text>
            </g>
          )}

          {/* Our reading, so dotted: wordings we take for one paragraph. */}
          <g className="stroke-ink-faint" strokeDasharray="2 2">
            {all.map(
              (placed) =>
                placed.before && (
                  <g key={placed.key}>
                    {placed.before.to < placed.from && (
                      <line
                        x1={percent(along(placed.before.to))}
                        x2={percent(along(placed.from))}
                        y1={middle.get(placed.before.key)}
                        y2={middle.get(placed.before.key)}
                      />
                    )}
                    <line
                      x1={percent(along(placed.from))}
                      x2={percent(along(placed.from))}
                      y1={middle.get(placed.before.key)}
                      y2={middle.get(placed.key)}
                    />
                  </g>
                ),
            )}
          </g>

          {/* The paper-coloured stroke keeps a name clear of the lines under it. */}
          {heads.map(({ group, y }) => (
            <text
              key={group.pageId}
              x="0"
              y={y + HEAD - 8}
              strokeWidth={5}
              paintOrder="stroke"
              className="fill-ink-soft stroke-paper-raised text-[11px] font-medium"
            >
              {group.title}
            </text>
          ))}

          {rows.map(({ placed, y }) => {
            const { trace } = placed;
            const from = along(placed.from);
            const to = along(placed.to);
            const mid = y + ROW / 2;
            const fill = trace.alive ? "fill-added" : "fill-ink";
            const stroke = trace.alive ? "stroke-added" : "stroke-ink";

            return (
              <a
                key={placed.key}
                href={`#w-${placed.key}`}
                aria-label={`Wording ${placed.n} in ${trace.title}: ${day(trace.firstSeen)} to ${
                  trace.lastSeen ? day(trace.lastSeen) : "still standing"
                }`}
                onMouseEnter={() => onLight(placed.key)}
                onMouseLeave={() => onLight(null)}
                onFocus={() => onLight(placed.key)}
                onBlur={() => onLight(null)}
                className="rise"
              >
                {/* The whole row answers the pointer, not just a thin line. */}
                <g className="fill-transparent">
                  <rect x={-GUTTER} y={y} width={GUTTER} height={ROW} />
                  <rect x="0" y={y} width="100%" height={ROW} />
                </g>

                <text
                  x={-9}
                  y={mid}
                  textAnchor="end"
                  dominantBaseline="central"
                  className={`text-[10px] tabular-nums ${
                    lit === placed.key
                      ? "fill-rubric font-medium"
                      : "fill-ink-faint"
                  }`}
                >
                  {placed.n}
                </text>

                <rect
                  x={percent(from)}
                  y={mid - 2.5}
                  width={percent(to - from)}
                  height={5}
                  className={
                    placed.onAndOff ? `fill-paper-raised ${stroke}` : fill
                  }
                />
                {/* A wording that came and went: the outline spans first to
                    last, and each stretch it really stood is filled in. */}
                {placed.onAndOff &&
                  trace.lifetimes.map((stay) => {
                    const start = along(moment(stay.from));
                    const end = along(moment(stay.to ?? LATEST));

                    return (
                      <rect
                        key={stay.from}
                        x={percent(start)}
                        y={mid - 2.5}
                        width={percent(Math.max(end - start, 0.0015))}
                        height={5}
                        className={fill}
                      />
                    );
                  })}
                <circle cx={percent(from)} cy={mid} r={3} className={fill} />
                {!trace.alive && (
                  <line
                    x1={percent(to)}
                    x2={percent(to)}
                    y1={mid - 6}
                    y2={mid + 6}
                    strokeWidth={1.5}
                    className="stroke-ink"
                  />
                )}
              </a>
            );
          })}

          <g className="stroke-ink-faint">
            <line x1="0" x2="100%" y1={bottom} y2={bottom} />
            {years.map((year) => (
              <line
                key={year}
                x1={percent(yearAt(year))}
                x2={percent(yearAt(year))}
                y1={bottom}
                y2={bottom + (year % 5 === 0 ? 5 : 3)}
              />
            ))}
          </g>

          {years
            .filter((year) => year % 5 === 0 || year === FIRST_YEAR)
            .map((year) => (
              <text
                key={year}
                x={percent(yearAt(year))}
                y={bottom + 18}
                textAnchor={year === FIRST_YEAR ? "start" : "middle"}
                className={`fill-ink-faint text-[10px] tabular-nums ${
                  // On a phone the two ends of the line crowd their neighbours.
                  year === FIRST_YEAR || year === 2025 ? "max-sm:hidden" : ""
                }`}
              >
                {year}
              </text>
            ))}
          <text
            x="100%"
            y={bottom + 18}
            textAnchor="end"
            className="fill-rubric text-[10px] font-medium tabular-nums"
          >
            {day(null)}
          </text>
        </svg>
      </div>

      {read && (
        <figcaption className="mt-3 border-t border-rule pt-3 text-xs text-ink-faint">
          <p className="line-clamp-2 text-ink-soft tabular-nums sm:line-clamp-1">
            <span className="mr-2 font-medium text-rubric">{read.n}</span>
            {day(read.trace.firstSeen)} to{" "}
            {read.trace.lastSeen
              ? day(read.trace.lastSeen)
              : `${day(null)}, still standing`}
            <span className="mx-2 text-ink-faint">·</span>
            stood {span(read.trace.days)}
            <span className="mx-2 text-ink-faint">·</span>
            <span className="font-serif text-[13px]">{read.trace.text}</span>
          </p>

          <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <span>
              <Swatch>
                <rect
                  x="3"
                  y="3.5"
                  width="20"
                  height="5"
                  className="fill-ink"
                />
                <circle cx="3" cy="6" r="3" className="fill-ink" />
                <line
                  x1="23"
                  x2="23"
                  y1="0"
                  y2="12"
                  strokeWidth="1.5"
                  className="stroke-ink"
                />
              </Swatch>
              written, stood, removed
            </span>
            <span>
              <Swatch>
                <rect
                  x="3"
                  y="3.5"
                  width="24"
                  height="5"
                  className="fill-added"
                />
                <circle cx="3" cy="6" r="3" className="fill-added" />
              </Swatch>
              still stands on {day(null)}, the latest in the dataset
            </span>
            {all.some((placed) => placed.onAndOff) && (
              <span>
                <Swatch>
                  <rect
                    x="3"
                    y="3.5"
                    width="20"
                    height="5"
                    className="fill-paper-raised stroke-ink"
                  />
                  <circle cx="3" cy="6" r="3" className="fill-ink" />
                </Swatch>
                came and went: filled where it stood
              </span>
            )}
            {all.some((placed) => placed.before) && (
              <span>
                <Swatch>
                  <line
                    x1="1"
                    x2="27"
                    y1="6"
                    y2="6"
                    strokeDasharray="2 2"
                    className="stroke-ink-faint"
                  />
                </Swatch>
                the same paragraph reworded, which is our reading
              </span>
            )}
          </p>
        </figcaption>
      )}
    </figure>
  );
}
