import { AbsoluteFill } from "remotion";

import { SHOTS, line, said } from "./clock";
import {
  GHOST,
  INK,
  Plate,
  RUBRIC,
  Scraped,
  Written,
  caps,
  fell,
  fraktur,
  garamond,
  ramp,
  track,
  useNow,
} from "./kit";

/**
 * What the Winter War article gave as the Finnish dead, with the wording
 * and the hand of each edit, from the article's own history.
 */
const ERAS = [
  {
    figure: "22 800",
    words: "“Suomalaisten tappiot nousivat noin 22 800 henkeen…”",
    note: "13 October 2003 · written by Cimon Avaro",
  },
  {
    figure: "26 600",
    words:
      "“Suomalaisten tappiot talvisodassa olivat 26 600 sotatoimissa menehtynyttä…”",
    note: "27 September 2006 · written by an unnamed hand",
  },
  {
    figure: "26 662",
    words:
      "“Suomalaisten tappiot talvisodassa olivat 26662 sotatoimissa menehtynyttä…”",
    note: "22 August 2009 · written by an unnamed hand",
  },
];

/** The old line: a motto in a scribe's blackletter, about to be scraped. */
function Old({
  now,
  ghost,
  first,
  second,
}: {
  now: number;
  ghost: number;
  first: number;
  second: number;
}) {
  const style = { fontFamily: fraktur, color: "#3a2210", lineHeight: 1 };

  return (
    <>
      <div style={{ position: "absolute", left: 300, top: 170, ...style }}>
        <Scraped
          now={now}
          from={first}
          until={first + 0.22}
          ghost={ghost}
          blade={0}
          seed="initial"
          style={{ fontSize: 340, color: RUBRIC }}
        >
          V
        </Scraped>
      </div>
      <div style={{ position: "absolute", left: 520, top: 262, ...style }}>
        <Scraped
          now={now}
          from={first + 0.12}
          until={first + 0.8}
          ghost={ghost}
          blade={1.5}
          seed="first"
          style={{ fontSize: 176 }}
        >
          erba volant,
        </Scraped>
      </div>
      <div style={{ position: "absolute", left: 330, top: 492, ...style }}>
        <Scraped
          now={now}
          from={second}
          until={second + 0.8}
          ghost={ghost}
          blade={1.5}
          seed="second"
          style={{ fontSize: 176 }}
        >
          scripta manent.
        </Scraped>
      </div>
    </>
  );
}

/** A page of parchment: scraped, written over, and then Wikipedia's. */
export function Page() {
  const now = useNow(SHOTS.page);

  const scrape = said("scraped", "scraped") - 0.1;
  const write = said("scraped", "wrote") - 0.25;
  const beneath = said("remembers", "beneath");
  const called = said("called", "palimpsest") - 0.55;
  const turn = line("largest").start - 0.7;

  // The first page: how visible each layer of writing is.
  const looking = ramp(now, beneath, 1.2) * (1 - ramp(now, called - 0.4, 0.6));
  const ghost = 0.2 + looking * 0.42 - ramp(now, called - 0.4, 0.6) * 0.06;
  const fresh = 1 - looking * 0.55 - ramp(now, called - 0.4, 0.6) * 0.62;
  const first = 1 - ramp(now, turn, 0.55);
  const second = ramp(now, turn + 0.4, 0.6);

  // The second page: when each figure is written and scraped.
  const writes = [
    line("largest").start + 1.0,
    said("everyday", "another") - 0.15,
    line("everyday").end + 0.7,
  ];
  const scrapes = [
    said("everyday", "scraped") - 0.1,
    line("everyday").end + 0.05,
  ];
  const era = writes.filter((at) => now >= at).length - 1;
  const forgotten = ramp(now, said("top", "read"), 1.4);

  const zoom =
    now < turn + 0.4
      ? track(
          now,
          [SHOTS.page, beneath, beneath + 2.6, called - 0.3, called + 0.9],
          [1.02, 1.05, 1.22, 1.22, 1.0],
        )
      : track(
          now,
          [turn + 0.4, line("top").start, SHOTS.layers + 0.7],
          [1.0, 1.06, 1.16],
        );

  return (
    <AbsoluteFill style={{ background: "#1a110a" }}>
      <AbsoluteFill
        style={{
          transformOrigin: now < turn + 0.4 ? "50% 44%" : "50% 46%",
          transform: `scale(${zoom})`,
        }}
      >
        <Plate name="parchment" now={now} />

        {first > 0 && (
          <AbsoluteFill style={{ opacity: first }}>
            <Old
              now={now}
              ghost={ghost}
              first={scrape}
              second={scrape + 0.72}
            />

            <div
              style={{
                position: "absolute",
                left: 372,
                top: 318,
                fontFamily: fell,
                fontStyle: "italic",
                fontSize: 158,
                lineHeight: 1,
                color: "#170b04",
                opacity: fresh,
              }}
            >
              <Written now={now} from={write} until={write + 1.0} quill={1.5}>
                Incipit liber novus,
              </Written>
            </div>
            <div
              style={{
                position: "absolute",
                left: 430,
                top: 546,
                fontFamily: fell,
                fontStyle: "italic",
                fontSize: 158,
                lineHeight: 1,
                color: "#170b04",
                opacity: fresh,
              }}
            >
              <Written
                now={now}
                from={write + 1.05}
                until={write + 2.0}
                quill={1.5}
              >
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
                fontSize: 56,
                color: RUBRIC,
                opacity:
                  ramp(now, beneath + 1.5, 0.7) *
                  (1 - ramp(now, called - 0.5, 0.4)),
              }}
            >
              scripta manent · what is written, remains
            </div>

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 688,
                textAlign: "center",
                fontFamily: fell,
                fontStyle: "italic",
                fontSize: 250,
                lineHeight: 1,
                color: RUBRIC,
              }}
            >
              <Written
                now={now}
                from={called}
                until={called + 1.15}
                quill={1.7}
              >
                palimpsest
              </Written>
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 958,
                textAlign: "center",
                fontFamily: caps,
                fontSize: 37,
                letterSpacing: "0.1em",
                color: INK,
                opacity: ramp(now, called + 1.2, 0.6) * 0.85,
              }}
            >
              a page written on twice, the first writing never wholly gone
            </div>
          </AbsoluteFill>
        )}

        {second > 0 && (
          <AbsoluteFill style={{ opacity: second }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 112,
                textAlign: "center",
                fontFamily: caps,
                fontSize: 36,
                letterSpacing: "0.14em",
                color: RUBRIC,
              }}
            >
              fi.wikipedia.org · Talvisota · the Winter War
            </div>
            <div
              style={{
                position: "absolute",
                left: 560,
                right: 560,
                top: 176,
                height: 3,
                background: RUBRIC,
                opacity: 0.55,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 214,
                textAlign: "center",
                fontFamily: fell,
                fontStyle: "italic",
                fontSize: 70,
                color: INK,
              }}
            >
              <Written
                now={now}
                from={line("largest").start}
                until={line("largest").start + 0.9}
                quill={0}
              >
                Finnish losses in the Winter War
              </Written>
            </div>

            {ERAS.map((each, index) => {
              if (now < writes[index]) return null;

              // Each rewriting pushes the earlier ones a little further back.
              const depth = writes
                .slice(index + 1)
                .reduce((sum, at) => sum + ramp(now, at, 0.6), 0);
              const scraped = scrapes[index];

              return (
                <div
                  key={each.figure}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 300,
                    textAlign: "center",
                    fontFamily: garamond,
                    fontWeight: 500,
                    fontVariantNumeric: "lining-nums",
                    fontSize: 350,
                    lineHeight: 1.05,
                    color: INK,
                    transform: `translate(${-20 * depth}px, ${-16 * depth}px)`,
                  }}
                >
                  {scraped !== undefined && now >= scraped ? (
                    <Scraped
                      now={now}
                      from={scraped}
                      until={scraped + 0.62}
                      ghost={0.3 - forgotten * 0.26}
                      blade={2}
                      seed={each.figure}
                    >
                      {each.figure}
                    </Scraped>
                  ) : (
                    <Written
                      now={now}
                      from={writes[index]}
                      until={writes[index] + 0.85}
                      quill={2}
                    >
                      {each.figure}
                    </Written>
                  )}
                </div>
              );
            })}

            {era >= 0 && (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: 200,
                    right: 200,
                    top: 706,
                    textAlign: "center",
                    fontFamily: fell,
                    fontStyle: "italic",
                    fontSize: 42,
                    color: GHOST,
                    opacity:
                      ramp(now, writes[era] + 0.5, 0.5) * (1 - forgotten * 0.5),
                  }}
                >
                  {ERAS[era].words}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 796,
                    textAlign: "center",
                    fontFamily: caps,
                    fontSize: 36,
                    letterSpacing: "0.1em",
                    color: RUBRIC,
                    opacity: ramp(now, writes[era] + 0.7, 0.5),
                  }}
                >
                  {ERAS[era].note}
                </div>
              </>
            )}
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {/* Candlelight falling off towards the corners. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 60% 40%, transparent 46%, rgba(30,14,4,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}
