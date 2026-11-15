import { AbsoluteFill, random } from "remotion";

import {
  Label,
  Mark,
  Shell,
  expo,
  number,
  pop,
  ramp,
  rise,
  useT,
} from "../lib";
import { dark, sans, serif } from "../theme";
import { cue, scene } from "../timeline";

const BARS = 220;

function Chip({
  at,
  side,
  label,
  name,
  color,
}: {
  at: number;
  side: "left" | "right";
  label: string;
  name: string;
  color: string;
}) {
  const t = useT();
  const p = pop(t, at, 11);

  return (
    <div
      style={{
        position: "absolute",
        top: 842,
        [side]: 470,
        width: 440,
        height: 104,
        borderRadius: 22,
        border: `1.5px solid ${color}`,
        background: dark.raised,
        boxShadow: `0 0 60px ${color}33`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        opacity: Math.min(1, p * 1.4),
        transform: `scale(${0.6 + p * 0.4})`,
      }}
    >
      <Label size={17}>{label}</Label>
      <div
        style={{
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 40,
          color,
        }}
      >
        {name}
      </div>
    </div>
  );
}

export function Title() {
  const t = useT();
  const { duration } = scene("title");
  const named = cue("title", "palimpsest");
  const counting = cue("title", "eight");
  const counted = cue("title", "versions");
  const up = ramp(t, counting - 0.25, 0.6, expo);
  const arrive = pop(t, named, 10);
  const count = ramp(
    t,
    counting,
    counted - counting + 0.15,
    (n) => 1 - (1 - n) ** 3,
  );

  return (
    <Shell duration={duration}>
      <AbsoluteFill>
        {/* Rings spreading from the name as it lands. */}
        {[0, 0.16, 0.32].map((delay) => {
          const p = ramp(t, named + delay, 1.5, expo);

          return (
            <div
              key={delay}
              style={{
                position: "absolute",
                left: 960 - 700,
                top: 500 - 700,
                width: 1400,
                height: 1400,
                borderRadius: 1400,
                border: `2px solid ${dark.rubric}`,
                opacity: (1 - p) * 0.55 * (1 - up),
                transform: `scale(${0.12 + p * 0.95})`,
              }}
            />
          );
        })}

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 380 - up * 262,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 44,
            opacity: Math.min(1, arrive * 1.5),
            transform: `scale(${(0.55 + arrive * 0.45) * (1 - up * 0.56)})`,
          }}
        >
          <Mark size={190} />
          <div style={{ position: "relative" }}>
            {/* The name, written twice before. */}
            {[2, 1].map((depth) => (
              <div
                key={depth}
                style={{
                  position: "absolute",
                  left: depth * 14 * arrive,
                  top: depth * -10 * arrive,
                  fontFamily: serif,
                  fontWeight: 500,
                  fontSize: 230,
                  lineHeight: 1,
                  letterSpacing: "-0.025em",
                  color: "transparent",
                  WebkitTextStroke: `1.5px ${dark.rubric}`,
                  opacity: 0.3 / depth,
                }}
              >
                Palimpsest
              </div>
            ))}
            <div
              style={{
                position: "relative",
                fontFamily: serif,
                fontWeight: 500,
                fontSize: 230,
                lineHeight: 1,
                letterSpacing: "-0.025em",
                color: dark.ink,
              }}
            >
              Palimpsest
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 318,
            textAlign: "center",
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 300,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            color: dark.ink,
            textShadow: "0 0 110px rgba(229,106,80,0.35)",
            ...rise(t, counting - 0.1, 50, 0.45),
          }}
        >
          {number(count * 862_076)}
        </div>

        {/* One bar for each few thousand versions, filling as they are counted. */}
        <div
          style={{
            position: "absolute",
            left: 360,
            width: 1200,
            top: 640,
            height: 70,
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            opacity: ramp(t, counting, 0.3),
          }}
        >
          {Array.from({ length: BARS }, (_, i) => {
            const filled = i / BARS < count;

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 14 + random(`bar-${i}`) * 56,
                  borderRadius: 2,
                  background: filled ? dark.rubric : dark.rule,
                  opacity: filled ? 0.35 + random(`o-${i}`) * 0.65 : 0.5,
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 736,
            textAlign: "center",
            fontFamily: serif,
            fontSize: 58,
            color: dark.soft,
            ...rise(t, counted - 0.05),
          }}
        >
          versions of Wikipedia
        </div>

        <Chip
          at={cue("title", "in")}
          side="left"
          label="kept in"
          name="MariaDB"
          color={dark.gold}
        />
        <Chip
          at={cue("title", "questioned")}
          side="right"
          label="questioned through"
          name="Gemini"
          color={dark.added}
        />
      </AbsoluteFill>
    </Shell>
  );
}
