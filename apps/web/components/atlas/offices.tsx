import { day, number } from "@/lib/format";

import { Figure, Plot } from "./chart";
import { latestSnapshot, offices, when } from "./data";
import { across, fullDay } from "./format";

const { flip, gaps } = offices;

/* Wikipedia's own time: the infoboxes state terms from 2006 on. */
const FROM = gaps[0].year;
const TO = when(latestSnapshot);

const at = (moment: string | null) =>
  (when(moment ?? latestSnapshot) - FROM) / (TO - FROM);

const BAR = 14;
const ANSWER = 46;
const CELL = 22;
const GAPS = 122;
const AXIS = GAPS + CELL + 12;

const surname = (person: string) => person.split(" ").at(-1);

/** The answer that is given today is ink, the other one gold. */
const today = flip.answers[flip.answers.length - 1].named[0].person;

const tone = (person: string) =>
  person === today
    ? { bar: "fill-ink-soft", text: "fill-ink" }
    : { bar: "fill-gold", text: "fill-gold" };

/**
 * One day of history asked of every Wikipedia since 2006, and the days for
 * which Wikipedia names no president at all.
 */
export function Offices() {
  return (
    <Figure
      title={`Who was president of Finland on ${fullDay(flip.date)}? · the answer of the presidents’ own articles, ${FROM} to ${latestSnapshot.slice(0, 4)}`}
      read={
        <>
          Left to right is Wikipedia’s own time, not the 1920s. The upper bar is
          coloured by whom the articles’ infoboxes named for that one day; the
          red marks are the four moments the query below asks. The lower row is
          every year end: the number of days of history for which no article
          claimed the presidency, as Wikipedia stood then (2026 is 1 October).
          Changes that a revert removed within 30 days are not drawn.
        </>
      }
    >
      <Plot
        height={AXIS + 22}
        label={`Wikipedia’s answer to who was president on ${fullDay(flip.date)}: ${flip.answers.map((answer) => `${answer.named[0].person} from ${day(answer.from)}`).join(", ")}`}
      >
        <text
          x="0"
          y={ANSWER - 36}
          className="fill-ink-faint text-[10px] tracking-wide uppercase"
        >
          The president on {fullDay(flip.date)}, according to Wikipedia
        </text>

        {flip.answers.map((answer) => {
          const { person } = answer.named[0];
          const above = person !== today;

          return (
            <g key={answer.from}>
              <rect
                x={across(at(answer.from))}
                y={ANSWER}
                width={across(at(answer.to) - at(answer.from))}
                height={BAR}
                className={`stroke-paper-raised ${tone(person).bar}`}
              >
                <title>
                  {`${person}: ${answer.from} UTC to ${answer.to ?? "today"}`}
                </title>
              </rect>
              <text
                x={across(at(answer.from))}
                y={above ? ANSWER - 7 : ANSWER + BAR + 15}
                className={`text-[11px] font-medium ${tone(person).text}`}
              >
                {surname(person)}
                <tspan
                  className={`fill-ink-faint font-normal tabular-nums ${
                    // On a phone only the answer that stands has the room.
                    answer.to === null ? "" : "max-sm:hidden"
                  }`}
                >
                  {" · "}
                  {answer.to === null
                    ? `since ${day(answer.from)}`
                    : `${number(Math.round(answer.seconds / 86_400))} days`}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Time is red: the moments FOR SYSTEM_TIME AS OF is asked at. */}
        {flip.asked.map(({ asOf }) => (
          <line
            key={asOf ?? "now"}
            x1={across(at(asOf))}
            x2={across(at(asOf))}
            y1={ANSWER - 4}
            y2={ANSWER + BAR + 4}
            strokeWidth={2}
            className="stroke-rubric"
          />
        ))}

        <text
          x="0"
          y={GAPS - 10}
          className="fill-ink-faint text-[10px] tracking-wide uppercase"
        >
          Days of history with no president named, at each year end
        </text>

        {gaps.map((reading, index) => {
          const from = at(`${reading.year}-01-01`);
          const to =
            index === gaps.length - 1 ? 1 : at(`${reading.year + 1}-01-01`);

          return (
            <g key={reading.year}>
              <rect
                x={across(from)}
                y={GAPS}
                width={across(to - from)}
                height={CELL}
                className={`stroke-paper-raised ${
                  reading.days ? "fill-removed-wash" : "fill-paper-sunk"
                }`}
              >
                <title>
                  {`End of ${reading.year}: ${reading.days} days at ${reading.handovers} handovers`}
                </title>
              </rect>
              <text
                x={across((from + to) / 2)}
                y={GAPS + CELL / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className={`text-[10px] tabular-nums ${
                  reading.days ? "fill-removed font-medium" : "fill-ink-faint"
                }`}
              >
                {reading.days}
              </text>
            </g>
          );
        })}

        <line
          x1="0"
          x2="100%"
          y1={AXIS}
          y2={AXIS}
          className="stroke-ink-faint"
        />
        {gaps
          .filter((reading) => reading.year % 4 === 2 && reading.year < TO - 1)
          .map((reading) => (
            <g key={reading.year}>
              <line
                x1={across(at(`${reading.year}-01-01`))}
                x2={across(at(`${reading.year}-01-01`))}
                y1={AXIS}
                y2={AXIS + 4}
                className="stroke-ink-faint"
              />
              <text
                x={across(at(`${reading.year}-01-01`))}
                y={AXIS + 16}
                textAnchor={reading.year === FROM ? "start" : "middle"}
                className="fill-ink-faint text-[10px] tabular-nums"
              >
                {reading.year}
              </text>
            </g>
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

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4 lg:grid-cols-4">
        {flip.asked.map(({ asOf, answer }) => (
          <div key={asOf ?? "now"}>
            <dt className="text-xs text-ink-faint">
              Wikipedia as of{" "}
              <span className="text-rubric tabular-nums">{day(asOf)}</span>
            </dt>
            <dd className="mt-0.5 font-serif text-xl leading-snug">
              {answer.named[0].person}
            </dd>
            <dd className="text-xs text-ink-faint tabular-nums">
              said since {day(answer.named[0].since)}, revision{" "}
              <span className="font-mono">{answer.named[0].revId}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Figure>
  );
}
