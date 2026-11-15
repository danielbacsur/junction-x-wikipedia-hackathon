import { AbsoluteFill, random } from "remotion";

import { SHOTS, line, said } from "./clock";
import {
  CREAM,
  GHOST,
  INK,
  Plate,
  RUBRIC,
  Sheet,
  Written,
  caps,
  fell,
  garamond,
  ramp,
  settle,
  soft,
  track,
  useNow,
} from "./kit";

/**
 * Five moments of one paragraph of the Winter War article, oldest first.
 * The middle one is the day the question is asked about.
 */
const LEAVES = [
  { day: "13 Oct 2003", figure: "22 800", hand: "Cimon Avaro" },
  { day: "27 Sep 2006", figure: "26 600", hand: "an unnamed hand" },
  { day: "31 Dec 2007", figure: "26 600", hand: "Myllyre" },
  { day: "22 Aug 2009", figure: "26 662", hand: "an unnamed hand" },
  { day: "today", figure: "26 662", hand: "Jesper Vire" },
];

const WIDE = 330;
const TALL = 466;
const SLOTS = LEAVES.map((_, i) => ({
  x: 280 + i * 340,
  y: 600 + [30, 8, 0, 8, 30][i],
  turn: [-7, -3.5, 0, 3.5, 7][i],
}));

const number = (n: number) => Math.round(n).toLocaleString("en-US");

function Leaf({
  index,
  glow,
  ghosts,
}: {
  index: number;
  glow: number;

  /** How strongly the earlier figures show through, on the newest leaf. */
  ghosts: number;
}) {
  const leaf = LEAVES[index];

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 34,
          textAlign: "center",
          fontFamily: caps,
          fontSize: 24,
          letterSpacing: "0.12em",
          color: RUBRIC,
        }}
      >
        {leaf.day}
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 78,
          height: 2,
          background: RUBRIC,
          opacity: 0.5,
        }}
      />
      {ghosts > 0 &&
        ["22 800", "26 600"].map((old, depth) => (
          <div
            key={old}
            style={{
              position: "absolute",
              left: -14 * (2 - depth),
              right: 14 * (2 - depth),
              top: 112 - 10 * (2 - depth),
              textAlign: "center",
              fontFamily: garamond,
              fontSize: 98,
              color: GHOST,
              opacity: ghosts * 0.55,
              filter: "blur(0.5px)",
            }}
          >
            {old}
          </div>
        ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 112,
          textAlign: "center",
          fontFamily: garamond,
          fontSize: 98,
          color: INK,
          fontVariantNumeric: "lining-nums",
        }}
      >
        {leaf.figure}
      </div>
      {[0.82, 0.92, 0.7, 0.88, 0.5].map((wide, row) => (
        <div
          key={row}
          style={{
            position: "absolute",
            left: 44,
            top: 268 + row * 25,
            width: (WIDE - 88) * wide,
            height: 5,
            borderRadius: 4,
            background: GHOST,
            opacity: 0.34,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 406,
          textAlign: "center",
          fontFamily: fell,
          fontStyle: "italic",
          fontSize: 23,
          color: GHOST,
        }}
      >
        {leaf.hand}
      </div>

      {/* Light coming through the leaf. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 10,
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,244,205,0.55), rgba(255,244,205,0) 70%)",
          opacity: glow,
        }}
      />
    </>
  );
}

/** The page held up to the light, and its layers coming apart. */
export function Layers() {
  const now = useNow(SHOTS.layers);

  const held = line("light").start;
  const lit = said("light", "light");
  const fan = line("light").end + 0.45;
  const versions = line("versions").start;
  const kept = said("versions", "kept");
  const ask = line("ask").start;
  const chosen = said("ask", "any");
  const answers = said("ask", "gemini");
  const follow = line("follow").start;
  const hand = line("hand").start;

  const asking =
    ramp(now, chosen, 0.6, soft) * (1 - ramp(now, follow - 0.45, 0.5, soft));
  const counted = ramp(now, versions, 2.3, (n) => 1 - (1 - n) ** 3);
  const counting =
    ramp(now, versions - 0.2, 0.5) * (1 - ramp(now, ask - 0.4, 0.5));
  const thread = ramp(now, follow + 0.1, 1.9, soft);
  const bloom =
    ramp(now, lit - 0.3, 0.6) * (1 - ramp(now, lit + 0.5, 1.6)) * 0.85;

  const knots = SLOTS.map((slot) => ({ x: slot.x, y: slot.y - 2 }));
  const path = knots
    .map((knot, i) => {
      if (i === 0) return `M${knot.x} ${knot.y}`;

      const from = knots[i - 1];

      return `C${from.x + 110} ${from.y + 74}, ${knot.x - 110} ${knot.y + 74}, ${knot.x} ${knot.y}`;
    })
    .join(" ");

  return (
    <AbsoluteFill style={{ background: "#190f09" }}>
      <Plate
        name="glow"
        now={now}
        style={{
          transform: `scale(1.5) rotate(${Math.sin(now * 0.22) * 9}deg)`,
          opacity: 0.94,
        }}
      />

      <Plate
        name="parchment"
        now={now}
        style={{
          opacity: 1 - ramp(now, SHOTS.layers + 0.9, held + 0.9 - SHOTS.layers),
        }}
      />

      {/* Every other version, drifting in the light behind. */}
      {Array.from({ length: 110 }, (_, i) => {
        const depth = 0.35 + random(`far-d-${i}`) * 0.85;
        const x = random(`far-x-${i}`) * 2000 - 40;
        const y =
          ((((random(`far-y-${i}`) * 1240 - now * (10 + depth * 16)) % 1240) +
            1240) %
            1240) -
          80;
        const shown = ramp(now, versions - 0.3 + (i / 110) * 2.2, 0.6);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 46 * depth,
              height: 64 * depth,
              borderRadius: 3,
              background: `rgba(${238 - depth * 20},${214 - depth * 30},${160 - depth * 30},1)`,
              opacity: shown * (0.2 + depth * 0.4) * (1 - asking * 0.5),
              transform: `rotate(${(random(`far-r-${i}`) - 0.5) * 50 + now * (random(`far-w-${i}`) - 0.5) * 8}deg)`,
              filter: `blur(${(1.2 - depth) * 2.4}px)`,
              boxShadow: "0 6px 14px rgba(60,24,4,0.35)",
            }}
          />
        );
      })}

      {LEAVES.map((_, index) => {
        const hero = index === LEAVES.length - 1;
        const out = ramp(now, fan + (4 - index) * 0.07, 0.95, settle);

        if (!hero && out <= 0) return null;

        const slot = SLOTS[index];
        const grown = hero
          ? track(
              now,
              [SHOTS.layers, held + 1.55, fan, fan + 0.9],
              [4.3, 1.9, 1.7, 1],
            )
          : 0.6 + out * 0.4;
        const chosenOne = index === 2 ? asking : 0;
        const x = 960 + (slot.x - 960) * out;
        const lift = hero
          ? track(now, [SHOTS.layers + 0.3, held + 1.55], [270, 0])
          : 0;
        const y = 560 + (slot.y - 560) * out - chosenOne * 30 + lift;
        const turn = hero
          ? track(
              now,
              [SHOTS.layers, held + 1.55, fan, fan + 0.9],
              [0, -4, -4, slot.turn],
            )
          : slot.turn * out;

        return (
          <Sheet
            key={index}
            take={index % 2}
            style={{
              left: x - WIDE / 2,
              top: y - TALL / 2,
              width: WIDE,
              height: TALL,
              zIndex: chosenOne > 0 ? 6 : hero ? 4 : index,
              opacity:
                (hero ? 1 : Math.min(1, out * 2)) *
                (1 - (index === 2 ? 0 : asking) * 0.5),
              transform: `rotate(${turn}deg) scale(${grown * (1 + chosenOne * 0.2)})`,
            }}
          >
            <Leaf
              index={index}
              glow={0.35 + bloom * 0.6}
              ghosts={
                hero ? ramp(now, lit - 0.2, 0.7) * (1 - ramp(now, fan, 0.6)) : 0
              }
            />
          </Sheet>
        );
      })}

      {/* The light itself, as the page is lifted to it. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,250,225,0.95), rgba(255,236,180,0.25) 45%, rgba(255,236,180,0) 70%)",
          mixBlendMode: "screen",
          opacity: bloom,
        }}
      />

      {/* A ribbon on the day that was asked about. */}
      <svg
        width={40}
        height={150}
        viewBox="0 0 40 150"
        style={{
          position: "absolute",
          left: SLOTS[2].x + 78,
          top:
            SLOTS[2].y -
            TALL / 2 -
            70 -
            (1 - ramp(now, chosen, 0.5, settle)) * 220 -
            asking * 60,
          zIndex: 7,
          opacity: asking > 0 ? 1 : 0,
          filter: "drop-shadow(4px 8px 6px rgba(40,10,0,0.45))",
        }}
      >
        <path d="M0 0 H40 V150 L20 126 L0 150 Z" fill={RUBRIC} />
        <path d="M6 0 V136" stroke="#c9553c" strokeWidth={3} />
      </svg>

      {/* One claim, stitched through every rewriting. */}
      <svg
        width={1920}
        height={1080}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 8,
          opacity: 1 - asking,
        }}
      >
        <path
          d={path}
          pathLength={1}
          fill="none"
          stroke={RUBRIC}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={1 - thread}
          style={{ filter: "drop-shadow(0 4px 4px rgba(40,10,0,0.5))" }}
        />
        {knots.map((knot, i) => {
          const tied = ramp(
            now,
            follow + 0.1 + (i / 4) * 1.9 - 0.05,
            0.25,
            settle,
          );

          return (
            <circle
              key={i}
              cx={knot.x}
              cy={knot.y}
              r={13 * tied}
              fill={RUBRIC}
              stroke={CREAM}
              strokeWidth={3}
            />
          );
        })}
      </svg>

      {/* What is written above the leaves. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 52,
          textAlign: "center",
          zIndex: 9,
          opacity: counting,
          textShadow: "0 4px 24px rgba(40,14,0,0.85)",
        }}
      >
        <div
          style={{
            fontFamily: garamond,
            fontSize: 176,
            lineHeight: 1,
            color: CREAM,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {number(counted * 862_076)}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: caps,
            fontSize: 36,
            letterSpacing: "0.14em",
            color: CREAM,
            opacity: ramp(now, versions + 2.0, 0.6),
          }}
        >
          versions of 19,742 articles · 2003 to 2026
        </div>
      </div>

      {/* A seal: every layer is kept. */}
      <div
        style={{
          position: "absolute",
          left: 1520,
          top: 70,
          width: 210,
          height: 210,
          borderRadius: 210,
          zIndex: 9,
          background: `radial-gradient(circle at 38% 34%, #c2452c, ${RUBRIC} 55%, #6d1b0d)`,
          boxShadow:
            "0 14px 30px rgba(40,10,0,0.6), inset 0 0 0 8px rgba(90,20,8,0.55)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: ramp(now, kept, 0.12) * (1 - ramp(now, ask - 0.4, 0.5)),
          transform: `rotate(-11deg) scale(${2.1 - ramp(now, kept, 0.28, settle) * 1.1})`,
        }}
      >
        <div
          style={{
            fontFamily: caps,
            fontSize: 20,
            lineHeight: 1.25,
            letterSpacing: "0.14em",
            textAlign: "center",
            color: "#f3c9b0",
          }}
        >
          every layer
          <br />
          kept in
        </div>
        <div
          style={{
            fontFamily: fell,
            fontSize: 50,
            color: CREAM,
            lineHeight: 1.1,
          }}
        >
          MariaDB
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 64,
          textAlign: "center",
          zIndex: 9,
          opacity: ramp(now, ask, 0.3) * (1 - ramp(now, follow - 0.45, 0.4)),
          textShadow: "0 4px 24px rgba(40,14,0,0.9)",
        }}
      >
        <div
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 78,
            color: CREAM,
          }}
        >
          <Written now={now} from={ask + 0.15} until={ask + 1.5} quill={0}>
            “How many Finns died in the Winter War?”
          </Written>
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: caps,
            fontSize: 34,
            letterSpacing: "0.14em",
            color: "#ffd9b0",
            opacity: ramp(now, chosen, 0.5),
          }}
        >
          asked of Wikipedia as it stood on 31 December 2007
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 884,
          textAlign: "center",
          zIndex: 9,
          opacity:
            ramp(now, answers, 0.4) * (1 - ramp(now, follow - 0.45, 0.4)),
          textShadow: "0 4px 24px rgba(40,14,0,0.9)",
        }}
      >
        <div
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 70,
            color: CREAM,
          }}
        >
          <Written
            now={now}
            from={answers + 0.2}
            until={answers + 1.6}
            quill={0}
          >
            “On that day, Wikipedia said 26 600.”
          </Written>
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: caps,
            fontSize: 30,
            letterSpacing: "0.14em",
            color: "#ffd9b0",
            opacity: ramp(now, said("ask", "words"), 0.5),
          }}
        >
          answered by Gemini, from the words that stood there
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 96,
          textAlign: "center",
          zIndex: 9,
          fontFamily: fell,
          fontStyle: "italic",
          fontSize: 76,
          color: CREAM,
          textShadow: "0 4px 24px rgba(40,14,0,0.9)",
          opacity: ramp(now, follow + 0.5, 0.6),
        }}
      >
        one claim · eighteen wordings · three numbers
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 880,
          textAlign: "center",
          zIndex: 9,
          textShadow: "0 4px 24px rgba(40,14,0,0.9)",
          opacity: ramp(now, hand + 0.3, 0.5),
        }}
      >
        <div
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 62,
            color: CREAM,
          }}
        >
          <Written now={now} from={hand + 0.35} until={hand + 1.9} quill={0}>
            removed 11 January 2008 at 18:43:29 · back at 18:45:24
          </Written>
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: caps,
            fontSize: 30,
            letterSpacing: "0.14em",
            color: "#ffd9b0",
            opacity: ramp(now, hand + 1.7, 0.5),
          }}
        >
          the 2007 wording · written by Myllyre, 15 September at 15:23:16
        </div>
      </div>

      <svg
        width={1920}
        height={1080}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 8,
          opacity: ramp(now, hand + 0.2, 0.4),
        }}
      >
        <path
          d={`M${SLOTS[2].x} ${SLOTS[2].y + TALL / 2 + 6} V 872`}
          stroke={CREAM}
          strokeWidth={3}
          strokeDasharray="6 9"
        />
      </svg>

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(20,8,2,0.55) 100%)",
          zIndex: 10,
        }}
      />
    </AbsoluteFill>
  );
}
