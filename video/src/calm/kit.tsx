import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, random, staticFile } from "remotion";

import { caps, ramp, settle } from "../film/kit";

export { Fig, Lines, Seal, Spark, Blade, snap } from "../fast/parts";

export const INK = "#2a180b";
export const RUBRIC = "#b02e1a";
export const BLUE = "#234f9e";
export const GREEN = "#2a7a48";
export const GOLD = "#c08a1c";
export const GHOST = "#8d6a40";
export const CREAM = "#fff6dc";

/** What every shot is told: seconds since it began, and how long it runs. */
export type Shot = { t: number; d: number };

/** A leaf of bright vellum with a rough edge. */
export function Leaf({
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
          boxShadow: "0 26px 50px rgba(60,30,6,0.38)",
        }}
      >
        <Img
          src={staticFile(`film/plates/vellum-${take}.jpg`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 50%",
          }}
        />
      </div>
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
    </div>
  );
}

/** A small cream label that says what a shot is showing. */
export function Tag({
  t,
  at = 0.5,
  top = 956,
  children,
}: {
  t: number;
  at?: number;
  top?: number;
  children: ReactNode;
}) {
  const p = ramp(t, at, 0.6, settle);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: top + (1 - p) * 16,
        textAlign: "center",
        opacity: p,
      }}
    >
      <span
        style={{
          fontFamily: caps,
          fontSize: 36,
          letterSpacing: "0.12em",
          color: INK,
          background: CREAM,
          borderRadius: 40,
          padding: "10px 36px 14px",
          boxShadow: "0 10px 26px rgba(60,30,6,0.3)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

/** Birds crossing the sky, a few at a time. */
export function Birds({
  t,
  count = 5,
  top = 180,
  colour = "#27425f",
}: {
  t: number;
  count?: number;
  top?: number;
  colour?: string;
}) {
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: count }, (_, i) => {
        const along = (t * 0.045 + i * 0.13 + 0.1) % 1;
        const x = -80 + along * 2100;
        const y = top + i * 34 + Math.sin(t * 0.9 + i) * 22 - along * 60;
        const flap = Math.sin(t * 9 + i * 1.7) * 10;
        const s = 1 + (i % 3) * 0.3;

        return (
          <path
            key={i}
            d={`M${x - 20 * s} ${y + flap} Q ${x - 9 * s} ${y - 12 * s - flap} ${x} ${y} Q ${x + 9 * s} ${y - 12 * s - flap} ${x + 20 * s} ${y + flap}`}
            stroke={colour}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
    </svg>
  );
}

/** Butterflies over the meadow, or fireflies once it is dark. */
export function Flutter({
  t,
  glow = false,
  count = 7,
}: {
  t: number;
  glow?: boolean;
  count?: number;
}) {
  const wings = ["#ff7a3a", "#ffd23a", "#ffffff", "#ff8ab8", "#7fd0ff"];

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x =
          120 +
          random(`fx-${i}`) * 1680 +
          Math.sin(t * (0.5 + random(`fa-${i}`)) + i) * 90;
        const y =
          760 +
          random(`fy-${i}`) * 240 +
          Math.cos(t * (0.7 + random(`fb-${i}`)) + i * 2) * 50;

        if (glow) {
          const lit = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.4 + i * 1.3));

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y - 120,
                width: 9,
                height: 9,
                borderRadius: 9,
                background: "#fff3a0",
                opacity: lit,
                boxShadow: "0 0 22px 8px rgba(255,236,130,0.75)",
              }}
            />
          );
        }

        const beat = Math.abs(Math.sin(t * 16 + i));

        return (
          <svg
            key={i}
            width={60}
            height={50}
            viewBox="-30 -25 60 50"
            style={{
              position: "absolute",
              left: x,
              top: y,
              overflow: "visible",
            }}
          >
            <ellipse
              cx={-10 * beat - 3}
              cy={-4}
              rx={12 * beat + 2}
              ry={15}
              fill={wings[i % wings.length]}
            />
            <ellipse
              cx={10 * beat + 3}
              cy={-4}
              rx={12 * beat + 2}
              ry={15}
              fill={wings[i % wings.length]}
            />
            <ellipse cx={0} cy={0} rx={2.5} ry={12} fill="#3a2a1a" />
          </svg>
        );
      })}
    </>
  );
}

/** The cat's tail, hanging from the sill and never quite still. */
export function CatTail({ t }: { t: number }) {
  const swing = Math.sin(t * 1.6) * 22 + Math.sin(t * 0.7) * 8;

  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <path
        d={`M1196 640 C 1176 676, ${1170 + swing * 0.5} 712, ${1180 + swing} 756`}
        stroke="#f08a2c"
        strokeWidth={14}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** A soft frame of shade, so the eye stays in the middle. */
export function Soft({ strength = 0.3 }: { strength?: number }) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 46%, transparent 55%, rgba(40,20,4,${strength}) 100%)`,
      }}
    />
  );
}
