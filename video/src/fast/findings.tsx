import { Easing, random } from "remotion";

import {
  CREAM,
  GHOST,
  INK,
  Plate,
  Quill,
  RUBRIC,
  Scraped,
  Sheet,
  Written,
  caps,
  fell,
  ramp,
  track,
} from "../film/kit";
import { B } from "./beats";
import type { Shot } from "./parts";
import { Blade, Caption, Cut, Fig, Shade, snap } from "./parts";

const heading = {
  position: "absolute" as const,
  left: 0,
  right: 0,
  textAlign: "center" as const,
  fontFamily: caps,
  letterSpacing: "0.12em",
  color: RUBRIC,
};

const two = (n: number) => String(Math.floor(n)).padStart(2, "0");
const clock = (seconds: number) =>
  `${two(seconds / 3600)}:${two((seconds % 3600) / 60)}:${two(seconds % 60)}`;

/** A paragraph written, taken out at 18:43:29 and put back at 18:45:24. */
export function Vanish({ t }: Shot) {
  const evening = B.evening - B.vanish;
  const gone = B.vanished - B.vanish;
  const counting = B.hundred - B.vanish;
  const back = B.returned - B.vanish;
  const written = ramp(t, 0.25, evening - 1.0, Easing.inOut(Easing.quad));
  const out = ramp(t, gone, 0.4, Easing.inOut(Easing.quad));
  const home = ramp(t, back, 0.45, Easing.inOut(Easing.quad));
  const removed = 18 * 3600 + 43 * 60 + 29;
  const now = track(
    t,
    [counting, back + 0.45],
    [removed, removed + 115],
    (n) => n,
  );
  const restored = t >= back + 0.45;
  const later = ramp(t, evening - 0.25, 0.3);
  const tone = restored ? "#8fd6b4" : "#f08a6c";
  const words =
    "Suomalaisten tappiot talvisodassa olivat 26 600 sotatoimissa menehtynyttä ja noin 1 000 siviiliä.";
  const text = {
    position: "absolute" as const,
    left: 70,
    right: 70,
    top: 150,
    fontFamily: fell,
    fontSize: 62,
    lineHeight: 1.4,
  };
  const panel = {
    position: "absolute" as const,
    left: 1220,
    right: 40,
    top: 250,
    textAlign: "center" as const,
    textShadow: "0 5px 30px rgba(10,4,0,0.95)",
  };
  const date = {
    fontFamily: caps,
    fontSize: 38,
    letterSpacing: "0.14em",
    color: "#ffd9b0",
  };

  return (
    <Cut t={t}>
      <Plate name="desk" now={t} />
      <Sheet
        style={{
          left: 120,
          top: 170,
          width: 1040,
          height: 650,
          transform: `rotate(-1.5deg) translateX(${t >= gone && t < gone + 0.25 ? Math.sin((t - gone) * 80) * 9 : 0}px)`,
        }}
      >
        <div style={{ ...heading, top: 46, fontSize: 34 }}>
          Talvisota · the paragraph on losses
        </div>
        <div style={{ ...text, color: GHOST, opacity: t >= gone ? 0.3 : 0 }}>
          {words}
        </div>
        <div
          style={{
            ...text,
            color: INK,
            clipPath:
              t < gone
                ? `inset(0 ${(1 - written) * 100}% 0 0)`
                : t < back
                  ? `inset(0 0 0 ${out * 100}%)`
                  : `inset(0 ${(1 - home) * 100}% 0 0)`,
          }}
        >
          {words}
        </div>
      </Sheet>
      {written > 0 && written < 1 && (
        <Quill
          now={t}
          scale={1.9}
          style={{ left: 190 + written * 900, top: 560 }}
        />
      )}
      <Blade
        t={t}
        from={gone}
        over={0.4}
        y={560}
        left={160}
        right={1160}
        size={2.3}
      />
      {home > 0 && home < 1 && (
        <Quill
          now={t}
          scale={1.9}
          style={{ left: 190 + home * 900, top: 560 }}
        />
      )}

      <div style={{ ...panel, opacity: ramp(t, 0.3, 0.3) * (1 - later) }}>
        <div style={date}>15 September 2007</div>
        <Fig size={150} colour={CREAM}>
          15:23:16
        </Fig>
        <div
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 72,
            color: CREAM,
          }}
        >
          written by Myllyre
        </div>
      </div>
      <div style={{ ...panel, opacity: later }}>
        <div style={date}>11 January 2008</div>
        <Fig size={150} colour={tone}>
          {clock(now)}
        </Fig>
        <div
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 84,
            color: tone,
            opacity: ramp(t, gone, 0.2),
          }}
        >
          {restored ? "restored" : "removed"}
        </div>
        <div
          style={{
            ...date,
            marginTop: 10,
            opacity: ramp(t, counting, 0.3),
          }}
        >
          {Math.round(now - removed)} seconds later
        </div>
      </div>
      <Caption t={t} at={0.25} top={900}>
        who changed what, to the second
      </Caption>
      <Shade strength={0.45} />
    </Cut>
  );
}

/** Real figures that changed while the sentence around them did not. */
const MOVED = [
  ["105 149", "105 242"],
  ["6 054", "6 145"],
  ["58", "83"],
  ["3 771", "3 779"],
  ["6 743", "6 598"],
  ["26 600", "26 662"],
  ["4 226", "4 035"],
  ["7 525", "7 490"],
  ["1 384", "1 332"],
  ["3 086", "2 990"],
  ["3 453", "3 516"],
  ["5 817", "5 807"],
  ["4 450", "4 434"],
  ["2 203", "2 215"],
  ["5 151", "5 106"],
];

export function MovedNumbers({ t }: Shot) {
  const big = B.quietly - B.numbers;
  const slam = ramp(t, big, 0.22, snap);

  return (
    <Cut t={t} kick={0.12}>
      <Plate name="parchment" now={t} />
      {MOVED.map(([old, now], i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const at = 0.12 + random(`mv-${i}`) * (big - 0.1);
        const p = ramp(t, at, 0.2, snap);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 90 + col * 356,
              top: 150 + row * 290,
              width: 330,
              textAlign: "center",
              opacity: 1 - slam * 0.78,
            }}
          >
            <div
              style={{
                opacity: 1 - p * 0.72,
                transform: `translateY(${-p * 54}px) scale(${1 - p * 0.3})`,
              }}
            >
              <Fig size={96} colour={p > 0.3 ? GHOST : INK}>
                {old}
              </Fig>
            </div>
            <div
              style={{
                opacity: p,
                marginTop: -40,
                transform: `scale(${1 + (1 - p) * 0.4})`,
              }}
            >
              <Fig size={104} colour={RUBRIC}>
                {now}
              </Fig>
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 300,
          textAlign: "center",
          opacity: slam,
          transform: `scale(${1.5 - slam * 0.5})`,
        }}
      >
        <Fig size={390} colour={INK}>
          6,840
        </Fig>
        <div
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 64,
            color: RUBRIC,
            opacity: ramp(t, B.stayed - B.numbers - 0.1, 0.3),
          }}
        >
          numbers changed, while the words around them stayed
        </div>
      </div>
      <Shade />
    </Cut>
  );
}
