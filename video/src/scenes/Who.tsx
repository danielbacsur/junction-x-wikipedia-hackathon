import { AbsoluteFill } from "remotion";

import {
  Label,
  Shell,
  expo,
  inOut,
  pop,
  ramp,
  rise,
  track,
  useT,
} from "../lib";
import { dark, mono, serif } from "../theme";
import { cue, scene } from "../timeline";

const LEFT = 260;
const WIDE = 1400;

/**
 * The three stretches this wording stood for, in days, from the history
 * rows of the passage table: 15 Sep 2007 to 22 Aug 2009.
 */
const STAYS = [118.14, 297.86, 290.8];
const WHOLE = STAYS.reduce((sum, days) => sum + days, 0);
const GAP = 16;

const clock = (seconds: number) => {
  const whole = Math.round(seconds);
  const two = (n: number) => String(n).padStart(2, "0");

  return `${two(Math.floor(whole / 3600))}:${two(
    Math.floor((whole % 3600) / 60),
  )}:${two(whole % 60)}`;
};

const REMOVED = 18 * 3600 + 43 * 60 + 29;
const RESTORED = 18 * 3600 + 45 * 60 + 24;

export function Who() {
  const t = useT();
  const { duration } = scene("who");
  const deleted = cue("who", "deleted");
  const later = cue("who", "two");
  const back = cue("who", "back");

  const gone = t >= deleted && t < back;
  const strike = ramp(t, deleted, 0.35, expo) * (1 - ramp(t, back, 0.25));
  const restored = ramp(t, back, 0.35, expo);
  const now = track(t, [later, back], [REMOVED, RESTORED], inOut);
  const tone = gone ? dark.removed : t >= back ? dark.added : dark.rule;

  // Each stretch of the bar draws when its part of the story is told.
  const drawn = [
    ramp(t, 0.7, 0.9, inOut),
    ramp(t, back + 0.05, 0.45, inOut),
    ramp(t, back + 0.5, 0.45, inOut),
  ];
  const usable = WIDE - GAP * 2;
  let edge = LEFT;
  const bars = STAYS.map((days, index) => {
    const from = edge;
    const wide = (days / WHOLE) * usable;

    edge = from + wide + GAP;

    return { from, wide, drawn: drawn[index] };
  });

  return (
    <Shell duration={duration}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: LEFT,
            top: 104,
            ...rise(t, 0.1),
          }}
        >
          <Label>The life of one paragraph</Label>
          <div
            style={{
              marginTop: 10,
              fontFamily: serif,
              fontSize: 70,
              color: dark.ink,
            }}
          >
            Who changed what, to the second.
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: LEFT,
            top: 300,
            width: WIDE,
            boxSizing: "border-box",
            borderRadius: 24,
            border: `2px solid ${tone}`,
            background: gone
              ? dark.removedWash
              : restored > 0 && restored < 1
                ? dark.addedWash
                : dark.raised,
            padding: "40px 48px 34px",
            boxShadow:
              t >= back
                ? `0 0 ${80 * (1 - ramp(t, back, 0.9))}px ${dark.added}`
                : "none",
            transform: `translateX(${
              t >= deleted && t < deleted + 0.3
                ? Math.sin((t - deleted) * 70) * 10 * (1 - (t - deleted) / 0.3)
                : 0
            }px)`,
            ...rise(t, 0.25, 40),
          }}
        >
          <div
            style={{
              fontFamily: serif,
              fontSize: 44,
              lineHeight: 1.34,
              color: gone ? dark.removed : dark.ink,
              textDecoration: strike > 0.05 ? "line-through" : "none",
              textDecorationColor: `rgba(224,138,120,${strike})`,
              textDecorationThickness: 4,
              opacity: 1 - strike * 0.45,
            }}
          >
            Suomalaisten tappiot talvisodassa olivat 26 600 sotatoimissa
            menehtynyttä ja noin 1 000 siviiliä.
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: serif,
              fontStyle: "italic",
              fontSize: 28,
              color: dark.faint,
            }}
          >
            Finnish losses in the Winter War were 26 600 killed in action and
            about 1 000 civilians.
          </div>
          <div
            style={{
              marginTop: 22,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: mono,
              fontSize: 21,
              color: dark.faint,
            }}
          >
            <span>written 15 Sep 2007 by Myllyre</span>
            <span>Talvisota · fi.wikipedia.org</span>
          </div>
        </div>

        {/* The moment it was taken out, and the moment it came back. */}
        <div
          style={{
            position: "absolute",
            left: LEFT,
            top: 632,
            width: WIDE,
            display: "flex",
            alignItems: "center",
            gap: 36,
            opacity: ramp(t, deleted, 0.25),
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontWeight: 500,
              fontSize: 118,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              color: t >= back ? dark.added : dark.removed,
              transform: `scale(${0.8 + pop(t, deleted, 11) * 0.2})`,
              transformOrigin: "0 50%",
            }}
          >
            {clock(now)}
          </div>
          <div>
            <div
              style={{
                fontFamily: serif,
                fontSize: 52,
                lineHeight: 1.1,
                color: t >= back ? dark.added : dark.removed,
              }}
            >
              {t >= back ? "restored" : "removed"}
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: mono,
                fontSize: 24,
                color: dark.faint,
              }}
            >
              11 January 2008
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontFamily: mono,
              fontSize: 24,
              color: dark.soft,
              textAlign: "right",
              opacity: ramp(t, back + 0.6, 0.4),
            }}
          >
            3 stretches · 707 days
            <div style={{ color: dark.faint, marginTop: 6 }}>
              each one a history row in MariaDB
            </div>
          </div>
        </div>

        {/* Its whole life as a bar, broken where it was taken out. */}
        <div style={{ ...rise(t, 0.5, 20) }}>
          {bars.map((bar, index) => (
            <div key={index}>
              <div
                style={{
                  position: "absolute",
                  left: bar.from,
                  top: 850,
                  width: bar.wide,
                  height: 26,
                  borderRadius: 8,
                  background: dark.rule,
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: bar.from,
                  top: 850,
                  width: bar.wide * bar.drawn,
                  height: 26,
                  borderRadius: 8,
                  background: dark.added,
                  boxShadow: `0 0 26px ${dark.added}66`,
                }}
              />
            </div>
          ))}

          <div
            style={{
              position: "absolute",
              left: bars[0].from + bars[0].wide + GAP / 2 - 3,
              top: 834,
              width: 6,
              height: 58,
              borderRadius: 4,
              background: dark.removed,
              opacity: ramp(t, deleted, 0.2),
              boxShadow: `0 0 ${gone ? 40 : 14}px ${dark.removed}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: bars[1].from + bars[1].wide + GAP / 2 - 3,
              top: 834,
              width: 6,
              height: 58,
              borderRadius: 4,
              background: dark.removed,
              opacity: ramp(t, back + 0.5, 0.2),
            }}
          />

          {[
            { x: bars[0].from, text: "15 Sep 2007", align: "left" as const },
            {
              x: bars[1].from - GAP / 2,
              text: "11 Jan 2008",
              align: "center" as const,
            },
            {
              x: bars[2].from - GAP / 2,
              text: "4 Nov 2008",
              align: "center" as const,
            },
            { x: LEFT + WIDE, text: "22 Aug 2009", align: "right" as const },
          ].map((mark) => (
            <div
              key={mark.text}
              style={{
                position: "absolute",
                left:
                  mark.align === "left"
                    ? mark.x
                    : mark.align === "right"
                      ? mark.x - 200
                      : mark.x - 100,
                width: 200,
                top: 904,
                textAlign: mark.align,
                fontFamily: mono,
                fontSize: 20,
                color: dark.faint,
              }}
            >
              {mark.text}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </Shell>
  );
}
