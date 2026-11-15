import { AbsoluteFill } from "remotion";

import {
  Label,
  Shell,
  Swap,
  expo,
  inOut,
  pop,
  ramp,
  rise,
  track,
  useT,
} from "../lib";
import { dark, mono, sans, serif } from "../theme";
import { cue, scene } from "../timeline";

const CLAIM = "26 662 Finnish soldiers died in the Winter War.";

/** When each wording of the sentence was written, as a year with a fraction. */
const WORDINGS = [
  2003.78, 2004.52, 2004.64, 2004.72, 2004.97, 2005.36, 2005.38, 2005.39,
  2005.44, 2006.74, 2007.14, 2007.63, 2007.71, 2009.64, 2009.7, 2014.65,
  2019.76, 2026.69,
];

const LEFT = 210;
const WIDE = 1500;
const x = (year: number) => LEFT + ((year - 2003) / 24) * WIDE;
const AXIS = 800;

/** The three figures the sentence has carried, from the article's history. */
const STEPS = [
  {
    from: 2003.78,
    to: 2006.74,
    y: 690,
    figure: "22 800",
    day: "13 Oct 2003",
    by: "Cimon Avaro",
    words: "Suomalaisten tappiot nousivat noin 22 800 henkeen…",
    label: 330,
  },
  {
    from: 2006.74,
    to: 2009.64,
    y: 560,
    figure: "26 600",
    day: "27 Sep 2006",
    by: "an anonymous editor",
    words:
      "Suomalaisten tappiot talvisodassa olivat 26 600 sotatoimissa menehtynyttä…",
    label: 512,
  },
  {
    from: 2009.64,
    to: 2026.75,
    y: 455,
    figure: "26 662",
    day: "22 Aug 2009",
    by: "an anonymous editor",
    words:
      "Suomalaisten tappiot talvisodassa olivat 26662 sotatoimissa menehtynyttä…",
    label: 1010,
  },
];

export function Trace() {
  const t = useT();
  const { duration } = scene("trace");
  const pasted = cue("trace", "paste") + 0.1;
  const dropped = cue("trace", "drop");
  const landed = cue("trace", "screenshot") + 0.25;
  const followed = cue("trace", "palimpsest");
  const said = [
    cue("trace", "twenty-two"),
    cue("trace", "twenty-six"),
    cue("trace", "and"),
  ];
  const dated = cue("trace", "first");

  // The screenshot flies in, is read, and shrinks to a chip in the box.
  const fly = ramp(t, dropped, landed - dropped, expo);
  const read = ramp(t, landed + 0.05, 0.6, inOut);
  const tuck = ramp(t, landed + 0.7, 0.4, inOut);
  const active = t >= said[2] ? 2 : t >= said[1] ? 1 : t >= said[0] ? 0 : -1;
  const found = Math.round(
    track(t, [followed + 0.2, followed + 1.9], [0, WORDINGS.length], (n) => n),
  );

  return (
    <Shell duration={duration}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: LEFT,
            top: 84,
            ...rise(t, 0.1),
          }}
        >
          <Label>Trace a claim</Label>
        </div>
        <div
          style={{
            position: "absolute",
            right: 1920 - LEFT - WIDE,
            top: 80,
            fontFamily: mono,
            fontSize: 24,
            color: dark.faint,
            opacity: ramp(t, followed + 0.2, 0.3),
          }}
        >
          <span style={{ color: dark.ink }}>{found}</span> wordings ·{" "}
          <span style={{ color: dark.ink }}>{Math.max(0, active + 1)}</span>{" "}
          figures · 23 years
        </div>

        <div
          style={{
            position: "absolute",
            left: LEFT,
            top: 124,
            width: WIDE,
            height: 96,
            boxSizing: "border-box",
            borderRadius: 20,
            border: `1.5px solid ${t >= pasted ? dark.rubric : dark.rule}`,
            background: dark.raised,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "0 30px",
            boxShadow:
              t >= pasted
                ? `0 0 ${60 * (1 - ramp(t, pasted, 0.6))}px ${dark.rubric}`
                : "none",
            ...rise(t, 0.15),
          }}
        >
          {tuck > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: mono,
                fontSize: 19,
                color: dark.added,
                border: `1px solid ${dark.added}66`,
                borderRadius: 12,
                padding: "8px 14px",
                opacity: tuck,
                whiteSpace: "nowrap",
              }}
            >
              screenshot.png · read by Gemini
            </div>
          )}
          <div
            style={{
              fontFamily: serif,
              fontSize: 42,
              color: dark.ink,
              opacity: ramp(t, pasted, 0.18),
              transform: `scale(${1.03 - ramp(t, pasted, 0.3) * 0.03})`,
              transformOrigin: "0 50%",
              whiteSpace: "nowrap",
            }}
          >
            “{CLAIM}”
          </div>
        </div>

        {/* The staircase: each figure for as long as Wikipedia said it. */}
        <svg
          width={1920}
          height={1080}
          style={{ position: "absolute", inset: 0 }}
        >
          <line
            x1={LEFT}
            x2={LEFT + WIDE * ramp(t, followed - 0.1, 0.7, expo)}
            y1={AXIS}
            y2={AXIS}
            stroke={dark.rule}
            strokeWidth={2}
          />

          {STEPS.map((step, index) => {
            const drawn = ramp(t, said[index], index === 2 ? 1.3 : 0.7, inOut);
            const before = STEPS[index - 1];

            if (drawn <= 0) return null;

            const rising = before ? Math.min(1, drawn * 4) : 1;
            const running = before ? Math.max(0, (drawn - 0.25) / 0.75) : drawn;

            return (
              <g key={step.figure}>
                <line
                  x1={x(step.from)}
                  x2={x(step.from)}
                  y1={AXIS}
                  y2={step.y}
                  stroke={dark.rule}
                  strokeWidth={1.5}
                  strokeDasharray="5 7"
                  opacity={drawn}
                />
                {before && (
                  <line
                    x1={x(step.from)}
                    x2={x(step.from)}
                    y1={before.y}
                    y2={before.y + (step.y - before.y) * rising}
                    stroke={dark.rubric}
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                )}
                <line
                  x1={x(step.from)}
                  x2={x(step.from) + (x(step.to) - x(step.from)) * running}
                  y1={step.y}
                  y2={step.y}
                  stroke={dark.rubric}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                <rect
                  x={x(step.from)}
                  y={step.y}
                  width={(x(step.to) - x(step.from)) * running}
                  height={AXIS - step.y}
                  fill={dark.rubric}
                  opacity={0.07 + (index === active ? 0.06 : 0)}
                />
              </g>
            );
          })}

          {WORDINGS.map((year, index) => {
            const p = pop(t, followed + 0.2 + index * 0.095, 9);

            return (
              <circle
                key={year}
                cx={x(year)}
                cy={AXIS}
                r={7 * p}
                fill={dark.ink}
                stroke={dark.bg}
                strokeWidth={2}
              />
            );
          })}

          {/* A ring on the edit that first wrote today's figure. */}
          {[0, 0.25].map((delay) => {
            const p = ramp(t, dated + delay, 1.1, expo);

            return (
              <circle
                key={delay}
                cx={x(2009.64)}
                cy={STEPS[2].y}
                r={12 + p * 90}
                fill="none"
                stroke={dark.rubric}
                strokeWidth={3}
                opacity={p > 0 ? 1 - p : 0}
              />
            );
          })}
        </svg>

        {[2003, 2008, 2013, 2018, 2023].map((year) => (
          <div
            key={year}
            style={{
              position: "absolute",
              left: x(year) - 50,
              width: 100,
              top: AXIS + 22,
              textAlign: "center",
              fontFamily: mono,
              fontSize: 20,
              color: dark.faint,
              opacity: ramp(t, followed + 0.3, 0.4),
            }}
          >
            {year}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: x(2026.75) - 60,
            width: 120,
            top: AXIS + 22,
            textAlign: "center",
            fontFamily: mono,
            fontSize: 20,
            color: dark.faint,
            opacity: ramp(t, followed + 0.3, 0.4),
          }}
        >
          today
        </div>

        {STEPS.map((step, index) => {
          const p = pop(t, said[index] + 0.1, 11);
          const last = index === 2;

          return (
            <div
              key={step.figure}
              style={{
                position: "absolute",
                left: last ? step.label - 400 : x(step.to) - 14 - 420,
                width: last ? 800 : 420,
                top: step.y - (last ? 186 : 122),
                textAlign: last ? "center" : "right",
                opacity: Math.min(1, p * 1.5),
                transform: `scale(${0.5 + p * 0.5})`,
                transformOrigin: last ? "50% 100%" : "100% 100%",
              }}
            >
              <div
                style={{
                  fontFamily: serif,
                  fontWeight: 500,
                  fontSize: last ? 132 : 80,
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                  color: last ? dark.rubric : dark.ink,
                  textShadow: last ? "0 0 70px rgba(229,106,80,0.4)" : "none",
                }}
              >
                {step.figure}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: mono,
                  fontSize: last ? 26 : 20,
                  letterSpacing: "0.06em",
                  color: last ? dark.ink : dark.faint,
                  opacity: last ? ramp(t, dated, 0.3) : 1,
                }}
              >
                {last ? "first written " : "from "}
                {step.day}
              </div>
            </div>
          );
        })}

        {/* The wording of the day, as the editor wrote it. */}
        {active >= 0 && (
          <div
            style={{
              position: "absolute",
              left: LEFT,
              width: WIDE,
              top: 884,
              height: 110,
              boxSizing: "border-box",
              borderRadius: 18,
              border: `1.5px solid ${dark.rule}`,
              background: dark.raised,
              padding: "0 30px",
              display: "flex",
              alignItems: "center",
              gap: 26,
              ...rise(t, said[0], 30),
            }}
          >
            <div
              style={{
                fontFamily: mono,
                fontSize: 20,
                color: dark.rubric,
                whiteSpace: "nowrap",
              }}
            >
              <Swap value={STEPS[active].day} since={said[active]} />
            </div>
            <div
              style={{
                flex: 1,
                fontFamily: serif,
                fontStyle: "italic",
                fontSize: 30,
                color: dark.soft,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <Swap value={`“${STEPS[active].words}”`} since={said[active]} />
            </div>
            <div
              style={{
                fontFamily: sans,
                fontSize: 21,
                color: dark.faint,
                whiteSpace: "nowrap",
              }}
            >
              <Swap
                value={`written by ${STEPS[active].by}`}
                since={said[active]}
              />
            </div>
          </div>
        )}

        {/* The screenshot of a post, dropped on the box and read. */}
        {fly > 0 && tuck < 1 && (
          <div
            style={{
              position: "absolute",
              left: track(fly, [0, 1], [1500, 640]) - tuck * 360,
              top: track(fly, [0, 1], [1120, 250]) - tuck * 110,
              width: 640,
              height: 250,
              borderRadius: 22,
              background: "#fdfaf3",
              boxShadow: "0 50px 120px rgba(0,0,0,0.7)",
              padding: 30,
              boxSizing: "border-box",
              transform: `rotate(${(1 - fly) * 14 - 3 + tuck * 3}deg) scale(${1 - tuck * 0.82})`,
              opacity: 1 - tuck,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 56,
                  background: "#ddd4c1",
                }}
              />
              <div>
                <div
                  style={{
                    width: 190,
                    height: 16,
                    borderRadius: 8,
                    background: "#1d1a16",
                  }}
                />
                <div
                  style={{
                    marginTop: 9,
                    width: 120,
                    height: 12,
                    borderRadius: 8,
                    background: "#ddd4c1",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: 22,
                fontFamily: sans,
                fontSize: 31,
                lineHeight: 1.3,
                color: "#1d1a16",
              }}
            >
              Did you know? {CLAIM}
            </div>
            {read > 0 && read < 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: read * 250 - 40,
                  height: 80,
                  background: `linear-gradient(transparent, ${dark.added}88, transparent)`,
                }}
              />
            )}
          </div>
        )}
      </AbsoluteFill>
    </Shell>
  );
}
