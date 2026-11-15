import { AbsoluteFill } from "remotion";

import {
  CREAM,
  GHOST,
  INK,
  Plate,
  RUBRIC,
  Scraped,
  Sheet,
  Written,
  caps,
  fell,
  fraktur,
  ramp,
  track,
} from "../film/kit";
import { B } from "./beats";
import type { Shot } from "./parts";
import { Caption, Cut, Fig, Flurry, Night, Shade, snap } from "./parts";

/** The days on which each of the eighteen wordings appeared, as years. */
const REWORDED = [
  2003.78, 2004.52, 2004.64, 2004.72, 2004.97, 2005.36, 2005.38, 2005.39,
  2005.44, 2006.74, 2007.14, 2007.63, 2007.71, 2009.64, 2009.7, 2014.65,
  2019.76, 2026.69,
];

/** One sentence: its figure today, its rewordings, and the figures before. */
export function OneSentence({ t }: Shot) {
  const reworded = B.eighteen - B.one;
  const under = B.three - B.one;
  const shown = ramp(t, under, 0.35, snap);

  return (
    <Cut t={t} flash={0} kick={0.1} origin="50% 45%">
      <AbsoluteFill
        style={{
          transformOrigin: "50% 44%",
          transform: `scale(${1 + shown * 0.06})`,
        }}
      >
        <Plate name="parchment" now={t} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 120,
            textAlign: "center",
            fontFamily: caps,
            fontSize: 38,
            letterSpacing: "0.14em",
            color: RUBRIC,
            opacity: ramp(t, 0.2, 0.4),
          }}
        >
          one sentence · Wikipedia · the Winter War
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 196,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 58,
            color: INK,
          }}
        >
          <Written now={t} from={0.5} until={2.3} quill={0}>
            Suomalaisten tappiot talvisodassa olivat
          </Written>
        </div>
        {[
          { figure: "22 800", depth: 2 },
          { figure: "26 600", depth: 1 },
        ].map((old) => (
          <div
            key={old.figure}
            style={{
              position: "absolute",
              left: -old.depth * 56 * shown,
              right: old.depth * 56 * shown,
              top: 290 - old.depth * 66 * shown,
              textAlign: "center",
              opacity: shown * 0.5,
            }}
          >
            <Fig size={360} colour={GHOST}>
              {old.figure}
            </Fig>
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 290,
            textAlign: "center",
          }}
        >
          <Fig size={360} colour={INK}>
            <Written now={t} from={2.2} until={3.4} quill={2.2}>
              26 662
            </Written>
          </Fig>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 690,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 58,
            color: INK,
            opacity: ramp(t, 3.3, 0.5),
          }}
        >
          sotatoimissa kuollutta ja noin tuhat siviiliä.
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 772,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 40,
            color: GHOST,
            opacity: ramp(t, B.about - B.one, 0.6),
          }}
        >
          “Finnish losses in the Winter War were 26 662 killed in action, and
          about a thousand civilians.”
        </div>

        {/* One mark for each wording of the sentence, 2003 to 2026. */}
        <div
          style={{
            position: "absolute",
            left: 360,
            width: 1200,
            top: 842,
            height: 3,
            background: RUBRIC,
            opacity: ramp(t, reworded - 0.6, 0.4) * 0.5,
          }}
        />
        {REWORDED.map((year, i) => {
          const p = ramp(t, reworded - 0.45 + i * 0.05, 0.2, snap);

          return (
            <div
              key={year}
              style={{
                position: "absolute",
                left: 360 + ((year - 2003) / 24) * 1200 - 7,
                top: 843 - 22 * p,
                width: 14,
                height: 44 * p,
                borderRadius: 7,
                background: RUBRIC,
                opacity: p,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 892,
            textAlign: "center",
            fontFamily: caps,
            fontSize: 36,
            letterSpacing: "0.12em",
            color: RUBRIC,
            opacity: ramp(t, reworded + 0.2, 0.4),
          }}
        >
          {t < under
            ? "18 wordings · 2003 to 2026"
            : "22 800 in 2003 · 26 600 in 2006 · 26 662 since 2009"}
        </div>
      </AbsoluteFill>
      <Shade />
    </Cut>
  );
}

/** Every version at once, rushing past, and the count of them. */
export function Count({ t, d }: Shot) {
  const done = B.counted - B.flurry + 0.25;
  const counted = ramp(t, 0.05, done, (n) => 1 - (1 - n) ** 3);
  const slam = ramp(t, done, 0.25, snap);

  return (
    <Cut t={t} kick={0.14}>
      <Plate name="glow" now={t} style={{ transform: "scale(1.5)" }} />
      <Flurry t={t} count={170} speed={0.75} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 330,
          textAlign: "center",
          transform: `scale(${1 + (1 - slam) * 0.12 * (t >= done ? 1 : 0)})`,
          textShadow: "0 8px 60px rgba(40,14,0,0.95)",
        }}
      >
        <Fig size={340} colour={CREAM}>
          {Math.round(counted * 862_076).toLocaleString("en-US")}
        </Fig>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 700,
          textAlign: "center",
          opacity: ramp(t, done - 0.15, 0.25),
          transform: `translateY(${(1 - ramp(t, done - 0.15, 0.3, snap)) * 20}px)`,
        }}
      >
        <span
          style={{
            display: "inline-block",
            background: "rgba(34,14,3,0.7)",
            borderRadius: 22,
            padding: "14px 52px 22px",
            boxShadow: "0 10px 40px rgba(20,8,0,0.5)",
          }}
        >
          <span
            style={{
              fontFamily: fell,
              fontStyle: "italic",
              fontSize: 74,
              color: CREAM,
            }}
          >
            versions of{" "}
            <Fig size={74} colour={CREAM}>
              19,742
            </Fig>{" "}
            articles
          </span>
          <span
            style={{
              display: "block",
              fontFamily: caps,
              fontSize: 38,
              letterSpacing: "0.14em",
              color: "#ffd9b0",
              opacity: ramp(t, B.finland - B.flurry - 0.05, 0.3),
            }}
          >
            Finnish Wikipedia · 2003 to 2026
          </span>
        </span>
      </div>
      <Shade strength={0.5} />
    </Cut>
  );
}

/** The scriptorium by candlelight, and the word for what its pages are. */
export function Scriptorium({ t }: Shot) {
  const word = B.word - B.room;

  return (
    <Cut t={t} kick={0.05} creep={0.05}>
      <AbsoluteFill
        style={{ transformOrigin: "50% 62%", transform: "scale(1.04)" }}
      >
        <Night now={B.room + t} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(12,6,2,0) 38%, rgba(12,6,2,0.9) 84%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 716,
          textAlign: "center",
          fontFamily: fell,
          fontStyle: "italic",
          fontSize: 230,
          lineHeight: 1,
          color: CREAM,
          textShadow: "0 6px 44px rgba(20,8,0,0.95)",
        }}
      >
        <Written now={t} from={word - 0.15} until={word + 0.5} quill={1.6}>
          palimpsest
        </Written>
      </div>
    </Cut>
  );
}

/** One page: scraped, written over, and the old line showing through. */
export function ScribePage({ t }: Shot) {
  const scraped = B.scraped - B.page;
  const wrote = B.wrote - B.page;
  const ghostly = B.ghost - B.page;
  const look = ramp(t, ghostly, 0.25);
  const ghost = 0.24 + look * 0.46;
  const fresh = 1 - look * 0.62;

  // The picture jumps closer when the old words come back, as if cut.
  const zoom = t < ghostly ? 1.02 + t * 0.02 : 1.2 + (t - ghostly) * 0.03;
  const hit = [0, wrote, ghostly].reduce(
    (most, at) =>
      t >= at && t - at < 0.1 ? Math.max(most, 1 - (t - at) / 0.1) : most,
    0,
  );
  const old = { fontFamily: fraktur, color: "#3a2210", lineHeight: 1 };
  const hand = {
    position: "absolute" as const,
    fontFamily: fell,
    fontStyle: "italic" as const,
    fontSize: 158,
    lineHeight: 1,
    color: "#170b04",
    opacity: fresh,
  };

  return (
    <AbsoluteFill style={{ background: "#120a05" }}>
      <AbsoluteFill
        style={{ transformOrigin: "50% 44%", transform: `scale(${zoom})` }}
      >
        <Plate name="parchment" now={t} />
        <div style={{ position: "absolute", left: 300, top: 170, ...old }}>
          <Scraped
            now={t}
            from={scraped - 0.05}
            until={scraped + 0.12}
            ghost={ghost}
            blade={0}
            seed="i"
            style={{ fontSize: 340, color: RUBRIC }}
          >
            V
          </Scraped>
        </div>
        <div style={{ position: "absolute", left: 520, top: 262, ...old }}>
          <Scraped
            now={t}
            from={scraped - 0.02}
            until={scraped + 0.32}
            ghost={ghost}
            blade={1.6}
            seed="a"
            style={{ fontSize: 176 }}
          >
            erba volant,
          </Scraped>
        </div>
        <div style={{ position: "absolute", left: 330, top: 492, ...old }}>
          <Scraped
            now={t}
            from={scraped + 0.24}
            until={scraped + 0.58}
            ghost={ghost}
            blade={1.6}
            seed="b"
            style={{ fontSize: 176 }}
          >
            scripta manent.
          </Scraped>
        </div>

        <div style={{ ...hand, left: 372, top: 318 }}>
          <Written now={t} from={wrote} until={wrote + 0.42} quill={1.6}>
            Incipit liber novus,
          </Written>
        </div>
        <div style={{ ...hand, left: 430, top: 546 }}>
          <Written now={t} from={wrote + 0.4} until={wrote + 0.85} quill={1.6}>
            anno Domini mxxvi.
          </Written>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 730,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 60,
            color: RUBRIC,
            opacity: look,
          }}
        >
          scripta manent · what is written, remains
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 880,
            textAlign: "center",
            fontFamily: caps,
            fontSize: 38,
            letterSpacing: "0.12em",
            color: INK,
            opacity: ramp(t, 0.15, 0.3) * 0.85,
          }}
        >
          palimpsest · a page written on twice, the first writing never gone
        </div>
      </AbsoluteFill>
      <Shade />
      <AbsoluteFill style={{ background: "#fff1cf", opacity: hit * 0.4 }} />
    </AbsoluteFill>
  );
}
