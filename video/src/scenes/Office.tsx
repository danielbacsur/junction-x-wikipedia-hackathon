import { AbsoluteFill } from "remotion";

import { Label, Shell, Swap, Typed, expo, pop, ramp, rise, useT } from "../lib";
import { dark, mono, sans, serif } from "../theme";
import { cue, scene } from "../timeline";

/**
 * Who held the presidency on 1 March 1925 according to the article as it
 * stood at the end of each year, from the bitemporal office table.
 */
const ASKED = [
  {
    tab: "Wikipedia in 2006",
    name: "Lauri Kristian Relander",
    term: "term stated as 1 Mar 1925 to 1 Mar 1931",
  },
  {
    tab: "Wikipedia in 2008",
    name: "K. J. Ståhlberg",
    term: "term stated as 26 Jul 1919 to 2 Mar 1925",
  },
  {
    tab: "Wikipedia in 2012",
    name: "Lauri Kristian Relander",
    term: "term stated as 1 Mar 1925 to 1 Mar 1931",
  },
  {
    tab: "Wikipedia today",
    name: "K. J. Ståhlberg",
    term: "term stated as 25 Jul 1919 to 2 Mar 1925",
  },
];

export function Office() {
  const t = useT();
  const { duration } = scene("office");
  const asking = cue("office", "who");
  const first = cue("office", "1925") + 0.75;
  const turns = [
    first,
    cue("office", "it"),
    cue("office", "which"),
    cue("office", "you"),
  ];
  const active = turns.filter((at) => t >= at).length - 1;
  const opening = 1 - ramp(t, asking - 0.35, 0.3);

  return (
    <Shell duration={duration}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 430,
            textAlign: "center",
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 170,
            letterSpacing: "-0.02em",
            color: dark.ink,
            opacity: ramp(t, 0.25, 0.25) * opening,
            transform: `scale(${0.86 + pop(t, 0.25, 13) * 0.14 + (1 - opening) * 0.08})`,
            filter: `blur(${(1 - opening) * 14}px)`,
          }}
        >
          Even facts move.
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 150,
            textAlign: "center",
            opacity: ramp(t, asking - 0.1, 0.2),
          }}
        >
          <Label>One question, four years of Wikipedia</Label>
          <div
            style={{
              marginTop: 22,
              fontFamily: serif,
              fontSize: 84,
              lineHeight: 1.1,
              color: dark.ink,
            }}
          >
            <Typed
              text="Who was president on 1 March 1925?"
              from={asking}
              until={cue("office", "1925") + 0.45}
            />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 240,
            width: 1440,
            top: 420,
            display: "flex",
            gap: 24,
          }}
        >
          {ASKED.map((asked, index) => {
            const on = index === active;

            return (
              <div
                key={asked.tab}
                style={{
                  flex: 1,
                  height: 84,
                  borderRadius: 18,
                  border: `1.5px solid ${on ? dark.rubric : dark.rule}`,
                  background: on ? dark.rubricWash : dark.raised,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 30,
                  color: on ? dark.rubric : dark.faint,
                  boxShadow: on ? `0 0 50px ${dark.rubric}44` : "none",
                  transform: `scale(${on ? 1 + (1 - ramp(t, turns[index], 0.3, expo)) * 0.06 : 1})`,
                  ...(index <= Math.max(active, 0) ? {} : { opacity: 0.75 }),
                  ...rise(t, first - 0.5 + index * 0.07, 24),
                }}
              >
                {asked.tab}
              </div>
            );
          })}
        </div>

        {active >= 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 580,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: serif,
                fontWeight: 500,
                fontSize: 150,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: dark.ink,
                textShadow: "0 0 90px rgba(229,106,80,0.3)",
              }}
            >
              <Swap value={ASKED[active].name} since={turns[active]} />
            </div>
            <div
              style={{
                marginTop: 18,
                fontFamily: mono,
                fontSize: 30,
                color: dark.rubric,
              }}
            >
              <Swap value={ASKED[active].term} since={turns[active]} />
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 916,
            textAlign: "center",
            ...rise(t, turns[1], 20),
          }}
        >
          <Label size={21}>
            One table, two timelines · PERIOD FOR valid_time · WITH SYSTEM
            VERSIONING
          </Label>
        </div>
      </AbsoluteFill>
    </Shell>
  );
}
