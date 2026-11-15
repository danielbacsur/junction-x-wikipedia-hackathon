import { loadFont as loadGaramond } from "@remotion/google-fonts/EBGaramond";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as loadFellCaps } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFraktur } from "@remotion/google-fonts/UnifrakturMaguntia";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { PlateName } from "./scenery";

export const fraktur = loadFraktur("normal", {
  weights: ["400"],
  subsets: ["latin"],
}).fontFamily;

export const fell = loadFell("normal", {
  weights: ["400"],
  subsets: ["latin"],
}).fontFamily;

loadFell("italic", { weights: ["400"], subsets: ["latin"] });

export const caps = loadFellCaps("normal", {
  weights: ["400"],
  subsets: ["latin"],
}).fontFamily;

export const garamond = loadGaramond("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
}).fontFamily;

/** Iron-gall ink, the red of a rubric, ink that has been scraped, vellum. */
export const INK = "#2a180b";
export const RUBRIC = "#a02c18";
export const GHOST = "#7d5730";
export const CREAM = "#f6ead0";

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const soft = Easing.inOut(Easing.cubic);
export const settle = Easing.out(Easing.cubic);

/** 0 before `from`, 1 after `from + over`, eased in between. */
export const ramp = (
  now: number,
  from: number,
  over: number,
  easing: (n: number) => number = settle,
) => interpolate(now, [from, from + over], [0, 1], { ...CLAMP, easing });

/** A value that moves between stops at given seconds. */
export const track = (
  now: number,
  seconds: number[],
  values: number[],
  easing: (n: number) => number = soft,
) => interpolate(now, seconds, values, { ...CLAMP, easing });

/** Seconds since the film began, inside a shot that starts at `start`. */
export const useNow = (start: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return start + frame / fps;
};

/** The filters that roughen ink and the edges of a sheet. */
export function Filters() {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id="ink" x="-5%" y="-25%" width="110%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045"
            numOctaves={2}
            seed={4}
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={5} />
        </filter>
        <filter id="deckle" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves={3}
            seed={9}
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={14} />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * A painted background. Two takes of the same painting fade into each
 * other, so the brushwork breathes the way hand-painted frames do.
 */
export function Plate({
  name,
  now,
  style,
}: {
  name: PlateName;
  now: number;
  style?: CSSProperties;
}) {
  const breath = 0.5 + 0.5 * Math.sin(now * 3.4);

  return (
    <AbsoluteFill style={style}>
      <Img
        src={staticFile(`film/plates/${name}-0.jpg`)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <Img
        src={staticFile(`film/plates/${name}-1.jpg`)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: breath,
        }}
      />
    </AbsoluteFill>
  );
}

/** A goose quill, drawn with its nib at the top left corner of its box. */
export function Quill({
  now,
  scale = 1,
  style,
}: {
  now: number;
  scale?: number;
  style?: CSSProperties;
}) {
  const hand = Math.sin(now * 23) * 3 + Math.sin(now * 9.7) * 2;

  return (
    <svg
      width={260 * scale}
      height={300 * scale}
      viewBox="0 0 260 300"
      style={{
        position: "absolute",
        overflow: "visible",
        transformOrigin: "0 100%",
        transform: `translate(0, -100%) rotate(${hand}deg) translateY(${Math.sin(now * 31) * 3}px)`,
        filter: "drop-shadow(8px 14px 10px rgba(40,20,5,0.35))",
        ...style,
      }}
    >
      <path
        d="M4 296 C 70 200, 150 90, 236 10"
        stroke="#6b4a2a"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M70 205 C 60 130, 140 40, 240 4 C 250 70, 190 150, 96 214 Z"
        fill="#f4ead2"
      />
      <path
        d="M70 205 C 60 130, 140 40, 240 4 C 200 70, 140 140, 82 200 Z"
        fill="#d9c9a4"
      />
      {[0.2, 0.4, 0.6, 0.8].map((at) => (
        <path
          key={at}
          d={`M${70 + at * 150} ${205 - at * 180} l 30 14`}
          stroke="#b9a57c"
          strokeWidth={2}
        />
      ))}
      <path d="M4 296 l 16 -30 l 8 8 Z" fill="#2a180b" />
    </svg>
  );
}

/** Text that a quill writes from left to right between two moments. */
export function Written({
  children,
  now,
  from,
  until,
  quill = 1,
  style,
}: {
  children: ReactNode;
  now: number;
  from: number;
  until: number;

  /** The size of the quill that writes it, or 0 for none. */
  quill?: number;
  style?: CSSProperties;
}) {
  const p = ramp(now, from, until - from, Easing.inOut(Easing.quad));

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-block",
          clipPath:
            p >= 1 ? undefined : `inset(-40% ${(1 - p) * 100}% -40% -5%)`,
          visibility: p <= 0 ? "hidden" : "visible",
          filter: "url(#ink)",
        }}
      >
        {children}
      </span>
      {quill > 0 && p > 0 && p < 1 && (
        <Quill
          now={now}
          scale={quill}
          style={{ left: `${p * 100}%`, top: "72%" }}
        />
      )}
    </span>
  );
}

/**
 * Text that a blade scrapes away from left to right. What is left is the
 * ghost of the ink, which never quite goes.
 */
export function Scraped({
  children,
  now,
  from,
  until,
  ghost,
  blade = 1,
  seed,
  style,
}: {
  children: ReactNode;
  now: number;
  from: number;
  until: number;

  /** How visible the ghost is, 0 to 1. */
  ghost: number;
  blade?: number;
  seed: string;
  style?: CSSProperties;
}) {
  const p = ramp(now, from, until - from, Easing.inOut(Easing.quad));

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span
        style={{
          display: "inline-block",
          color: GHOST,
          opacity: ghost,
          clipPath: `inset(-40% ${(1 - p) * 100}% -40% -5%)`,
          filter: "url(#ink) blur(0.6px)",
        }}
      >
        {children}
      </span>
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          display: "inline-block",
          clipPath: `inset(-40% -5% -40% ${p * 100}%)`,
          filter: "url(#ink)",
        }}
      >
        {children}
      </span>

      {/* Dust lifting off the page behind the blade. */}
      {Array.from({ length: 26 }, (_, i) => {
        const born = from + (i / 26) * (until - from);
        const age = now - born;

        if (age < 0 || age > 1.1) return null;

        const drift = random(`${seed}-x-${i}`) - 0.3;
        const lift = 0.4 + random(`${seed}-y-${i}`);

        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `calc(${(i / 26) * 100}% + ${drift * age * 90}px)`,
              top: `calc(${35 + random(`${seed}-r-${i}`) * 40}% - ${lift * age * 70 - age * age * 30}px)`,
              width: 5 + random(`${seed}-s-${i}`) * 7,
              height: 4 + random(`${seed}-s-${i}`) * 5,
              borderRadius: 6,
              background: i % 3 ? "#cbb07a" : "#8a6a3c",
              opacity: (1 - age / 1.1) * 0.85,
            }}
          />
        );
      })}

      {p > 0 && p < 1 && (
        <svg
          width={150 * blade}
          height={220 * blade}
          viewBox="0 0 150 220"
          style={{
            position: "absolute",
            left: `${p * 100}%`,
            top: "50%",
            overflow: "visible",
            transform: `translate(-18%, -78%) rotate(${-18 + Math.sin(now * 26) * 4}deg)`,
            filter: "drop-shadow(8px 12px 8px rgba(40,20,5,0.4))",
          }}
        >
          <path
            d="M20 200 C 0 150, 20 110, 70 100 L 84 130 C 60 150, 50 180, 20 200 Z"
            fill="#c9c4b4"
          />
          <path
            d="M20 200 C 6 160, 22 124, 60 108"
            stroke="#f4f1e6"
            strokeWidth={4}
            fill="none"
          />
          <path
            d="M70 100 L 124 14 C 138 6, 148 16, 142 30 L 84 130 Z"
            fill="#6b4324"
          />
          <path d="M76 104 L 128 22" stroke="#9a6a3c" strokeWidth={5} />
        </svg>
      )}
    </span>
  );
}

/** A leaf of parchment with a rough edge. */
export function Sheet({
  children,
  style,
  take = 0,
}: {
  children?: ReactNode;
  style?: CSSProperties;
  take?: number;
}) {
  return (
    <div style={{ position: "absolute", ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 10,
          overflow: "hidden",
          filter: "url(#deckle)",
          boxShadow: "0 30px 60px rgba(40,16,2,0.5)",
        }}
      >
        <Img
          src={staticFile(`film/plates/parchment-${take}.jpg`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "60% 30%",
          }}
        />
      </div>
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
  );
}
