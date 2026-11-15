import { AbsoluteFill } from "remotion";

import { CREAM, Plate, Written, caps, fell, ramp } from "../film/kit";
import { Motes, Tail } from "../film/Room";
import { B } from "./beats";
import type { Shot } from "./parts";
import { Cut, snap } from "./parts";

/** Birds crossing the morning sky in the window. */
function Birds({ now }: { now: number }) {
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <clipPath id="pane">
          <path d="M1204 640 V345 A176 176 0 0 1 1556 345 V640 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#pane)">
        {[0, 1, 2, 3, 4].map((i) => {
          const along = (now * 0.14 + i * 0.19 + 0.05) % 1;
          const x = 1180 + along * 420;
          const y = 300 + i * 24 - along * 70 + Math.sin(now * 2 + i) * 6;
          const flap = Math.sin(now * 11 + i * 1.7) * 7;

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

/** The same room in the morning, with everything in it that moves. */
function Day({ now }: { now: number }) {
  return (
    <>
      <Plate name="roomDawn" now={now} />
      <Birds now={now} />
      <Tail now={now} colour="#3a2a22" />
      <Motes
        now={now}
        count={46}
        box={[440, 220, 1100, 820]}
        colour="rgba(255,232,186,0.95)"
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 72% 52%, rgba(255,214,150,0.5), rgba(255,214,150,0) 55%)",
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}

/** The promise, spoken and set as it is said, with the name in the middle. */
export function Title({ t, d }: Shot) {
  const named = B.named - B.title;
  const spoken = B.spoken - B.title;
  const promise = {
    position: "absolute" as const,
    left: 0,
    right: 0,
    textAlign: "center" as const,
    fontFamily: fell,
    fontStyle: "italic" as const,
    fontSize: 72,
    color: CREAM,
    textShadow: "0 4px 26px rgba(20,8,0,0.95)",
  };
  const said = (at: number) => {
    const p = ramp(t, at - B.title - 0.08, 0.28, snap);

    return {
      display: "inline-block",
      opacity: p,
      transform: `translateY(${(1 - p) * 18}px)`,
    };
  };

  return (
    <Cut t={t} kick={0.04} creep={-0.004} flash={0.35}>
      <Day now={t + 7} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(22,10,3,0.28) 0%, rgba(22,10,3,0.5) 40%, rgba(22,10,3,0.93) 84%)",
        }}
      />
      <div style={{ ...promise, top: 268 }}>
        <Written now={t} from={0.15} until={named - 0.35} quill={0}>
          If Wikipedia ever said it,
        </Written>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 372,
          textAlign: "center",
          fontFamily: fell,
          fontSize: 270,
          lineHeight: 1,
          color: CREAM,
          textShadow: "0 6px 44px rgba(20,8,0,0.95)",
        }}
      >
        <Written now={t} from={named - 0.1} until={named + 0.55} quill={1.8}>
          Palimpsest
        </Written>
      </div>
      <div style={{ ...promise, top: 690 }}>
        <span style={said(B.find)}>can find it,</span>{" "}
        <span style={said(B.dated)}>date it,</span>{" "}
        <span style={said(B.answer)}>and answer from it.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 850,
          textAlign: "center",
          opacity: ramp(t, spoken + 0.1, 0.4),
        }}
      >
        <span
          style={{
            fontFamily: caps,
            fontSize: 46,
            letterSpacing: "0.12em",
            color: "#1d120a",
            background: CREAM,
            borderRadius: 14,
            padding: "10px 34px 14px",
          }}
        >
          wikipedia.danielbacsur.dev
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 972,
          textAlign: "center",
          fontFamily: caps,
          fontSize: 30,
          letterSpacing: "0.16em",
          color: "#ffd9b0",
          opacity: ramp(t, spoken + 0.4, 0.4),
        }}
      >
        built on MariaDB · answers by Gemini · Junction 2026
      </div>
      <AbsoluteFill
        style={{ background: "#000", opacity: ramp(t, d - 1.0, 0.9) }}
      />
    </Cut>
  );
}
