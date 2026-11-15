import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";

import {
  Cursor,
  Label,
  Mark,
  Shell,
  Swap,
  Typed,
  expo,
  inOut,
  ramp,
  rise,
  track,
  useT,
} from "../lib";
import { dark, mono, sans, serif } from "../theme";
import { cue, scene } from "../timeline";

const QUESTION = "How many Finns died in the Winter War?";

/** The small four-pointed star that stands for the model. */
function Spark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 1c.6 6.2 4.8 10.4 11 11-6.2.6-10.4 4.8-11 11-.6-6.2-4.8-10.4-11-11 6.2-.6 10.4-4.8 11-11z"
        fill={dark.added}
      />
    </svg>
  );
}

function Figure({
  children,
  checked,
}: {
  children: ReactNode;
  checked: number;
}) {
  return (
    <span
      style={{
        color: checked > 0.5 ? dark.added : dark.rubric,
        background:
          checked > 0
            ? `rgba(108,192,176,${0.2 * checked})`
            : "rgba(229,106,80,0.16)",
        borderRadius: 8,
        padding: "0 8px",
        margin: "0 -2px",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Answer({
  left,
  at,
  heading,
  note,
  before,
  figure,
  after,
  passage,
  passageFigure,
  passageAfter,
  written,
  cited,
  checked,
}: {
  left: number;
  at: number;
  heading: string;
  note: string;
  before: string;
  figure: string;
  after: string;
  passage: string;
  passageFigure: string;
  passageAfter: string;
  written: string;
  cited: number;
  checked: number;
}) {
  const t = useT();
  const words = [...before.split(" "), "#", ...after.split(" ")];
  const shown = Math.round(ramp(t, at + 0.15, 1.7, (n) => n) * words.length);
  const done = shown >= words.length;
  const mark = ramp(t, checked, 0.4);
  const source = ramp(t, cited, 0.5, expo);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 262,
        width: 716,
        ...rise(t, at, 36, 0.5),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderBottom: `1.5px solid ${dark.rule}`,
          paddingBottom: 12,
        }}
      >
        <div>
          <Label size={15}>Wikipedia on</Label>
          <div
            style={{
              fontFamily: serif,
              fontSize: 54,
              lineHeight: 1.15,
              color: dark.rubric,
            }}
          >
            {heading}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: sans,
            fontSize: 19,
            color: dark.added,
            border: `1px solid ${dark.added}55`,
            borderRadius: 30,
            padding: "6px 14px",
          }}
        >
          <Spark size={18} />
          {note}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          minHeight: 176,
          fontFamily: serif,
          fontSize: 42,
          lineHeight: 1.32,
          color: dark.ink,
        }}
      >
        {words.slice(0, shown).map((word, index) =>
          word === "#" ? (
            <span key={index}>
              <Figure checked={mark}>{figure}</Figure>{" "}
            </span>
          ) : index === words.length - 1 ? null : (
            <span key={index}>{word} </span>
          ),
        )}
        {done && (
          <span style={{ whiteSpace: "nowrap" }}>
            {words.at(-1)}{" "}
            <span
              style={{
                display: "inline-flex",
                width: 30,
                height: 30,
                borderRadius: 6,
                alignItems: "center",
                justifyContent: "center",
                background: dark.rubricWash,
                color: dark.rubric,
                fontFamily: sans,
                fontSize: 18,
                fontWeight: 600,
                verticalAlign: "0.2em",
                boxShadow:
                  source > 0 && source < 1
                    ? `0 0 0 ${6 * (1 - source)}px ${dark.rubric}66`
                    : "none",
              }}
            >
              1
            </span>
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          borderRadius: 16,
          border: `1.5px solid ${mark > 0 ? dark.added : source > 0 ? dark.rubric : dark.rule}`,
          background: dark.sunk,
          padding: "18px 22px 16px",
          opacity: source,
          transform: `translateY(${(1 - source) * 30}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: sans,
            fontSize: 22,
            fontWeight: 600,
            color: dark.ink,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: dark.rubricWash,
              color: dark.rubric,
              fontSize: 17,
            }}
          >
            1
          </span>
          Talvisota
          <span
            style={{
              marginLeft: "auto",
              fontFamily: mono,
              fontWeight: 400,
              fontSize: 17,
              color: dark.faint,
            }}
          >
            {written}
          </span>
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: serif,
            fontStyle: "italic",
            fontSize: 27,
            lineHeight: 1.4,
            color: dark.soft,
          }}
        >
          {passage} <Figure checked={mark}>{passageFigure}</Figure>{" "}
          {passageAfter}
        </div>
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: sans,
            fontSize: 22,
            color: dark.added,
            opacity: mark,
          }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={11} fill={dark.added} />
            <path
              d="M6.5 12.5l3.6 3.6 7.4-8"
              fill="none"
              stroke={dark.bg}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {figure} is in the passage it cites
        </div>
      </div>
    </div>
  );
}

export function Ask() {
  const t = useT();
  const { duration } = scene("ask");
  const picked = cue("ask", "date");
  const asked = picked + 0.55;
  const then = cue("ask", "gemini");
  const today = cue("ask", "next");
  const cited = cue("ask", "every");
  const checked = cue("ask", "every", 1);
  const tilt = 1 - ramp(t, 0, 0.9, expo);
  const year = track(t, [picked, picked + 0.5], [2026.75, 2007.99], inOut);
  const handle = 44 + ((year - 2003) / 24) * 1472;

  return (
    <Shell duration={duration}>
      <AbsoluteFill style={{ perspective: 2200 }}>
        <div
          style={{
            position: "absolute",
            left: 180,
            top: 104,
            width: 1560,
            height: 880,
            borderRadius: 30,
            border: `1.5px solid ${dark.rule}`,
            background: dark.raised,
            boxShadow: "0 60px 140px rgba(0,0,0,0.65)",
            transform: `rotateX(${tilt * 16}deg) translateY(${tilt * 80}px)`,
            transformOrigin: "50% 100%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 44,
              right: 44,
              top: 22,
              height: 50,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Mark size={40} />
            <span style={{ fontFamily: serif, fontSize: 30, color: dark.ink }}>
              Palimpsest
            </span>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 34,
                fontFamily: sans,
                fontSize: 21,
                color: dark.faint,
              }}
            >
              {["Ask", "Read", "Trace", "Atlas", "Agent"].map((page) => (
                <span
                  key={page}
                  style={{ color: page === "Ask" ? dark.ink : dark.faint }}
                >
                  {page}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 44,
              top: 92,
              width: 1010,
              height: 82,
              borderRadius: 16,
              border: `1.5px solid ${dark.rule}`,
              background: dark.sunk,
              display: "flex",
              alignItems: "center",
              padding: "0 26px",
              fontFamily: sans,
              fontSize: 32,
              color: dark.ink,
            }}
          >
            <Typed text={QUESTION} from={0.2} until={picked - 0.5} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 1074,
              top: 92,
              width: 300,
              height: 82,
              borderRadius: 16,
              border: `1.5px solid ${t >= picked ? dark.rubric : dark.rule}`,
              background: t >= picked ? dark.rubricWash : dark.sunk,
              padding: "12px 22px",
              boxSizing: "border-box",
              transform: `scale(${1 + Math.max(0, 1 - Math.abs(t - picked) / 0.14) * -0.04})`,
            }}
          >
            <Label size={13}>Wikipedia on</Label>
            <div
              style={{
                fontFamily: sans,
                fontWeight: 500,
                fontSize: 29,
                color: t >= picked ? dark.rubric : dark.soft,
              }}
            >
              <Swap
                value={t >= picked ? "31 Dec 2007" : "latest"}
                since={t >= picked ? picked : -1}
              />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 1394,
              top: 92,
              width: 122,
              height: 82,
              borderRadius: 16,
              background: dark.rubric,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 28,
              color: dark.bg,
              transform: `scale(${1 - Math.max(0, 1 - Math.abs(t - asked) / 0.14) * 0.07})`,
            }}
          >
            Ask
          </div>

          {/* The years of the dataset, and the handle on the one asked about. */}
          <div
            style={{
              position: "absolute",
              left: 44,
              top: 212,
              width: 1472,
              height: 2,
              background: dark.rule,
            }}
          />
          {Array.from({ length: 25 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 44 + (i / 24) * 1472,
                top: 206,
                width: 2,
                height: 14,
                background: dark.rule,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: handle - 9,
              top: 203,
              width: 20,
              height: 20,
              borderRadius: 20,
              background: dark.rubric,
              boxShadow: `0 0 24px ${dark.rubric}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: handle - 60,
              width: 120,
              top: 226,
              textAlign: "center",
              fontFamily: mono,
              fontSize: 16,
              color: dark.rubric,
            }}
          >
            {Math.floor(year)}
          </div>

          <Answer
            left={44}
            at={then}
            heading="31 December 2007"
            note="written by Gemini"
            before="Finnish losses in the Winter War were"
            figure="26 600"
            after={"killed in action and about 1\u00a0000 civilians."}
            passage="Suomalaisten tappiot talvisodassa olivat"
            passageFigure="26 600"
            passageAfter="sotatoimissa menehtynyttä ja noin 1 000 siviiliä."
            written="written 15 Sep 2007 by Myllyre"
            cited={cited}
            checked={checked}
          />
          <Answer
            left={800}
            at={today}
            heading="Today"
            note="written by Gemini"
            before="Finnish losses in the Winter War were"
            figure="26 662"
            after="killed in action and about a thousand civilians."
            passage="Suomalaisten tappiot talvisodassa olivat"
            passageFigure="26 662"
            passageAfter="sotatoimissa kuollutta ja noin tuhat siviiliä."
            written="written 9 Sep 2026 by Jesper Vire"
            cited={cited + 0.22}
            checked={checked + 0.25}
          />

          <div
            style={{
              position: "absolute",
              left: 778,
              top: 262,
              width: 2,
              height: 580,
              background: dark.rule,
              opacity: ramp(t, today, 0.4) * 0.8,
            }}
          />

          <Cursor
            path={[
              { at: picked - 0.75, x: 1120, y: 620 },
              { at: picked - 0.05, x: 1230, y: 142 },
              { at: picked + 0.12, x: 1230, y: 142 },
              { at: asked - 0.05, x: 1452, y: 140 },
              { at: asked + 0.2, x: 1452, y: 140 },
              { at: asked + 1.2, x: 1500, y: 836 },
            ]}
            clicks={[picked, asked]}
          />
        </div>
      </AbsoluteFill>
    </Shell>
  );
}
