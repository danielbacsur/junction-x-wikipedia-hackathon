import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, random } from "remotion";

import {
  CREAM,
  Plate,
  Quill,
  RUBRIC,
  caps,
  fell,
  garamond,
  ramp,
} from "../film/kit";
import { Flame, Motes, Tail } from "../film/Room";

export const snap = Easing.out(Easing.exp);
export const GREEN = "#2f6b4f";

/** What every shot is told: seconds since it began, and how long it runs. */
export type Shot = { t: number; d: number };

/**
 * A cut. The picture arrives slightly too close and settles back, with a
 * blink of light on the first frames, so every change of shot lands.
 */
export function Cut({
  t,
  children,
  kick = 0.08,
  creep = 0.012,
  flash = 0.5,
  origin = "50% 50%",
}: {
  t: number;
  children: ReactNode;
  kick?: number;
  creep?: number;
  flash?: number;
  origin?: string;
}) {
  const landed = ramp(t, 0, 0.32, snap);

  return (
    <AbsoluteFill style={{ background: "#120a05" }}>
      <AbsoluteFill
        style={{
          transformOrigin: origin,
          transform: `scale(${1 + kick * (1 - landed) + t * creep}) rotate(${(1 - landed) * 0.5}deg)`,
        }}
      >
        {children}
      </AbsoluteFill>
      {flash > 0 && t < 0.1 && (
        <AbsoluteFill
          style={{ background: "#fff1cf", opacity: flash * (1 - t / 0.1) }}
        />
      )}
    </AbsoluteFill>
  );
}

/** Darker towards the corners, as by candlelight. */
export function Shade({ strength = 0.6 }: { strength?: number }) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 56% 44%, transparent 48%, rgba(18,8,2,${strength}) 100%)`,
      }}
    />
  );
}

/** The line of small capitals that says what a shot is showing. */
export function Caption({
  t,
  at = 0.15,
  top = 968,
  children,
  colour = CREAM,
}: {
  t: number;
  at?: number;
  top?: number;
  children: ReactNode;
  colour?: string;
}) {
  const p = ramp(t, at, 0.3, snap);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: top + (1 - p) * 20,
        textAlign: "center",
        fontFamily: caps,
        fontSize: 38,
        letterSpacing: "0.14em",
        color: colour,
        opacity: p,
        textShadow: colour === CREAM ? "0 3px 18px rgba(20,8,0,0.95)" : "none",
      }}
    >
      {children}
    </div>
  );
}

/** A figure, set in lining numerals. */
export function Fig({
  children,
  size,
  colour,
  style,
}: {
  children: ReactNode;
  size: number;
  colour: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: garamond,
        fontWeight: 500,
        fontVariantNumeric: "lining-nums tabular-nums",
        fontSize: size,
        lineHeight: 1,
        color: colour,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** The four-pointed star that stands for the model that writes the answers. */
export function Spark({
  size,
  style,
}: {
  size: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        filter: "drop-shadow(0 0 22px rgba(255,214,140,0.9))",
        ...style,
      }}
    >
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="0.55" stopColor="#f2a65a" />
          <stop offset="1" stopColor="#6fb7a5" />
        </linearGradient>
      </defs>
      <path
        d="M12 0.5c.7 6.5 4.9 10.7 11.5 11.5C16.9 12.8 12.7 17 12 23.5 11.3 17 7.1 12.8.5 12 7.1 11.2 11.3 7 12 .5z"
        fill="url(#spark)"
      />
    </svg>
  );
}

/** A seal of red wax, pressed down hard. */
export function Seal({
  t,
  at,
  x,
  y,
  size,
  over,
  name,
}: {
  t: number;
  at: number;
  x: number;
  y: number;
  size: number;
  over: string;
  name: string;
}) {
  const p = ramp(t, at, 0.22, Easing.in(Easing.quad));
  const dent = ramp(t, at + 0.22, 0.25, snap);

  if (t < at) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size,
        background: `radial-gradient(circle at 38% 34%, #c8492f, ${RUBRIC} 55%, #651708)`,
        boxShadow: `0 ${24 - p * 14}px ${50 - p * 20}px rgba(30,8,0,0.7), inset 0 0 0 ${size * 0.045}px rgba(90,20,8,0.6)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: Math.min(1, p * 3),
        transform: `rotate(-10deg) scale(${2.6 - p * 1.6 + (1 - dent) * 0.08 * (p >= 1 ? 1 : 0)})`,
      }}
    >
      <div
        style={{
          fontFamily: caps,
          fontSize: size * 0.085,
          letterSpacing: "0.14em",
          color: "#f3c9b0",
        }}
      >
        {over}
      </div>
      <div
        style={{
          fontFamily: fell,
          fontSize: size * 0.22,
          lineHeight: 1.15,
          color: CREAM,
        }}
      >
        {name}
      </div>
    </div>
  );
}

/** A blade crossing the frame from left to right at a height. */
export function Blade({
  t,
  from,
  over,
  y,
  left = 200,
  right = 1720,
  size = 2,
}: {
  t: number;
  from: number;
  over: number;
  y: number;
  left?: number;
  right?: number;
  size?: number;
}) {
  const p = ramp(t, from, over, Easing.inOut(Easing.quad));

  if (p <= 0 || p >= 1) return null;

  return (
    <svg
      width={150 * size}
      height={220 * size}
      viewBox="0 0 150 220"
      style={{
        position: "absolute",
        left: left + (right - left) * p,
        top: y,
        overflow: "visible",
        transform: `translate(-18%, -78%) rotate(${-18 + Math.sin(t * 40) * 5}deg)`,
        filter: "drop-shadow(10px 16px 10px rgba(30,12,2,0.5))",
      }}
    >
      <path
        d="M20 200 C 0 150, 20 110, 70 100 L 84 130 C 60 150, 50 180, 20 200 Z"
        fill="#cfcabb"
      />
      <path
        d="M20 200 C 6 160, 22 124, 60 108"
        stroke="#f6f3e8"
        strokeWidth={4}
        fill="none"
      />
      <path
        d="M70 100 L 124 14 C 138 6, 148 16, 142 30 L 84 130 Z"
        fill="#6b4324"
      />
    </svg>
  );
}

/** Loose leaves rushing out from the middle of the frame, past the eye. */
export function Flurry({
  t,
  count = 150,
  speed = 0.9,
  burst = false,
}: {
  t: number;
  count?: number;
  speed?: number;

  /** All at once from the centre, instead of an endless stream. */
  burst?: boolean;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = random(`fl-a-${i}`) * Math.PI * 2;
        const life = burst
          ? t * speed * (0.6 + random(`fl-s-${i}`) * 0.9)
          : (t * speed * (0.5 + random(`fl-s-${i}`)) + random(`fl-p-${i}`)) % 1;

        if (life < 0 || life > 1.6) return null;

        const tone = 0.84 + random(`fl-t-${i}`) * 0.16;
        const far = life ** 1.7 * 1500;
        const size = 26 + life * 210;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + Math.cos(angle) * far - size / 2,
              top: 540 + Math.sin(angle) * far * 0.7 - size * 0.7,
              width: size,
              height: size * 1.36,
              borderRadius: 4,
              background: `rgb(${Math.round(250 * tone)},${Math.round(234 * tone)},${Math.round(194 * tone)})`,
              boxShadow: "0 10px 26px rgba(50,20,0,0.4)",
              opacity:
                Math.min(1, life * 5) *
                Math.max(0, 1 - Math.max(0, life - 0.75) * 4),
              transform: `rotate(${random(`fl-r-${i}`) * 360 + life * (random(`fl-w-${i}`) - 0.5) * 520}deg) skewY(${(random(`fl-k-${i}`) - 0.5) * 30}deg)`,
            }}
          />
        );
      })}
    </>
  );
}

/** The scriptorium at night, with everything in it that moves. */
export function Night({ now }: { now: number }) {
  return (
    <>
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
        now={now}
        scale={0.42}
        style={{
          left: 884 + Math.sin(now * 5) * 26,
          top: 688 - Math.sin(now * 5) * 3,
        }}
      />
    </>
  );
}

/** Rows of faint lines that stand for a paragraph nobody needs to read. */
export function Lines({
  rows,
  left,
  top,
  wide,
  gap = 26,
  colour = "#7d5730",
  shown = rows,
  seed = "lines",
}: {
  rows: number;
  left: number;
  top: number;
  wide: number;
  gap?: number;
  colour?: string;

  /** How many of the rows have been written so far; may be fractional. */
  shown?: number;
  seed?: string;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => {
        const visible = Math.max(0, Math.min(1, shown - row));

        return (
          <div
            key={row}
            style={{
              position: "absolute",
              left,
              top: top + row * gap,
              width:
                wide *
                (row % 5 === 4
                  ? 0.55
                  : 0.82 + random(`${seed}-${row}`) * 0.18) *
                visible,
              height: 6,
              borderRadius: 4,
              background: colour,
              opacity: 0.36,
            }}
          />
        );
      })}
    </>
  );
}
