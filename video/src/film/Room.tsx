import { AbsoluteFill, random } from "remotion";

import { SHOTS } from "./clock";
import { Plate, Quill, ramp, track, useNow } from "./kit";

/** The flame of the candle and the light it throws, both a little unsteady. */
export function Flame({ now, x, y }: { now: number; x: number; y: number }) {
  const flicker =
    Math.sin(now * 11) * 0.5 +
    Math.sin(now * 23.7) * 0.3 +
    Math.sin(now * 5.3) * 0.2;
  const sway = Math.sin(now * 3.1) * 5 + Math.sin(now * 7.9) * 3;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 520,
          top: y - 540,
          width: 1040,
          height: 1040,
          borderRadius: 1040,
          background:
            "radial-gradient(circle, rgba(255,196,110,0.42), rgba(255,150,60,0.14) 38%, rgba(255,150,60,0) 68%)",
          mixBlendMode: "screen",
          opacity: 0.8 + flicker * 0.16,
          transform: `scale(${1 + flicker * 0.03})`,
        }}
      />
      <svg
        width={60}
        height={110}
        viewBox="-30 -100 60 110"
        style={{
          position: "absolute",
          left: x - 30,
          top: y - 100,
          overflow: "visible",
          transformOrigin: "50% 100%",
          transform: `rotate(${sway}deg) scaleY(${1 + flicker * 0.12})`,
          filter: "blur(0.6px) drop-shadow(0 0 18px rgba(255,180,80,0.9))",
        }}
      >
        <path
          d="M0 0 C -17 -14, -15 -44, 0 -88 C 15 -44, 17 -14, 0 0 Z"
          fill="#ffb84d"
        />
        <path
          d="M0 -4 C -9 -14, -8 -32, 0 -58 C 8 -32, 9 -14, 0 -4 Z"
          fill="#fff4c9"
        />
        <path
          d="M0 -2 C -4 -8, -4 -14, 0 -22 C 4 -14, 4 -8, 0 -2 Z"
          fill="#7a9cff"
          opacity={0.7}
        />
      </svg>
    </>
  );
}

/** Motes of dust drifting through a shaft of light. */
export function Motes({
  now,
  count,
  box,
  colour,
}: {
  now: number;
  count: number;
  box: [number, number, number, number];
  colour: string;
}) {
  const [left, top, wide, tall] = box;

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const speed = 6 + random(`mote-v-${i}`) * 14;
        const x = left + ((random(`mote-x-${i}`) * wide + now * speed) % wide);
        const y =
          top +
          ((random(`mote-y-${i}`) * tall +
            now * speed * 0.5 +
            Math.sin(now * 0.7 + i) * 18) %
            tall);
        const size = 2.5 + random(`mote-s-${i}`) * 4;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              background: colour,
              opacity: 0.25 + 0.5 * Math.abs(Math.sin(now * 1.3 + i * 1.7)),
              filter: "blur(0.6px)",
            }}
          />
        );
      })}
    </>
  );
}

/** The cat's tail, hanging over the sill and never quite still. */
export function Tail({ now, colour }: { now: number; colour: string }) {
  const swing = Math.sin(now * 1.6) * 22 + Math.sin(now * 0.7) * 8;

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <path
        d={`M1226 628 C 1206 664, ${1200 + swing * 0.5} 700, ${1210 + swing} 742`}
        stroke={colour}
        strokeWidth={13}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** A scriptorium at night, and the scribe who writes by one candle. */
export function Room() {
  const now = useNow(SHOTS.room);
  const push = track(now, [0, SHOTS.page + 1], [1, 1.2]);
  const writing = Math.sin(now * 2.2);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "50% 62%",
          transform: `scale(${push})`,
        }}
      >
        <Plate name="roomNight" now={now} />
        <Tail now={now} colour="#0c0a0a" />
        <Motes
          now={now}
          count={34}
          box={[760, 440, 760, 600]}
          colour="rgba(190,210,255,0.8)"
        />
        <Flame now={now} x={1150} y={540} />
        <Quill
          now={now * 0.5}
          scale={0.42}
          style={{ left: 884 + writing * 26, top: 688 + writing * -3 }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: "#000", opacity: 1 - ramp(now, 0, 1.6) }}
      />
    </AbsoluteFill>
  );
}
