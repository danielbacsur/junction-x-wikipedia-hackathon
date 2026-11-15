import { AbsoluteFill } from "remotion";

import {
  Plate,
  Quill,
  Scraped,
  Written,
  caps,
  fell,
  fraktur,
  ramp,
  soft,
  track,
} from "../film/kit";
import { Motes } from "../film/Room";
import { B } from "./beats";
import type { Shot } from "./kit";
import {
  BLUE,
  Birds,
  CatTail,
  Fig,
  Flutter,
  GHOST,
  GOLD,
  INK,
  Leaf,
  RUBRIC,
  Soft,
} from "./kit";

/** Morning: the monastery on its hill above the sea. */
export function Hill({ t, d }: Shot) {
  return (
    <AbsoluteFill style={{ background: "#bfe4f7" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "66% 42%",
          transform: `scale(${track(t, [0, d + 0.6], [1, 1.16])})`,
        }}
      >
        <Plate name="hillDay" now={t} />
        <Birds t={t + 6} top={150} />
        <Flutter t={t} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: "#fff8e6", opacity: 1 - ramp(t, 0, 1.4) }}
      />
    </AbsoluteFill>
  );
}

/** Inside: the scribe at the desk, in the light of the coloured window. */
export function Hall({ t, d }: Shot) {
  const writing = Math.sin(t * 4.4);

  return (
    <AbsoluteFill
      style={{
        transformOrigin: "46% 60%",
        transform: `scale(${track(t, [0, d + 0.6], [1.04, 1.2])})`,
      }}
    >
      <Plate name="hall" now={t} />
      <CatTail t={t} />
      <Motes
        now={t}
        count={30}
        box={[620, 300, 820, 640]}
        colour="rgba(255,244,200,0.95)"
      />
      <Quill
        now={t * 0.5}
        scale={0.42}
        style={{ left: 884 + writing * 26, top: 688 - writing * 3 }}
      />
    </AbsoluteFill>
  );
}

/** One page: scraped, written over, the old line showing through, and named. */
export function ScribePage({ t, d }: Shot) {
  const scraped = B.scraped - B.page;
  const wrote = B.wrote - B.page;
  const ghostly = B.ghost - B.page;
  const called = B.called - B.page;
  const look = ramp(t, ghostly, 0.9) * (1 - ramp(t, called - 0.2, 0.6));
  const ghost = 0.24 + look * 0.4 - ramp(t, called, 0.5) * 0.08;
  const fresh = 1 - look * 0.55 - ramp(t, called, 0.5) * 0.66;
  const old = { fontFamily: fraktur, color: "#3a2210", lineHeight: 1 };
  const hand = {
    position: "absolute" as const,
    fontFamily: fell,
    fontStyle: "italic" as const,
    fontSize: 150,
    lineHeight: 1,
    color: "#170b04",
    opacity: fresh,
  };

  return (
    <AbsoluteFill
      style={{
        transformOrigin: "50% 46%",
        transform: `scale(${track(t, [0, ghostly, ghostly + 2.2, called, d], [1.02, 1.05, 1.16, 1.14, 1.0], soft)})`,
      }}
    >
      <Plate name="page" now={t} />
      <div style={{ position: "absolute", left: 310, top: 200, ...old }}>
        <Scraped
          now={t}
          from={scraped}
          until={scraped + 0.2}
          ghost={ghost}
          blade={0}
          seed="i"
          style={{ fontSize: 320, color: BLUE }}
        >
          V
        </Scraped>
      </div>
      <div style={{ position: "absolute", left: 520, top: 286, ...old }}>
        <Scraped
          now={t}
          from={scraped + 0.1}
          until={scraped + 0.65}
          ghost={ghost}
          blade={1.6}
          seed="a"
          style={{ fontSize: 166 }}
        >
          erba volant,
        </Scraped>
      </div>
      <div style={{ position: "absolute", left: 340, top: 500, ...old }}>
        <Scraped
          now={t}
          from={scraped + 0.6}
          until={scraped + 1.15}
          ghost={ghost}
          blade={1.6}
          seed="b"
          style={{ fontSize: 166 }}
        >
          scripta manent.
        </Scraped>
      </div>

      <div style={{ ...hand, left: 380, top: 336 }}>
        <Written now={t} from={wrote} until={wrote + 0.7} quill={1.6}>
          Incipit liber novus,
        </Written>
      </div>
      <div style={{ ...hand, left: 440, top: 552 }}>
        <Written now={t} from={wrote + 0.7} until={wrote + 1.4} quill={1.6}>
          anno Domini mxxvi.
        </Written>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 716,
          textAlign: "center",
          fontFamily: fell,
          fontStyle: "italic",
          fontSize: 54,
          color: BLUE,
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
          top: 686,
          textAlign: "center",
          fontFamily: fell,
          fontStyle: "italic",
          fontSize: 230,
          lineHeight: 1,
          color: RUBRIC,
        }}
      >
        <Written now={t} from={called + 0.3} until={called + 1.5} quill={1.7}>
          palimpsest
        </Written>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 906,
          textAlign: "center",
          fontFamily: caps,
          fontSize: 34,
          letterSpacing: "0.1em",
          color: INK,
          opacity: ramp(t, called + 1.6, 0.6) * 0.85,
        }}
      >
        a page written on twice, the first writing never wholly gone
      </div>
      <Soft strength={0.2} />
    </AbsoluteFill>
  );
}

/**
 * What the Winter War article gave as the Finnish dead, with the hand of
 * each edit, from the article's own history.
 */
const ERAS = [
  { figure: "22 800", note: "13 October 2003 · written by Cimon Avaro" },
  { figure: "26 600", note: "27 September 2006 · written by an unnamed hand" },
  { figure: "26 662", note: "22 August 2009 · written by an unnamed hand" },
];

/** The same thing happening to a page of Wikipedia. */
export function WikiPage({ t, d }: Shot) {
  const writes = [0.5, B.rewritten - B.wiki + 0.75, B.thousand - B.wiki + 0.85];
  const scrapes = [B.rewritten - B.wiki, B.thousand - B.wiki + 0.1];
  const era = writes.filter((at) => t >= at).length - 1;
  const forgotten = ramp(t, B.top - B.wiki - 0.9, 1.4);
  const counted = ramp(
    t,
    B.rewritten - B.wiki + 0.6,
    B.times - B.rewritten - 0.2,
    (n) => 1 - (1 - n) ** 3,
  );

  return (
    <AbsoluteFill
      style={{
        transformOrigin: "50% 46%",
        transform: `scale(${track(t, [0, d + 0.6], [1.0, 1.1])})`,
      }}
    >
      <Plate name="page" now={t} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 164,
          textAlign: "center",
          fontFamily: caps,
          fontSize: 36,
          letterSpacing: "0.14em",
          color: BLUE,
        }}
      >
        fi.wikipedia.org · Talvisota · the Winter War
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 232,
          textAlign: "center",
          fontFamily: fell,
          fontStyle: "italic",
          fontSize: 66,
          color: INK,
        }}
      >
        Finnish losses in the Winter War
      </div>

      {ERAS.map((each, index) => {
        if (t < writes[index]) return null;

        const depth = writes
          .slice(index + 1)
          .reduce((sum, at) => sum + ramp(t, at, 0.6), 0);
        const scraped = scrapes[index];

        return (
          <div
            key={each.figure}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 312,
              textAlign: "center",
              transform: `translate(${-22 * depth}px, ${-18 * depth}px)`,
            }}
          >
            <Fig size={330} colour={INK}>
              {scraped !== undefined && t >= scraped ? (
                <Scraped
                  now={t}
                  from={scraped}
                  until={scraped + 0.6}
                  ghost={0.3 - forgotten * 0.26}
                  blade={2}
                  seed={each.figure}
                >
                  {each.figure}
                </Scraped>
              ) : (
                <Written
                  now={t}
                  from={writes[index]}
                  until={writes[index] + 0.8}
                  quill={2}
                >
                  {each.figure}
                </Written>
              )}
            </Fig>
          </div>
        );
      })}

      {era >= 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 700,
            textAlign: "center",
            fontFamily: caps,
            fontSize: 36,
            letterSpacing: "0.1em",
            color: RUBRIC,
            opacity: ramp(t, writes[era] + 0.6, 0.5),
          }}
        >
          {ERAS[era].note}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 782,
          textAlign: "center",
          opacity: ramp(t, B.rewritten - B.wiki + 0.5, 0.5),
        }}
      >
        <Fig size={96} colour={GOLD}>
          {Math.round(counted * 862_076).toLocaleString("en-US")}
        </Fig>
        <span
          style={{
            fontFamily: fell,
            fontStyle: "italic",
            fontSize: 58,
            color: GHOST,
          }}
        >
          {" "}
          versions, all told
        </span>
      </div>
      <Soft strength={0.2} />
    </AbsoluteFill>
  );
}

/** The page held up to the sky, and the layers under it coming into view. */
export function Light({ t, d }: Shot) {
  const lit = B.lit - B.light;
  const up = ramp(t, 0, lit + 0.3, soft);
  const seen = ramp(t, lit - 0.1, 0.9);
  const apart = ramp(t, lit + 0.5, 1.3, soft);
  const under = [
    { figure: "22 800", day: "2003", x: -430 },
    { figure: "26 600", day: "2006", x: 430 },
  ];

  return (
    <AbsoluteFill
      style={{ transform: `scale(${track(t, [0, d + 0.6], [1.08, 1])})` }}
    >
      <Plate name="sky" now={t} />
      <Birds t={t + 3} top={260} colour="#ffffff" count={4} />
      {under.map((leaf, i) => (
        <Leaf
          key={leaf.figure}
          take={i}
          style={{
            left: 960 - 175 + leaf.x * apart,
            top: 300 + 40 * apart,
            width: 350,
            height: 480,
            opacity: seen,
            transform: `rotate(${(i ? 7 : -7) * apart}deg) scale(${0.96})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 40,
              textAlign: "center",
              fontFamily: caps,
              fontSize: 26,
              letterSpacing: "0.12em",
              color: RUBRIC,
            }}
          >
            {leaf.day}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 130,
              textAlign: "center",
            }}
          >
            <Fig size={104} colour={GHOST}>
              {leaf.figure}
            </Fig>
          </div>
        </Leaf>
      ))}
      <Leaf
        style={{
          left: 960 - 190,
          top: 250 + (1 - up) * 760,
          width: 380,
          height: 520,
          transform: `rotate(${-3 + (1 - up) * 10}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 44,
            textAlign: "center",
            fontFamily: caps,
            fontSize: 28,
            letterSpacing: "0.12em",
            color: RUBRIC,
          }}
        >
          today
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 140,
            textAlign: "center",
          }}
        >
          <Fig size={114} colour={INK}>
            26 662
          </Fig>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 10,
            background:
              "radial-gradient(circle at 50% 30%, rgba(255,250,214,0.7), rgba(255,250,214,0) 70%)",
            opacity: 0.3 + seen * 0.5,
          }}
        />
      </Leaf>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 8%, rgba(255,252,230,0.95), rgba(255,246,200,0.25) 40%, rgba(255,246,200,0) 68%)",
          mixBlendMode: "screen",
          opacity:
            ramp(t, lit - 0.3, 0.6) * (1 - ramp(t, lit + 0.6, 1.6)) * 0.8,
        }}
      />
    </AbsoluteFill>
  );
}
