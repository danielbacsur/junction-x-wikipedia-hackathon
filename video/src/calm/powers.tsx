import { AbsoluteFill, Easing } from "remotion";

import {
  Plate,
  Quill,
  Written,
  caps,
  fell,
  ramp,
  soft,
  track,
} from "../film/kit";
import { B } from "./beats";
import type { Shot } from "./kit";
import {
  BLUE,
  Birds,
  Blade,
  CREAM,
  Fig,
  Flutter,
  GHOST,
  GREEN,
  INK,
  Leaf,
  Lines,
  RUBRIC,
  Seal,
  Soft,
  Spark,
  Tag,
  snap,
} from "./kit";

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
export function AnyDay({ t, d }: Shot) {
  const stops = [0.7, 2.3, 2.9, d - 0.4];
  const years = [2026.75, 2003.8, 2003.8, 2007.99];
  const year = track(t, stops, years, soft);
  const speed = Math.abs(track(t + 0.03, stops, years, soft) - year);
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

  return (
    <AbsoluteFill>
      <Plate name="table" now={t} />
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 250,
          width: 780,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: caps,
            fontSize: 42,
            letterSpacing: "0.14em",
            color: BLUE,
          }}
        >
          Wikipedia, as it stood in
        </div>
        <div style={{ filter: `blur(${Math.min(8, speed * 12)}px)` }}>
          <Fig size={370} colour={INK}>
            {Math.floor(year)}
          </Fig>
        </div>
      </div>
      <Leaf
        style={{
          left: 990,
          top: 70,
          width: 780,
          height: 930,
          transform: `rotate(${2 + speed * 2.4}deg)`,
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
      </Leaf>
      <Tag t={t}>any article · any day since 2003</Tag>
      <Soft />
    </AbsoluteFill>
  );
}

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

/** Two days of one sentence, and every word that differs between them. */
export function SideBySide({ t }: Shot) {
  const see = B.see - B.diff;
  const marks = [see, see + 0.6, see + 1.2];
  const found = marks.filter((at) => t >= at).length;

  const leaf = (now: boolean) => (
    <Leaf
      take={now ? 1 : 0}
      style={{
        left: now ? 1000 : 100,
        top: 200,
        width: 820,
        height: 620,
        transform: `translateX(${(1 - ramp(t, 0.3, 0.9, snap)) * (now ? 1000 : -1000)}px) rotate(${now ? 2 : -2}deg)`,
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

          const p = ramp(t, marks[change], 0.4, snap);

          return now ? (
            <span
              key={index}
              style={{
                color: p > 0.3 ? GREEN : INK,
                background: `rgba(42,122,72,${0.2 * p})`,
                borderRadius: 8,
                boxShadow: `0 ${5 * p}px 0 ${GREEN}`,
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
                background: `rgba(176,46,26,${0.16 * p})`,
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
    </Leaf>
  );

  return (
    <AbsoluteFill>
      <Plate name="table" now={t} />
      {leaf(false)}
      {leaf(true)}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 56,
          textAlign: "center",
          opacity: ramp(t, see - 0.2, 0.4),
        }}
      >
        <Fig size={108} colour={INK}>
          {found}
        </Fig>
        <span
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 72,
            color: INK,
          }}
        >
          {" "}
          {found === 1 ? "word" : "words"} changed
        </span>
      </div>
      <Tag t={t} top={884}>
        two days, side by side
      </Tag>
      <Soft />
    </AbsoluteFill>
  );
}

/** A question, and the answer from each of two days. */
export function AskTwoDays({ t }: Shot) {
  const then = B.gemini - B.ask;
  const now = B.today - B.ask;

  const answer = (today: boolean) => {
    const at = today ? now : then;
    const p = ramp(t, at, 0.7, snap);

    if (t < at) return null;

    return (
      <Leaf
        take={today ? 1 : 0}
        style={{
          left: today ? 1010 : 230,
          top: 290,
          width: 680,
          height: 560,
          opacity: Math.min(1, p * 2),
          transform: `translateY(${(1 - p) * 120}px) rotate(${today ? 2.5 : -2.5}deg)`,
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
            {today ? "26 662" : "26 600"}
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
            opacity: ramp(t, at + 0.7, 0.5),
          }}
        >
          ¹ cited · the paragraph that stood that day
        </div>
      </Leaf>
    );
  };

  return (
    <AbsoluteFill>
      <Plate name="table" now={t} />
      <Leaf style={{ left: 250, top: 70, width: 1420, height: 156 }}>
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
          <Written now={t} from={0.5} until={1.9} quill={1.2}>
            How many Finns died in the Winter War?
          </Written>
        </div>
      </Leaf>
      {answer(false)}
      {answer(true)}
      <div
        style={{
          position: "absolute",
          left: 960 - 95,
          top: 470,
          opacity: ramp(t, then - 0.2, 0.4),
          transform: `scale(${0.4 + ramp(t, then - 0.2, 0.7, snap) * 0.6}) rotate(${t * 30}deg)`,
        }}
      >
        <Spark size={190} />
      </div>
      <Tag t={t} at={then} top={890}>
        answered by Gemini, from the words of that day
      </Tag>
      <Soft />
    </AbsoluteFill>
  );
}

/** Every wording of one claim, oldest first, as the history holds them. */
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

/** One claim, followed back along a red thread to the hand that first wrote it. */
export function FollowTheClaim({ t }: Shot) {
  const back = B.back - B.trace;
  const hand = B.hand - B.trace;
  const last = (WORDINGS.length - 1) * STRIDE;
  const camera = track(
    t,
    [back - 0.4, hand + 0.5],
    [last - 520, 0],
    Easing.inOut(Easing.quad),
  );
  const arrived = ramp(t, hand + 0.4, 0.7, snap);
  const knot = (i: number) => ({
    x: i * STRIDE,
    y: 648 + Math.sin(i * 1.7) * 18,
  });

  return (
    <AbsoluteFill>
      <Plate name="sky" now={t} />
      <Birds t={t + 9} top={300} colour="#ffffff" count={3} />
      <AbsoluteFill
        style={{ transform: `translateX(${960 - camera - arrived * 250}px)` }}
      >
        {WORDINGS.map(([day, figure, name], i) => {
          const first = i === 0 ? arrived : 0;

          if (Math.abs(i * STRIDE - camera) > 1400) return null;

          return (
            <Leaf
              key={day}
              take={i % 2}
              style={{
                left: i * STRIDE - 140,
                top: 430 + Math.sin(i * 1.7) * 18 - first * 40,
                width: 280,
                height: 380,
                zIndex: i === 0 ? 5 : 1,
                opacity: i === 0 ? 1 : 1 - arrived * 0.85,
                transform: `rotate(${Math.sin(i * 2.3) * 4 + Math.sin(t * 1.2 + i) * 1.5}deg) scale(${1 + first * 0.7})`,
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
                {name}
              </div>
            </Leaf>
          );
        })}
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
                : `C${from.x + 190} ${from.y + 70}, ${at.x + 410} ${at.y + 70}, ${at.x + 300} ${at.y}`;
            }).join(" ")}
            pathLength={1}
            fill="none"
            stroke={RUBRIC}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={1}
            strokeDashoffset={Math.max(0, (camera - 140) / last)}
            opacity={1 - arrived * 0.7}
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

      <Leaf style={{ left: 330, top: 70, width: 1260, height: 132 }}>
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
      </Leaf>

      {arrived > 0 && (
        <>
          <Quill
            now={t}
            scale={1.05}
            style={{ left: 560, top: 826, opacity: arrived }}
          />
          <div
            style={{
              position: "absolute",
              left: 1010,
              right: 60,
              top: 420,
              fontFamily: fell,
              fontStyle: "italic",
              fontSize: 80,
              lineHeight: 1.15,
              color: "#12346e",
              textShadow: "0 0 18px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.9)",
              opacity: arrived,
            }}
          >
            first written
            <br />
            13 October 2003
            <br />
            by Cimon Avaro
          </div>
        </>
      )}
      <Tag t={t} at={0.6} top={956}>
        18 wordings · 3 figures · 23 years
      </Tag>
    </AbsoluteFill>
  );
}

const two = (n: number) => String(Math.floor(n)).padStart(2, "0");
const clock = (seconds: number) =>
  `${two(seconds / 3600)}:${two((seconds % 3600) / 60)}:${two(seconds % 60)}`;

/** A paragraph taken out at 18:43:29 and put back at 18:45:24. */
export function WhoChanged({ t, d }: Shot) {
  const gone = 0.9;
  const back = Math.min(B.down - B.who, d - 1.3);
  const out = ramp(t, gone, 0.6, Easing.inOut(Easing.quad));
  const home = ramp(t, back, 0.7, Easing.inOut(Easing.quad));
  const removed = 18 * 3600 + 43 * 60 + 29;
  const now = track(t, [back, back + 0.7], [removed, removed + 115], (n) => n);
  const restored = t >= back + 0.65;
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

  return (
    <AbsoluteFill>
      <Plate name="table" now={t} />
      <Leaf
        style={{
          left: 120,
          top: 170,
          width: 1040,
          height: 650,
          transform: "rotate(-1.5deg)",
        }}
      >
        <div style={{ ...heading, top: 46, fontSize: 34 }}>
          Talvisota · the paragraph on losses
        </div>
        <div style={{ ...text, color: GHOST, opacity: 0.3 }}>{words}</div>
        <div
          style={{
            ...text,
            color: INK,
            clipPath:
              t < back
                ? `inset(0 0 0 ${out * 100}%)`
                : `inset(0 ${(1 - home) * 100}% 0 0)`,
          }}
        >
          {words}
        </div>
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 560,
            fontFamily: caps,
            fontSize: 28,
            letterSpacing: "0.1em",
            color: GHOST,
          }}
        >
          written 15 Sep 2007 by Myllyre
        </div>
      </Leaf>
      <Blade
        t={t}
        from={gone}
        over={0.6}
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
      <div
        style={{
          position: "absolute",
          left: 1220,
          right: 40,
          top: 250,
          textAlign: "center",
          opacity: ramp(t, gone - 0.1, 0.3),
        }}
      >
        <div
          style={{
            fontFamily: caps,
            fontSize: 38,
            letterSpacing: "0.14em",
            color: BLUE,
          }}
        >
          11 January 2008
        </div>
        <Fig size={150} colour={restored ? GREEN : RUBRIC}>
          {clock(now)}
        </Fig>
        <div
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 84,
            color: restored ? GREEN : RUBRIC,
          }}
        >
          {restored ? "restored" : "removed"}
        </div>
      </div>
      <Tag t={t} top={900}>
        who changed what, to the second
      </Tag>
      <Soft />
    </AbsoluteFill>
  );
}

/** Every edit kept: a pile of leaves, and the seal on top of it. */
export function Kept({ t }: Shot) {
  return (
    <AbsoluteFill>
      <Plate name="table" now={t} />
      {Array.from({ length: 14 }, (_, i) => (
        <Leaf
          key={i}
          take={i % 2}
          style={{
            left: 520 + Math.sin(i * 2.1) * 14,
            top: 250 - i * 9 + (1 - ramp(t, i * 0.05, 0.4, snap)) * -700,
            width: 880,
            height: 600,
            transform: `rotate(${Math.sin(i * 1.3) * 3}deg)`,
          }}
        />
      ))}
      <Seal
        t={t}
        at={B.seal - B.kept - 0.15}
        x={960}
        y={470}
        size={480}
        over="every edit kept in"
        name="MariaDB"
      />
      <Tag t={t} at={B.seal - B.kept + 0.3}>
        862,076 versions · nothing overwritten
      </Tag>
      <Soft />
    </AbsoluteFill>
  );
}

/** Evening on the same hill, and then the name. */
export function Dusk({ t, d, title }: Shot & { title?: boolean }) {
  const pull = title ? 1 : track(t, [0, d + 0.6], [1.18, 1.06]);
  const offset = title ? B.title - B.dusk : 0;

  return (
    <AbsoluteFill style={{ background: "#241f63" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "66% 42%",
          transform: `scale(${title ? track(t, [0, d], [1.06, 1]) : pull})`,
        }}
      >
        <Plate name="hillDusk" now={t + offset} />
        <Birds t={t + offset + 14} top={210} colour="#3a2a5a" count={3} />
        <Flutter t={t + offset} glow count={16} />
      </AbsoluteFill>
      {title && (
        <>
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg, rgba(20,12,50,0.1) 0%, rgba(20,12,50,0.55) 45%, rgba(20,12,50,0.9) 86%)",
              opacity: ramp(t, 0, 0.9),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 440,
              textAlign: "center",
              fontFamily: fell,
              fontSize: 270,
              lineHeight: 1,
              color: CREAM,
              textShadow: "0 6px 44px rgba(20,8,40,0.9)",
            }}
          >
            <Written
              now={t}
              from={B.named - B.title - 0.5}
              until={B.named - B.title + 0.7}
              quill={1.8}
            >
              Palimpsest
            </Written>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 750,
              textAlign: "center",
              fontFamily: fell,
              fontStyle: "italic",
              fontSize: 62,
              color: CREAM,
              opacity: ramp(t, B.named - B.title + 1.0, 0.8),
              textShadow: "0 4px 26px rgba(20,8,40,0.9)",
            }}
          >
            If Wikipedia ever said it, we can find it, date it, and answer from
            it.
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 870,
              textAlign: "center",
              opacity: ramp(t, B.named - B.title + 1.7, 0.8),
            }}
          >
            <span
              style={{
                fontFamily: caps,
                fontSize: 44,
                letterSpacing: "0.12em",
                color: "#241f63",
                background: CREAM,
                borderRadius: 14,
                padding: "10px 34px 14px",
              }}
            >
              wikipedia.danielbacsur.dev
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 986,
              textAlign: "center",
              fontFamily: caps,
              fontSize: 30,
              letterSpacing: "0.16em",
              color: "#ffd9b0",
              opacity: ramp(t, B.named - B.title + 2.2, 0.8),
            }}
          >
            built on MariaDB · answers by Gemini · Junction 2026
          </div>
          <AbsoluteFill
            style={{ background: "#000", opacity: ramp(t, d - 1.2, 1.1) }}
          />
        </>
      )}
    </AbsoluteFill>
  );
}
