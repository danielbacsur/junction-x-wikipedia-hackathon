import { AbsoluteFill } from "remotion";

import { Label, Shell, expo, number, pop, ramp, rise, useT } from "../lib";
import { dark, mono, sans, serif } from "../theme";
import { cue, scene } from "../timeline";

type Part = { text: string; kind?: "word" | "vector" | "time" | "quiet" };

/**
 * The statement behind an answer, shortened from the one the product runs:
 * the nearest vectors first, then the join that pins them to a date.
 */
const LINES: Part[][] = [
  [
    { text: "WITH", kind: "word" },
    { text: " v " },
    { text: "AS", kind: "word" },
    { text: " (" },
  ],
  [{ text: "  " }, { text: "SELECT", kind: "word" }, { text: " hash," }],
  [
    { text: "         " },
    { text: "VEC_DISTANCE_COSINE(embedding, @question)", kind: "vector" },
    { text: " " },
    { text: "AS", kind: "word" },
    { text: " distance" },
  ],
  [{ text: "  " }, { text: "FROM", kind: "word" }, { text: " passage_vector" }],
  [
    { text: "  " },
    { text: "ORDER BY", kind: "word" },
    { text: " distance " },
    { text: "LIMIT", kind: "word" },
    { text: " 300" },
  ],
  [{ text: ")" }],
  [
    { text: "SELECT", kind: "word" },
    { text: " p.page_id, t.text, v.distance" },
  ],
  [{ text: "FROM", kind: "word" }, { text: " v" }],
  [
    { text: "JOIN", kind: "word" },
    { text: " passage " },
    {
      text: "FOR SYSTEM_TIME AS OF TIMESTAMP '2007-12-31 23:59:59'",
      kind: "time",
    },
    { text: " " },
    { text: "AS", kind: "word" },
    { text: " p" },
  ],
  [{ text: "  " }, { text: "USING", kind: "word" }, { text: " (hash)" }],
  [
    { text: "JOIN", kind: "word" },
    { text: " passage_text " },
    { text: "AS", kind: "word" },
    { text: " t " },
    { text: "USING", kind: "word" },
    { text: " (hash)" },
  ],
  [{ text: "ORDER BY", kind: "word" }, { text: " v.distance;" }],
];

const LENGTH = LINES.flat().reduce((sum, part) => sum + part.text.length, 0);

function Tile({
  at,
  left,
  value,
  unit,
  what,
}: {
  at: number;
  left: number;
  value: number;
  unit?: string;
  what: string;
}) {
  const t = useT();
  const p = pop(t, at, 12);
  const counted = ramp(t, at, 0.9, (n) => 1 - (1 - n) ** 3);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 792,
        width: 480,
        height: 190,
        boxSizing: "border-box",
        borderRadius: 22,
        border: `1.5px solid ${dark.rule}`,
        background: dark.raised,
        padding: "26px 32px",
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 40}px)`,
      }}
    >
      <div
        style={{
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 84,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          color: dark.ink,
        }}
      >
        {number(counted * value)}
        {unit && (
          <span style={{ fontSize: 50, color: dark.soft }}> {unit}</span>
        )}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: sans,
          fontSize: 25,
          color: dark.faint,
        }}
      >
        {what}
      </div>
    </div>
  );
}

export function How() {
  const t = useT();
  const { duration } = scene("how");
  const vector = cue("how", "vector");
  const time = cue("how", "time");
  const one = cue("how", "one");
  const row = cue("how", "every");
  const shown = Math.round(ramp(t, 0.2, vector - 0.6, (n) => n) * LENGTH);
  const whole = ramp(t, one, 0.5, expo);
  let before = 0;

  return (
    <Shell duration={duration}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 200,
            top: 82,
            width: 1520,
            height: 670,
            boxSizing: "border-box",
            borderRadius: 26,
            border: `2px solid ${whole > 0 ? dark.rubric : dark.rule}`,
            background: dark.sunk,
            boxShadow: `0 50px 130px rgba(0,0,0,0.6), 0 0 ${whole * 90}px ${dark.rubric}55`,
            padding: "30px 48px",
            ...rise(t, 0.05, 40),
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Label size={18}>The SQL behind an answer · MariaDB 12.3</Label>
            <div
              style={{
                fontFamily: mono,
                fontSize: 20,
                color: dark.rubric,
                border: `1.5px solid ${dark.rubric}`,
                borderRadius: 30,
                padding: "6px 18px",
                opacity: whole,
                transform: `scale(${0.8 + whole * 0.2})`,
              }}
            >
              one statement
            </div>
          </div>

          <div
            style={{
              fontFamily: mono,
              fontSize: 28,
              lineHeight: "45px",
              color: dark.soft,
              whiteSpace: "pre",
            }}
          >
            {LINES.map((line, index) => (
              <div key={index} style={{ height: 45 }}>
                {line.map((part, at) => {
                  const start = before;

                  before += part.text.length;

                  const text = part.text.slice(0, Math.max(0, shown - start));
                  const lit =
                    part.kind === "vector"
                      ? ramp(t, vector, 0.35, expo)
                      : part.kind === "time"
                        ? ramp(t, time, 0.35, expo)
                        : 0;
                  const tint = part.kind === "vector" ? dark.gold : dark.rubric;

                  return (
                    <span
                      key={at}
                      style={{
                        color:
                          part.kind === "word"
                            ? dark.ink
                            : part.kind === "vector"
                              ? dark.gold
                              : part.kind === "time"
                                ? dark.rubric
                                : dark.soft,
                        fontWeight: part.kind === "word" ? 500 : 400,
                        background:
                          lit > 0
                            ? `${tint}${lit > 0.5 ? "2e" : "18"}`
                            : "none",
                        boxShadow:
                          lit > 0
                            ? `0 0 0 ${2 * lit}px ${tint}, 0 0 ${50 * lit}px ${tint}66`
                            : "none",
                        borderRadius: 8,
                        padding: lit > 0 ? "5px 0" : 0,
                      }}
                    >
                      {text}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          {[
            { at: vector, top: 196, text: "vector search", tint: dark.gold },
            { at: time, top: 466, text: "time travel", tint: dark.rubric },
          ].map((tag) => {
            const p = pop(t, tag.at + 0.08, 11);

            return (
              <div
                key={tag.text}
                style={{
                  position: "absolute",
                  right: 48,
                  top: tag.top,
                  fontFamily: sans,
                  fontWeight: 600,
                  fontSize: 30,
                  color: dark.bg,
                  background: tag.tint,
                  borderRadius: 12,
                  padding: "8px 20px",
                  opacity: Math.min(1, p * 1.5),
                  transform: `scale(${0.6 + p * 0.4})`,
                  transformOrigin: "100% 50%",
                }}
              >
                {tag.text}
              </div>
            );
          })}
        </div>

        <Tile
          at={row}
          left={200}
          value={1_630_250}
          what="wordings, each stored once"
        />
        <Tile
          at={row + 0.3}
          left={720}
          value={2_972_662}
          what="lifetimes in the versioned table"
        />
        <Tile
          at={row + 0.6}
          left={1240}
          value={9}
          unit="ms"
          what="to read an article as of any date"
        />
      </AbsoluteFill>
    </Shell>
  );
}
