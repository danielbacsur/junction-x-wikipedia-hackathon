import { AbsoluteFill } from "remotion";

import {
  Label,
  Shell,
  Swap,
  inOut,
  pop,
  ramp,
  rise,
  track,
  useT,
} from "../lib";
import { dark, mono, serif } from "../theme";
import { cue, scene, spoken } from "../timeline";

/** What the Winter War article said, newest first, from its real history. */
const ERAS = [
  {
    until: 2026.75,
    since: 2009.64,
    figure: "26 662",
    day: "1 Oct 2026",
    words:
      "Suomalaisten tappiot talvisodassa olivat 26 662 sotatoimissa kuollutta ja noin tuhat siviiliä.",
  },
  {
    until: 2009.64,
    since: 2006.74,
    figure: "26 600",
    day: "21 Aug 2009",
    words:
      "Suomalaisten tappiot talvisodassa olivat 26 600 sotatoimissa menehtynyttä ja noin 1 000 siviiliä.",
  },
  {
    until: 2006.74,
    since: 2003.78,
    figure: "22 800",
    day: "13 Oct 2003",
    words:
      "Suomalaisten tappiot nousivat noin 22 800 henkeen, ja Neuvostoliitto ilmoitti menetyksikseen 49 000 miestä.",
  },
];

const LEFT = 260;
const WIDE = 1400;
const FIRST = 2003;
const LAST = 2027;
const place = (year: number) => LEFT + ((year - FIRST) / (LAST - FIRST)) * WIDE;

export function Hook() {
  const t = useT();
  const { duration } = scene("hook");
  const rewind = cue("hook", "but");
  const landed = spoken("hook") - 0.25;

  // The rewind stops for a beat at each edit that changed the figure.
  const beats = [rewind, rewind + 0.85, rewind + 1.6, landed];
  const year = track(t, beats, [2026.75, 2009.64, 2006.74, 2003.78], inOut);
  const changes = [0, beats[1], beats[2]];
  const now = t >= beats[2] ? 2 : t >= beats[1] ? 1 : 0;
  const era = ERAS[now];
  const today = cue("hook", "today");
  const moving = t > rewind && t < landed;

  return (
    <Shell duration={duration}>
      <AbsoluteFill style={{ transform: `scale(${1 + t * 0.009})` }}>
        <div
          style={{
            position: "absolute",
            left: LEFT,
            right: LEFT,
            top: 118,
            display: "flex",
            justifyContent: "space-between",
            ...rise(t, 0.15),
          }}
        >
          <Label>fi.wikipedia.org / Talvisota</Label>
          <Label>The Winter War, 1939 to 1940</Label>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 236,
            textAlign: "center",
            fontFamily: serif,
            fontSize: 60,
            color: dark.soft,
            ...rise(t, 0.3),
          }}
        >
          Finnish losses in the Winter War
        </div>

        {/* Earlier figures stay behind the current one, as on a palimpsest. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 300,
            height: 330,
            transform: `scale(${0.7 + pop(t, 0.45, 14) * 0.3})`,
            opacity: ramp(t, 0.45, 0.3),
          }}
        >
          {ERAS.map((past, index) => {
            const depth = now - index;

            if (depth <= 0) return null;

            const settle = ramp(t, changes[index + 1], 0.5);

            return (
              <div
                key={past.figure}
                style={{
                  position: "absolute",
                  inset: 0,
                  textAlign: "center",
                  fontFamily: serif,
                  fontWeight: 500,
                  fontSize: 290,
                  lineHeight: "330px",
                  letterSpacing: "-0.02em",
                  color: "transparent",
                  WebkitTextStroke: `2px ${dark.rubric}`,
                  opacity: 0.34 / depth,
                  transform: `translate(${settle * 26 * depth}px, ${
                    settle * -22 * depth
                  }px)`,
                }}
              >
                {past.figure}
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              inset: 0,
              textAlign: "center",
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 290,
              lineHeight: "330px",
              letterSpacing: "-0.02em",
              color: dark.ink,
              textShadow: "0 0 90px rgba(229,106,80,0.28)",
            }}
          >
            <Swap value={era.figure} since={changes[now]} />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 300,
            right: 300,
            top: 668,
            textAlign: "center",
            fontFamily: serif,
            fontStyle: "italic",
            fontSize: 30,
            lineHeight: 1.4,
            color: dark.faint,
            ...rise(t, 0.7),
          }}
        >
          <Swap value={`“${era.words}”`} since={changes[now]} />
        </div>

        {/* The ruler of years, and the day the page is read on. */}
        <div style={{ ...rise(t, 0.9, 20) }}>
          <div
            style={{
              position: "absolute",
              left: LEFT,
              width: WIDE,
              top: 902,
              height: 2,
              background: dark.rule,
            }}
          />
          {Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i).map(
            (tick) => (
              <div key={tick}>
                <div
                  style={{
                    position: "absolute",
                    left: place(tick),
                    top: tick % 5 === 0 ? 890 : 896,
                    width: 2,
                    height: tick % 5 === 0 ? 26 : 14,
                    background: tick % 5 === 0 ? dark.faint : dark.rule,
                  }}
                />
                {tick % 5 === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: place(tick) - 40,
                      width: 80,
                      top: 930,
                      textAlign: "center",
                      fontFamily: mono,
                      fontSize: 20,
                      color: dark.faint,
                    }}
                  >
                    {tick}
                  </div>
                )}
              </div>
            ),
          )}

          {[0, 0.2].map((delay) => {
            const p = ramp(t, today + delay, 0.9);

            return p > 0 && p < 1 ? (
              <div
                key={delay}
                style={{
                  position: "absolute",
                  left: place(year) - 60,
                  top: 843,
                  width: 120,
                  height: 120,
                  borderRadius: 120,
                  border: `3px solid ${dark.rubric}`,
                  opacity: 1 - p,
                  transform: `scale(${0.2 + p})`,
                }}
              />
            ) : null;
          })}
          <div
            style={{
              position: "absolute",
              left: place(year) - 2,
              top: 868,
              width: 5,
              height: 70,
              borderRadius: 4,
              background: dark.rubric,
              boxShadow: `0 0 ${moving ? 40 : 18}px ${dark.rubric}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: place(year) - 170,
              width: 340,
              top: 806,
              textAlign: "center",
              fontFamily: mono,
              fontSize: 26,
              letterSpacing: "0.08em",
              color: dark.rubric,
              transform: `scale(${1 + Math.max(0, 1 - Math.abs(t - today - 0.2) / 0.3) * 0.16})`,
            }}
          >
            {moving
              ? Math.floor(year)
              : t <= rewind
                ? "TODAY"
                : era.day.toUpperCase()}
          </div>
        </div>
      </AbsoluteFill>
    </Shell>
  );
}
