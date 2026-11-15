import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { dark, mono, serif } from "./theme";

/** Seconds since the scene began. */
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return frame / fps;
};

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const out = Easing.out(Easing.cubic);
export const inOut = Easing.inOut(Easing.cubic);
export const expo = Easing.out(Easing.exp);

/** 0 before `from`, 1 after `from + over`, eased in between. */
export const ramp = (
  t: number,
  from: number,
  over: number,
  easing: (n: number) => number = out,
) => interpolate(t, [from, from + over], [0, 1], { ...CLAMP, easing });

/** A value that moves between stops at given seconds. */
export const track = (
  t: number,
  seconds: number[],
  values: number[],
  easing: (n: number) => number = inOut,
) => interpolate(t, seconds, values, { ...CLAMP, easing });

/** A spring that starts at `from` seconds and settles at 1 with a bounce. */
export const pop = (t: number, from: number, bounce = 12) =>
  t < from
    ? 0
    : spring({
        frame: (t - from) * 60,
        fps: 60,
        config: { damping: bounce, stiffness: 170, mass: 0.7 },
      });

/** Fade and rise into place. */
export const rise = (
  t: number,
  from: number,
  distance = 28,
  over = 0.5,
): CSSProperties => {
  const p = ramp(t, from, over, expo);

  return {
    opacity: p,
    transform: `translateY(${(1 - p) * distance}px)`,
  };
};

export const number = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * The warm black the film sits on: a dotted grid, a glow where the eye
 * should rest, and darker corners.
 */
export function Backdrop({ glow = "50% 46%" }: { glow?: string }) {
  const t = useT();

  return (
    <AbsoluteFill style={{ background: dark.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, rgba(236,229,214,0.085) 1.2px, transparent 1.6px)`,
          backgroundSize: "40px 40px",
          backgroundPosition: `${t * 3}px ${t * 2}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${glow}, rgba(229,106,80,0.11), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.62) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}

/**
 * A scene's content, arriving and leaving with a short push so that cuts
 * between scenes read as motion.
 */
export function Shell({
  duration,
  children,
  style,
}: {
  duration: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const t = useT();
  const arrive = ramp(t, 0, 0.32, expo);
  const leave = ramp(t, duration - 0.22, 0.22, Easing.in(Easing.cubic));

  return (
    <AbsoluteFill
      style={{
        opacity: arrive * (1 - leave),
        transform: `scale(${1.04 - arrive * 0.04 + leave * 0.05})`,
        filter: `blur(${(1 - arrive) * 10 + leave * 12}px)`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/** A small capital label in the typewriter face. */
export function Label({
  children,
  color = dark.faint,
  size = 20,
  style,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: mono,
        fontSize: size,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Text that types itself between two moments, with a caret. */
export function Typed({
  text,
  from,
  until,
  caret = true,
  style,
}: {
  text: string;
  from: number;
  until: number;
  caret?: boolean;
  style?: CSSProperties;
}) {
  const t = useT();
  const shown = Math.round(ramp(t, from, until - from, (n) => n) * text.length);
  const blink = Math.floor(t * 2.4) % 2 === 0;
  const typing = t >= from && t <= until + 0.15;

  return (
    <span style={style}>
      {text.slice(0, shown)}
      {caret && t >= from - 0.4 && (
        <span
          style={{
            display: "inline-block",
            width: "0.08em",
            height: "1.05em",
            marginLeft: "0.06em",
            verticalAlign: "-0.16em",
            background: dark.rubric,
            opacity: typing || blink ? 1 : 0,
          }}
        />
      )}
    </span>
  );
}

/** The mark: a red P written over a faint earlier P. */
export function Mark({
  size = 96,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: size * 0.19,
        background: light ? "#fdfaf3" : "#f7f3ea",
        boxShadow: light
          ? "0 0 0 1px #ddd4c1, 0 18px 50px rgba(29,26,22,0.14)"
          : "0 18px 60px rgba(0,0,0,0.5)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {[
        { left: 0.28, color: "#ddd4c1" },
        { left: 0.22, color: "#b23a23" },
      ].map((p) => (
        <span
          key={p.color}
          style={{
            position: "absolute",
            left: size * p.left,
            top: size * 0.02,
            fontFamily: serif,
            fontWeight: 500,
            fontSize: size * 0.78,
            lineHeight: 1,
            color: p.color,
          }}
        >
          P
        </span>
      ))}
    </div>
  );
}

/** A pointer that travels between places and presses down where told. */
export function Cursor({
  path,
  clicks = [],
}: {
  path: { at: number; x: number; y: number }[];
  clicks?: number[];
}) {
  const t = useT();
  const seconds = path.map((p) => p.at);
  const x = track(
    t,
    seconds,
    path.map((p) => p.x),
  );
  const y = track(
    t,
    seconds,
    path.map((p) => p.y),
  );
  const press = clicks.reduce(
    (most, at) => Math.max(most, 1 - Math.abs(t - at) / 0.12),
    0,
  );

  if (t < seconds[0] - 0.05) return null;

  return (
    <>
      {clicks.map((at) => {
        const p = ramp(t, at, 0.5, out);

        return p > 0 && p < 1 ? (
          <div
            key={at}
            style={{
              position: "absolute",
              left: x - 40,
              top: y - 40,
              width: 80,
              height: 80,
              borderRadius: 80,
              border: `3px solid ${dark.rubric}`,
              opacity: 1 - p,
              transform: `scale(${0.3 + p})`,
            }}
          />
        ) : null;
      })}
      <svg
        width={44}
        height={44}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: x - 6,
          top: y - 4,
          transform: `scale(${1 - Math.max(0, press) * 0.18})`,
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))",
        }}
      >
        <path
          d="M5 3l14 8.5-6.2 1.4L9.6 19z"
          fill="#fdfaf3"
          stroke="#0f0d0a"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}

/** A word or figure that drops into place whenever it changes. */
export function Swap({
  value,
  since,
  style,
}: {
  /** What is shown now. */
  value: ReactNode;

  /** The second at which it became this. */
  since: number;
  style?: CSSProperties;
}) {
  const t = useT();
  const p = ramp(t, since, 0.32, expo);

  return (
    <span
      style={{
        display: "inline-block",
        opacity: 0.15 + p * 0.85,
        transform: `translateY(${(1 - p) * -0.32}em)`,
        filter: `blur(${(1 - p) * 8}px)`,
        ...style,
      }}
    >
      {value}
    </span>
  );
}
