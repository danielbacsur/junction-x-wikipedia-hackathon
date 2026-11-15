import { Easing, random } from "remotion";

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
  ramp,
} from "../film/kit";
import { B } from "./beats";
import type { Shot } from "./parts";
import { Caption, Cut, Fig, GREEN, Seal, Shade, Spark, snap } from "./parts";

const GOLD = "#ffcf70";
const LIVE = "#8fd6b4";

/**
 * How one paragraph is kept: a row for every stretch a wording stood,
 * with the moment it appeared and the moment it was replaced. These are
 * the real rows of the paragraph on losses, from September 2007 on.
 */
const ROWS = [
  [
    "…olivat 26 600 sotatoimissa…",
    "15 Sep 2007 · 15:23:16",
    "11 Jan 2008 · 18:43:29",
  ],
  [
    "…olivat 26 600 sotatoimissa…",
    "11 Jan 2008 · 18:45:24",
    "4 Nov 2008 · 15:20:57",
  ],
  [
    "…olivat 26 600 sotatoimissa…",
    "4 Nov 2008 · 15:21:12",
    "22 Aug 2009 · 10:30:30",
  ],
  [
    "…olivat 26662 sotatoimissa…",
    "22 Aug 2009 · 10:30:30",
    "11 Sep 2009 · 16:11:45",
  ],
  [
    "…olivat 26 662 sotatoimissa…",
    "11 Sep 2009 · 16:11:45",
    "25 Aug 2014 · 16:40:23",
  ],
];

const LEFT = 150;
const COLUMNS = [LEFT, 870, 1330];
const TOP = 352;
const STEP = 92;

export function Rows({ t }: Shot) {
  const versioned = B.versioned - B.rows;
  const appeared = B.appeared - B.rows;
  const replaced = B.replaced - B.rows;
  const from =
    ramp(t, appeared - 0.1, 0.3, snap) * (1 - ramp(t, replaced - 0.15, 0.2));
  const until = ramp(t, replaced - 0.1, 0.3, snap);
  const counted = ramp(t, versioned, 1.4, (n) => 1 - (1 - n) ** 3);

  return (
    <Cut t={t} kick={0.1}>
      <Plate name="parchment" now={t} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 120,
          textAlign: "center",
          fontFamily: caps,
          fontSize: 40,
          letterSpacing: "0.14em",
          color: RUBRIC,
        }}
      >
        one paragraph · a row for every wording
      </div>

      {["the wording", "appeared", "replaced"].map((head, column) => (
        <div
          key={head}
          style={{
            position: "absolute",
            left: COLUMNS[column],
            top: 262,
            fontFamily: caps,
            fontSize: 34,
            letterSpacing: "0.12em",
            color:
              column === 1 && from > 0.5
                ? GREEN
                : column === 2 && until > 0.5
                  ? RUBRIC
                  : INK,
            opacity: 0.9,
          }}
        >
          {head}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: LEFT,
          right: LEFT,
          top: 320,
          height: 4,
          background: INK,
          opacity: 0.7,
        }}
      />

      {/* What the voice is pointing at: one column, then the other. */}
      <div
        style={{
          position: "absolute",
          left: COLUMNS[1] - 24,
          top: 250,
          width: 440,
          height: 566,
          borderRadius: 16,
          background: "rgba(47,107,79,0.16)",
          boxShadow: `0 0 0 4px ${GREEN}`,
          opacity: from,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: COLUMNS[2] - 24,
          top: 250,
          width: 460,
          height: 566,
          borderRadius: 16,
          background: "rgba(160,44,24,0.14)",
          boxShadow: `0 0 0 4px ${RUBRIC}`,
          opacity: until,
        }}
      />

      {ROWS.map(([wording, start, end], row) => {
        const p = ramp(t, 0.15 + row * 0.14, 0.3, snap);

        return (
          <div
            key={row}
            style={{ opacity: p, transform: `translateY(${(1 - p) * 26}px)` }}
          >
            <div
              style={{
                position: "absolute",
                left: COLUMNS[0],
                top: TOP + row * STEP,
                fontFamily: fell,
                fontStyle: "italic",
                fontSize: 46,
                color: INK,
                whiteSpace: "nowrap",
              }}
            >
              {wording}
            </div>
            <div
              style={{
                position: "absolute",
                left: COLUMNS[1],
                top: TOP + row * STEP,
              }}
            >
              <Fig size={44} colour={INK}>
                {start}
              </Fig>
            </div>
            <div
              style={{
                position: "absolute",
                left: COLUMNS[2],
                top: TOP + row * STEP,
              }}
            >
              <Fig size={44} colour={INK}>
                {end}
              </Fig>
            </div>
            <div
              style={{
                position: "absolute",
                left: LEFT,
                right: LEFT,
                top: TOP + row * STEP + 72,
                height: 2,
                background: INK,
                opacity: 0.22,
              }}
            />
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 868,
          textAlign: "center",
          opacity: ramp(t, versioned - 0.1, 0.3),
        }}
      >
        <Fig size={88} colour={RUBRIC}>
          {Math.round(counted * 2_972_662).toLocaleString("en-US")}
        </Fig>
        <span
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 56,
            color: INK,
          }}
        >
          {" "}
          rows like these, in one system-versioned table
        </span>
      </div>
      <Seal
        t={t}
        at={B.maria - B.rows - 0.1}
        x={1664}
        y={134}
        size={228}
        over="kept in"
        name="MariaDB"
      />
      <Shade />
    </Cut>
  );
}

/** Loose passages on the desk: a few near in meaning, fewer still standing. */
const WIDE = 170;
const TALL = 92;
const SLIPS = Array.from({ length: 32 }, (_, i) => ({
  x: 150 + (i % 8) * 205 + (random(`slip-x-${i}`) - 0.5) * 46,
  y: 296 + Math.floor(i / 8) * 118 + (random(`slip-y-${i}`) - 0.5) * 26,
  turn: (random(`slip-r-${i}`) - 0.5) * 12,
  tone: 0.84 + random(`slip-t-${i}`) * 0.16,
}));
const NEAR = [2, 9, 12, 14, 19, 21, 24, 29];
const STANDING = [9, 14, 19];

/**
 * One question, and one query that answers two things at once: which
 * passages are nearest in meaning, and which of them stood on that day.
 */
export function Search({ t }: Shot) {
  const asked = B.asked - B.ask;
  const vector = B.vector - B.ask;
  const meaning = B.meaning - B.ask;
  const stood = B.stood - B.ask;
  const query = B.query - B.ask;
  const one = ramp(t, query - 0.1, 0.3, snap);

  return (
    <Cut t={t}>
      <Plate name="desk" now={t} />
      <Sheet style={{ left: 250, top: 50, width: 1420, height: 150 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 28,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 80,
            color: INK,
          }}
        >
          <Written now={t} from={0.15} until={asked - 0.5} quill={1.2}>
            How many Finns died in the Winter War?
          </Written>
        </div>
      </Sheet>

      {/* The search reaching out to the passages that mean the same. */}
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0 }}
      >
        {NEAR.map((slip, order) => {
          const to = SLIPS[slip];
          const x = to.x + WIDE / 2;
          const y = to.y + TALL / 2;
          const standing = STANDING.includes(slip);
          const drawn = ramp(t, vector - 0.05 + order * 0.06, 0.4, snap);
          const cut = standing ? 0 : ramp(t, stood + order * 0.05, 0.25);

          return (
            <path
              key={slip}
              d={`M960 204 Q ${(960 + x) / 2 + (x - 960) * 0.15} ${204 + (y - 204) * 0.25}, ${x} ${y}`}
              pathLength={1}
              fill="none"
              stroke={standing && t >= stood + 0.2 ? LIVE : GOLD}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={1}
              strokeDashoffset={1 - drawn}
              opacity={(1 - cut) * 0.9}
            />
          );
        })}
      </svg>

      {SLIPS.map((slip, i) => {
        const order = NEAR.indexOf(i);
        const near = order >= 0;
        const standing = STANDING.includes(i);
        const laid = ramp(t, 0.05 + i * 0.014, 0.3, snap);
        const lit = near ? ramp(t, vector + 0.3 + order * 0.08, 0.25, snap) : 0;
        const dim = near ? 0 : ramp(t, vector + 0.3, 0.6);
        const struck =
          near && !standing ? ramp(t, stood + order * 0.05, 0.25, snap) : 0;
        const kept = standing ? ramp(t, stood + 0.2, 0.3, snap) : 0;
        const chosen = standing ? ramp(t, query - 0.05, 0.35, snap) : 0;
        const away = standing ? 0 : ramp(t, query - 0.05, 0.3);
        const ring = kept > 0.5 ? LIVE : GOLD;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: slip.x,
              top: slip.y - (1 - laid) * 30,
              width: WIDE,
              height: TALL,
              borderRadius: 6,
              background: `rgb(${Math.round(250 * slip.tone)},${Math.round(234 * slip.tone)},${Math.round(194 * slip.tone)})`,
              boxShadow:
                lit > 0
                  ? `0 0 0 ${5 * lit * (1 - struck)}px ${ring}, 0 0 ${46 * lit * (1 - struck)}px ${ring}`
                  : "0 8px 18px rgba(20,8,0,0.5)",
              opacity:
                laid * (1 - dim * 0.6) * (1 - struck * 0.6) * (1 - away * 0.6),
              transform: `rotate(${slip.turn}deg) scale(${1 + lit * 0.14 - struck * 0.14 + chosen * 0.42})`,
              zIndex: standing ? 3 : near ? 2 : 1,
            }}
          >
            {[138, 120, 82].map((wide, row) => (
              <div
                key={row}
                style={{
                  position: "absolute",
                  left: 16,
                  top: 22 + row * 22,
                  width: wide,
                  height: 6,
                  borderRadius: 4,
                  background: "#7d5730",
                  opacity: 0.5,
                }}
              />
            ))}
            {struck > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: -8,
                  top: TALL / 2 - 4,
                  width: (WIDE + 16) * struck,
                  height: 8,
                  borderRadius: 4,
                  background: RUBRIC,
                  transform: "rotate(-14deg)",
                }}
              />
            )}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 800,
          display: "flex",
          justifyContent: "center",
          gap: 40,
          fontFamily: caps,
          fontSize: 42,
          letterSpacing: "0.12em",
          textShadow: "0 3px 18px rgba(10,4,0,0.95)",
        }}
      >
        <span style={{ color: GOLD, opacity: ramp(t, meaning - 0.3, 0.3) }}>
          vector search · nearest in meaning
        </span>
        <span style={{ color: CREAM, opacity: ramp(t, stood - 0.1, 0.25) }}>
          +
        </span>
        <span style={{ color: LIVE, opacity: ramp(t, stood - 0.1, 0.3) }}>
          standing on 31 Dec 2007
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 884,
          textAlign: "center",
          fontFamily: fell,
          fontStyle: "italic",
          fontSize: 76,
          color: CREAM,
          textShadow: "0 4px 26px rgba(10,4,0,0.95)",
          opacity: one,
          transform: `scale(${1.25 - one * 0.25})`,
        }}
      >
        one query in MariaDB
      </div>
      <Shade strength={0.45} />
    </Cut>
  );
}

/** The answer beside the passage it came from, and the figure checked. */
export function Checked({ t }: Shot) {
  const answers = B.answers - B.spark;
  const only = B.only - B.spark;
  const number = B.number - B.spark;
  const checked = B.checked - B.spark;
  const cited = B.cited - B.spark;
  const tied = ramp(t, only - 0.1, 0.5, Easing.inOut(Easing.quad));
  const ringed = ramp(t, number - 0.05, 0.25, snap);
  const ticked = ramp(t, checked - 0.05, 0.25, snap);
  const heading = {
    position: "absolute" as const,
    left: 0,
    right: 0,
    top: 44,
    textAlign: "center" as const,
    fontFamily: caps,
    fontSize: 32,
    letterSpacing: "0.12em",
    color: RUBRIC,
  };
  const marked = {
    borderRadius: 10,
    background: `rgba(47,107,79,${0.2 * ringed})`,
    boxShadow: `0 0 0 ${5 * ringed}px ${GREEN}`,
    whiteSpace: "nowrap" as const,
  };

  return (
    <Cut t={t}>
      <Plate name="desk" now={t} />
      <Sheet
        take={0}
        style={{
          left: 90,
          top: 210,
          width: 760,
          height: 540,
          transform: "rotate(-2deg)",
        }}
      >
        <div style={heading}>the passage · 31 Dec 2007</div>
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 130,
            fontFamily: fell,
            fontSize: 52,
            lineHeight: 1.42,
            color: INK,
          }}
        >
          Suomalaisten tappiot talvisodassa olivat{" "}
          <span style={{ ...marked, color: ringed > 0.3 ? GREEN : INK }}>
            26 600
          </span>{" "}
          sotatoimissa menehtynyttä ja noin 1&nbsp;000 siviiliä.
        </div>
      </Sheet>

      <Sheet
        take={1}
        style={{
          left: 1070,
          top: 210,
          width: 760,
          height: 540,
          transform: "rotate(2deg)",
        }}
      >
        <div style={heading}>Gemini answers</div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 136,
            textAlign: "center",
          }}
        >
          <span
            style={{
              ...marked,
              display: "inline-block",
              lineHeight: 1,
              padding: "4px 24px 16px",
            }}
          >
            <Fig size={190} colour={ringed > 0.3 ? GREEN : INK}>
              <Written
                now={t}
                from={answers - 0.05}
                until={answers + 0.5}
                quill={1.6}
              >
                26 600
              </Written>
            </Fig>
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 352,
            textAlign: "center",
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 46,
            color: INK,
            opacity: ramp(t, answers + 0.4, 0.3),
          }}
        >
          killed in action ¹
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 440,
            textAlign: "center",
            fontFamily: caps,
            fontSize: 26,
            letterSpacing: "0.1em",
            color: GHOST,
            opacity: tied,
          }}
        >
          ¹ only from the passage beside it
        </div>
      </Sheet>

      {/* The thread from the passage to the answer written from it. */}
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d="M846 486 C 910 560, 1010 560, 1074 486"
          pathLength={1}
          fill="none"
          stroke={RUBRIC}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={1 - tied}
          style={{ filter: "drop-shadow(0 5px 5px rgba(30,8,0,0.6))" }}
        />
        {tied > 0 && (
          <circle
            cx={846}
            cy={486}
            r={14}
            fill={RUBRIC}
            stroke={CREAM}
            strokeWidth={3}
          />
        )}
        {tied >= 1 && (
          <circle
            cx={1074}
            cy={486}
            r={14}
            fill={RUBRIC}
            stroke={CREAM}
            strokeWidth={3}
          />
        )}
      </svg>

      <div
        style={{
          position: "absolute",
          left: 960 - 80,
          top: 250,
          opacity: ramp(t, 0.05, 0.2),
          transform: `scale(${0.4 + ramp(t, 0.05, 0.4, snap) * 0.6}) rotate(${t * 60}deg)`,
        }}
      >
        <Spark size={160} />
      </div>

      {/* The figure in the answer is the figure in the passage. */}
      <svg
        width={170}
        height={170}
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          left: 960 - 85,
          top: 560,
          opacity: Math.min(1, ticked * 2),
          transform: `scale(${1.6 - ticked * 0.6})`,
          filter: "drop-shadow(0 8px 14px rgba(10,4,0,0.7))",
        }}
      >
        <circle
          cx={50}
          cy={50}
          r={46}
          fill={GREEN}
          stroke={CREAM}
          strokeWidth={4}
        />
        <path
          d="M28 52 L44 68 L74 34"
          fill="none"
          stroke={CREAM}
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 812,
          textAlign: "center",
          fontFamily: fell,
          fontStyle: "italic",
          fontSize: 66,
          color: CREAM,
          textShadow: "0 4px 26px rgba(10,4,0,0.95)",
          opacity: ramp(t, cited - 0.25, 0.3),
        }}
      >
        every number, checked against the passage it cites
      </div>
      <Caption t={t} at={0.2}>
        answered by Gemini · only from the passages found
      </Caption>
      <Shade strength={0.45} />
    </Cut>
  );
}
