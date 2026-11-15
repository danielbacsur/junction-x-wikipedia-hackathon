import { AbsoluteFill, Easing } from "remotion";

import {
  CREAM,
  GHOST,
  INK,
  Plate,
  Quill,
  RUBRIC,
  Sheet,
  Written,
  caps,
  fell,
  ramp,
  soft,
  track,
} from "../film/kit";
import { B } from "./beats";
import type { Shot } from "./parts";
import { Caption, Cut, Fig, GREEN, Lines, Shade, snap } from "./parts";

const heading = {
  position: "absolute" as const,
  left: 0,
  right: 0,
  textAlign: "center" as const,
  fontFamily: caps,
  letterSpacing: "0.12em",
  color: RUBRIC,
};

/** Any article, on any day: the year turns and the page changes with it. */
export function AnyDay({ t }: Shot) {
  const land = B.day - B.open;
  const stops = [0.3, land * 0.55, land * 0.68, land];
  const year = track(t, stops, [2026.75, 2003.8, 2003.8, 2007.99], soft);
  const figure =
    year >= 2009.64 ? "26 662" : year >= 2006.74 ? "26 600" : "22 800";
  const hand =
    year >= 2026.69
      ? "Jesper Vire"
      : year >= 2009.64
        ? "an unnamed hand"
        : year >= 2007.71
          ? "Myllyre"
          : year >= 2006.74
            ? "an unnamed hand"
            : "Cimon Avaro";
  const rows = 3 + ((year - 2003) / 24) * 15;
  const speed = Math.abs(
    track(t + 0.03, stops, [2026.75, 2003.8, 2003.8, 2007.99], soft) - year,
  );
  const landed = ramp(t, land - 0.05, 0.25, snap);
  const quick = ramp(t, B.quick - B.open - 0.05, 0.25, snap);

  return (
    <Cut t={t}>
      <Plate name="desk" now={t} />
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 230,
          width: 760,
          textAlign: "center",
          textShadow: "0 6px 40px rgba(10,4,0,0.9)",
        }}
      >
        <div
          style={{
            fontFamily: caps,
            fontSize: 40,
            letterSpacing: "0.14em",
            color: "#ffd9b0",
          }}
        >
          Wikipedia, as it stood in
        </div>
        <div
          style={{
            filter: `blur(${Math.min(9, speed * 14)}px)`,
            transform: `scale(${1 + landed * 0.06})`,
          }}
        >
          <Fig size={370} colour={CREAM}>
            {Math.floor(year)}
          </Fig>
        </div>
        <div
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 60,
            color: CREAM,
            opacity: landed,
          }}
        >
          on the 31st of December
        </div>
        <div
          style={{
            marginTop: 30,
            opacity: Math.min(1, quick * 2),
            transform: `scale(${1.35 - quick * 0.35})`,
          }}
        >
          <Fig size={132} colour="#ffd9b0">
            9 ms
          </Fig>
          <div
            style={{
              fontFamily: caps,
              fontSize: 34,
              letterSpacing: "0.14em",
              color: "#ffd9b0",
            }}
          >
            to bring the page back
          </div>
        </div>
      </div>

      <Sheet
        style={{
          left: 980,
          top: 70,
          width: 780,
          height: 930,
          transform: `rotate(${2 + speed * 3}deg)`,
        }}
      >
        <div style={{ ...heading, top: 48, fontSize: 38 }}>Talvisota</div>
        <div
          style={{
            position: "absolute",
            left: 150,
            right: 150,
            top: 104,
            height: 3,
            background: RUBRIC,
            opacity: 0.5,
          }}
        />
        <Lines
          rows={4}
          shown={Math.min(4, rows)}
          left={90}
          top={150}
          wide={600}
          seed="top"
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 268,
            textAlign: "center",
          }}
        >
          <Fig size={190} colour={INK}>
            {figure}
          </Fig>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 476,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 36,
            color: GHOST,
          }}
        >
          written by {hand}
        </div>
        <Lines
          rows={14}
          shown={rows - 4}
          left={90}
          top={560}
          wide={600}
          seed="rest"
        />
      </Sheet>
      <Caption t={t} at={0.3}>
        any article · any day since 2003
      </Caption>
      <Shade strength={0.45} />
    </Cut>
  );
}

/** Two days of one sentence, and every word that differs between them. */
const BEFORE = [
  ["Suomalaisten tappiot talvisodassa olivat "],
  ["26 600", 0],
  [" sotatoimissa "],
  ["menehtynyttä", 1],
  [" ja noin "],
  ["1 000", 2],
  [" siviiliä."],
] as const;
const AFTER = ["26 662", "kuollutta", "tuhat"];

export function SideBySide({ t }: Shot) {
  const see = B.see - B.diff;
  const marks = [see, see + 0.38, see + 0.76];
  const found = marks.filter((at) => t >= at).length;

  const leaf = (now: boolean) => (
    <Sheet
      take={now ? 1 : 0}
      style={{
        left: now ? 1000 : 100,
        top: 190,
        width: 820,
        height: 620,
        transform: `translateX(${(1 - ramp(t, now ? B.next - B.diff - 0.1 : 0.05, 0.4, snap)) * (now ? 1000 : -900)}px) rotate(${now ? 2 : -2}deg)`,
      }}
    >
      <div style={{ ...heading, top: 44, fontSize: 36 }}>
        {now ? "today" : "31 December 2007"}
      </div>
      <div
        style={{
          position: "absolute",
          left: 190,
          right: 190,
          top: 98,
          height: 3,
          background: RUBRIC,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 150,
          fontFamily: fell,
          fontSize: 60,
          lineHeight: 1.42,
          color: INK,
        }}
      >
        {BEFORE.map(([text, change], index) => {
          if (change === undefined) return <span key={index}>{text}</span>;

          const p = ramp(t, marks[change], 0.22, snap);

          return now ? (
            <span
              key={index}
              style={{
                color: p > 0.3 ? GREEN : INK,
                background: `rgba(47,107,79,${0.2 * p})`,
                borderRadius: 8,
                boxShadow: `0 ${5 * p}px 0 ${GREEN}`,
                display: "inline-block",
                transform: `scale(${1 + (p > 0 && p < 1 ? (1 - p) * 0.25 : 0)})`,
                whiteSpace: "nowrap",
              }}
            >
              {AFTER[change]}
            </span>
          ) : (
            <span
              key={index}
              style={{
                position: "relative",
                color: p > 0.3 ? RUBRIC : INK,
                background: `rgba(160,44,24,${0.16 * p})`,
                borderRadius: 8,
                whiteSpace: "nowrap",
              }}
            >
              {text}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "52%",
                  height: 6,
                  width: `${p * 100}%`,
                  background: RUBRIC,
                  borderRadius: 4,
                }}
              />
            </span>
          );
        })}
      </div>
    </Sheet>
  );

  return (
    <Cut t={t}>
      <Plate name="desk" now={t} />
      {leaf(false)}
      {leaf(true)}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 62,
          textAlign: "center",
          textShadow: "0 4px 26px rgba(10,4,0,0.95)",
          opacity: ramp(t, see - 0.1, 0.2),
        }}
      >
        <Fig size={104} colour={CREAM}>
          {found}
        </Fig>
        <span
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 70,
            color: CREAM,
          }}
        >
          {" "}
          {found === 1 ? "word" : "words"} changed
        </span>
      </div>
      <Caption t={t} at={0.25} top={870}>
        two days, side by side · every word that changed
      </Caption>
      <Shade strength={0.45} />
    </Cut>
  );
}

/** The same question asked of today, and how far the answer has moved. */
export function TwoDays({ t }: Shot) {
  const now = B.today - B.twice;
  const higher = B.higher - B.twice;

  const answer = (today: boolean) => {
    const dealt = today ? 0.2 : 0.05;
    const p = ramp(t, dealt, 0.35, snap);
    const shown = today ? ramp(t, now + 0.4, 0.3) : 1;

    if (t < dealt) return null;

    return (
      <Sheet
        take={today ? 1 : 0}
        style={{
          left: today ? 1010 : 230,
          top: 300,
          width: 680,
          height: 560,
          transform: `translateY(${(1 - p) * -560}px) rotate(${(today ? 2.5 : -2.5) * p + (1 - p) * 14}deg)`,
        }}
      >
        <div style={{ ...heading, top: 44, fontSize: 34 }}>
          {today ? "Wikipedia today" : "Wikipedia on 31 Dec 2007"}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 120,
            textAlign: "center",
          }}
        >
          <Fig size={210} colour={INK}>
            {today ? (
              <Written now={t} from={now - 0.05} until={now + 0.5} quill={1.6}>
                26 662
              </Written>
            ) : (
              "26 600"
            )}
          </Fig>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 350,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 44,
            color: INK,
            opacity: shown,
          }}
        >
          killed in action
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 446,
            textAlign: "center",
            fontFamily: caps,
            fontSize: 26,
            letterSpacing: "0.1em",
            color: GHOST,
            opacity: shown,
          }}
        >
          ¹ cited · the paragraph that stood that day
        </div>
      </Sheet>
    );
  };

  return (
    <Cut t={t}>
      <Plate name="desk" now={t} />
      <Sheet style={{ left: 250, top: 76, width: 1420, height: 156 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 30,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 80,
            color: INK,
          }}
        >
          How many Finns died in the Winter War?
        </div>
      </Sheet>
      {answer(false)}
      {answer(true)}
      <div
        style={{
          position: "absolute",
          left: 960 - 115,
          top: 668,
          width: 230,
          height: 230,
          borderRadius: 230,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 38% 34%, #c8492f, ${RUBRIC} 55%, #651708)`,
          boxShadow:
            "0 14px 34px rgba(30,8,0,0.7), inset 0 0 0 10px rgba(90,20,8,0.6)",
          opacity: Math.min(1, ramp(t, higher - 0.1, 0.2) * 2),
          transform: `rotate(-6deg) scale(${1.6 - ramp(t, higher - 0.1, 0.3, snap) * 0.6})`,
        }}
      >
        <Fig size={104} colour={CREAM}>
          +62
        </Fig>
      </div>
      <Caption t={t} at={0.2} top={900}>
        one question · the answer from each day&apos;s words
      </Caption>
      <Shade strength={0.45} />
    </Cut>
  );
}

/** Every wording of one claim, newest first, as the history holds them. */
const WORDINGS = [
  ["13 Oct 2003", "22 800", "Cimon Avaro"],
  ["10 Jul 2004", "22 800", "Hautala"],
  ["22 Aug 2004", "22 800", "an unnamed hand"],
  ["22 Sep 2004", "22 800", "an unnamed hand"],
  ["21 Dec 2004", "22 800", "Hautala"],
  ["12 May 2005", "22 800", "an unnamed hand"],
  ["17 May 2005", "22 800", "Hautala"],
  ["22 May 2005", "22 800", "Ppntori"],
  ["10 Jun 2005", "22 800", "an unnamed hand"],
  ["27 Sep 2006", "26 600", "an unnamed hand"],
  ["20 Feb 2007", "26 600", "Skarabe"],
  ["19 Aug 2007", "26 600", "Wm313"],
  ["15 Sep 2007", "26 600", "Myllyre"],
  ["22 Aug 2009", "26 662", "an unnamed hand"],
  ["11 Sep 2009", "26 662", "New Samppi"],
  ["25 Aug 2014", "26 662", "Haltiamieli"],
  ["5 Oct 2019", "26 662", "Matthäus Gehägeberg"],
  ["9 Sep 2026", "26 662", "Jesper Vire"],
];
const STRIDE = 330;

export function FollowTheClaim({ t, d }: Shot) {
  const follow = B.follow - B.trace;
  const back = B.back - B.trace;
  const last = (WORDINGS.length - 1) * STRIDE;
  const camera = track(
    t,
    [follow - 0.2, back + 0.55],
    [last - 520, 0],
    Easing.inOut(Easing.quad),
  );
  const arrived = ramp(t, back + 0.5, 0.35, snap);
  const passed = WORDINGS.filter((_, i) => i * STRIDE >= camera - 40).length;
  const knot = (i: number) => ({
    x: i * STRIDE,
    y: 628 + Math.sin(i * 1.7) * 18,
  });

  return (
    <Cut t={t}>
      <Plate name="desk" now={t} />
      <AbsoluteFill
        style={{ transform: `translateX(${960 - camera - arrived * 250}px)` }}
      >
        {WORDINGS.map(([day, figure, hand], i) => {
          const first = i === 0 ? arrived : 0;
          const here = Math.abs(i * STRIDE - camera) < 1300;

          if (!here) return null;

          return (
            <Sheet
              key={day}
              take={i % 2}
              style={{
                left: i * STRIDE - 140,
                top: 410 + Math.sin(i * 1.7) * 18 - first * 40,
                width: 280,
                height: 380,
                zIndex: i === 0 ? 5 : 1,
                transform: `rotate(${Math.sin(i * 2.3) * 4}deg) scale(${1 + first * 0.7})`,
                opacity: i === 0 ? 1 : 1 - arrived * 0.9,
              }}
            >
              <div style={{ ...heading, top: 30, fontSize: 21 }}>{day}</div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 96,
                  textAlign: "center",
                }}
              >
                <Fig size={84} colour={INK}>
                  {figure}
                </Fig>
              </div>
              <Lines
                rows={4}
                left={40}
                top={220}
                wide={200}
                gap={22}
                seed={day}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 322,
                  textAlign: "center",
                  fontFamily: fell,
                  fontStyle: "italic",
                  fontSize: 21,
                  color: GHOST,
                }}
              >
                {hand}
              </div>
            </Sheet>
          );
        })}

        {/* The red thread, running back through every one of them. */}
        <svg
          width={last + 600}
          height={1080}
          style={{
            position: "absolute",
            left: -300,
            top: 0,
            zIndex: 6,
            overflow: "visible",
          }}
        >
          <path
            d={WORDINGS.map((_, i) => {
              const at = knot(WORDINGS.length - 1 - i);
              const from = knot(WORDINGS.length - i);

              return i === 0
                ? `M${at.x + 300} ${at.y}`
                : `C${from.x + 300 - 110} ${from.y + 70}, ${at.x + 300 + 110} ${at.y + 70}, ${at.x + 300} ${at.y}`;
            }).join(" ")}
            pathLength={1}
            fill="none"
            stroke={RUBRIC}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={1}
            strokeDashoffset={Math.max(0, (camera - 140) / last)}
            opacity={1 - arrived * 0.7}
            style={{ filter: "drop-shadow(0 5px 5px rgba(30,8,0,0.6))" }}
          />
          {WORDINGS.map((_, i) => {
            const at = knot(i);

            return i * STRIDE >= camera - 140 ? (
              <circle
                key={i}
                cx={at.x + 300}
                cy={at.y}
                r={13}
                fill={RUBRIC}
                stroke={CREAM}
                strokeWidth={3}
              />
            ) : null;
          })}
        </svg>
      </AbsoluteFill>

      <Sheet style={{ left: 330, top: 56, width: 1260, height: 132 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 30,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 58,
            color: INK,
          }}
        >
          “26 662 Finnish soldiers died in the Winter War.”
        </div>
      </Sheet>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 222,
          textAlign: "center",
          fontFamily: caps,
          fontSize: 40,
          letterSpacing: "0.14em",
          color: CREAM,
          textShadow: "0 3px 18px rgba(10,4,0,0.95)",
          opacity: ramp(t, follow - 0.2, 0.3) * (1 - arrived),
        }}
      >
        {passed} of 18 wordings · 3 figures · 23 years
      </div>

      {arrived > 0 && (
        <>
          <Quill
            now={t}
            scale={1.05}
            style={{ left: 560, top: 806, opacity: arrived }}
          />
          <div
            style={{
              position: "absolute",
              left: 1010,
              right: 60,
              top: 400,
              fontFamily: fell,
              fontStyle: "italic",
              fontSize: 76,
              lineHeight: 1.15,
              color: CREAM,
              textShadow: "0 4px 26px rgba(10,4,0,0.95)",
              opacity: arrived,
            }}
          >
            first written
            <br />
            13 October 2003
            <br />
            <span style={{ color: "#ffd9b0" }}>by Cimon Avaro</span>
          </div>
        </>
      )}
      <Shade strength={0.45} />
    </Cut>
  );
}
