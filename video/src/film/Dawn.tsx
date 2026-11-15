import { AbsoluteFill } from "remotion";

import { SHOTS, TOTAL, line, said } from "./clock";
import { CREAM, Plate, Written, caps, fell, ramp, track, useNow } from "./kit";
import { Motes, Tail } from "./Room";

/** Smoke from the candle that burnt down in the night. */
function Smoke({ now }: { now: number }) {
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {[0, 1, 2].map((i) => {
        const age = (now * 0.32 + i / 3) % 1;
        const rise = age * 210;
        const lean = Math.sin(now * 1.3 + i * 2) * 16 * age;

        return (
          <path
            key={i}
            d={`M1150 606 C ${1150 + lean} ${606 - rise * 0.4}, ${1150 - lean * 1.6} ${606 - rise * 0.75}, ${1150 + lean * 2} ${606 - rise}`}
            stroke="rgba(255,244,226,0.5)"
            strokeWidth={5 + age * 9}
            strokeLinecap="round"
            fill="none"
            opacity={(1 - age) * 0.6}
            style={{ filter: "blur(3px)" }}
          />
        );
      })}
    </svg>
  );
}

/** Birds crossing the morning sky in the window. */
function Birds({ now }: { now: number }) {
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <clipPath id="window">
          <path d="M1204 640 V345 A176 176 0 0 1 1556 345 V640 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#window)">
        {[0, 1, 2, 3].map((i) => {
          const along = ((now - SHOTS.dawn) * 0.09 + i * 0.17 + 0.05) % 1;
          const x = 1180 + along * 420;
          const y = 300 + i * 26 - along * 70 + Math.sin(now * 2 + i) * 6;
          const flap = Math.sin(now * 9 + i * 1.7) * 7;

          return (
            <path
              key={i}
              d={`M${x - 13} ${y + flap} Q ${x - 6} ${y - 8 - flap} ${x} ${y} Q ${x + 6} ${y - 8 - flap} ${x + 13} ${y + flap}`}
              stroke="#3b3550"
              strokeWidth={3.4}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </g>
    </svg>
  );
}

/** Morning in the same room: the scribe gone, the pages still there. */
export function Dawn() {
  const now = useNow(SHOTS.dawn);
  const named = line("name").start;
  const pull = track(now, [SHOTS.dawn, named + 2.4], [1.34, 1.0]);
  const title = ramp(now, named - 0.5, 1.0);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "50% 64%",
          transform: `scale(${pull})`,
        }}
      >
        <Plate name="roomDawn" now={now} />
        <Birds now={now} />
        <Tail now={now} colour="#3a2a22" />
        <Smoke now={now} />
        <Motes
          now={now}
          count={46}
          box={[440, 220, 1100, 820]}
          colour="rgba(255,232,186,0.95)"
        />
        {/* The morning coming up through the window. */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 72% 52%, rgba(255,214,150,0.5), rgba(255,214,150,0) 55%)",
            mixBlendMode: "screen",
            opacity: track(now, [SHOTS.dawn, named + 2], [0.25, 1]),
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(22,10,3,0) 30%, rgba(22,10,3,0.9) 82%)",
          opacity: title,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 620,
          textAlign: "center",
          fontFamily: fell,
          fontSize: 210,
          lineHeight: 1,
          color: CREAM,
          textShadow: "0 6px 40px rgba(20,8,0,0.9)",
        }}
      >
        <Written now={now} from={named - 0.1} until={named + 1.1} quill={1.6}>
          Palimpsest
        </Written>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 858,
          textAlign: "center",
          fontFamily: fell,
          fontStyle: "italic",
          fontSize: 66,
          color: CREAM,
          textShadow: "0 4px 24px rgba(20,8,0,0.95)",
        }}
      >
        <Written
          now={now}
          from={said("name", "if") - 0.1}
          until={line("name").end - 0.1}
          quill={0}
        >
          If Wikipedia ever said it, we can find it, date it, and answer from
          it.
        </Written>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 966,
          textAlign: "center",
          fontFamily: caps,
          fontSize: 34,
          letterSpacing: "0.16em",
          color: "#ffd9b0",
          opacity: ramp(now, line("name").end + 0.3, 0.8),
        }}
      >
        built on MariaDB · answers by Gemini · wikipedia.danielbacsur.dev
      </div>

      <AbsoluteFill
        style={{ background: "#000", opacity: ramp(now, TOTAL - 1.3, 1.2) }}
      />
    </AbsoluteFill>
  );
}
