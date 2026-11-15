import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";

import { Label, Mark, Shell, expo, pop, ramp, rise, useT } from "../lib";
import { dark, mono, paper, sans, serif } from "../theme";
import { cue, scene, spoken } from "../timeline";

/** One of the three loud cards before the close. */
function Card({
  from,
  until,
  background,
  color,
  ghost,
  children,
}: {
  from: number;
  until: number;
  background: string;
  color: string;
  ghost?: string;
  children: string;
}) {
  const t = useT();

  if (t < from || t >= until) return null;

  const p = pop(t, from, 13);
  const drift = (t - from) * 0.02;

  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          transform: `scale(${0.82 + p * 0.18 + drift})`,
        }}
      >
        {ghost &&
          [2, 1].map((depth) => (
            <div
              key={depth}
              style={{
                position: "absolute",
                left: depth * 20 * p,
                top: depth * -16 * p,
                fontFamily: serif,
                fontWeight: 500,
                fontSize: 300,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                whiteSpace: "nowrap",
                color: "transparent",
                WebkitTextStroke: `2px ${ghost}`,
                opacity: 0.4 / depth,
              }}
            >
              {children}
            </div>
          ))}
        <div
          style={{
            position: "relative",
            fontFamily: serif,
            fontWeight: 500,
            fontSize: 300,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
            color,
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** Words that are underlined in red when the voice reaches them. */
function Under({ at, children }: { at: number; children: ReactNode }) {
  const t = useT();
  const p = ramp(t, at, 0.4, expo);

  return (
    <span style={{ position: "relative", whiteSpace: "nowrap" }}>
      <span style={{ color: p > 0.4 ? paper.rubric : paper.ink }}>
        {children}
      </span>
      <span
        style={{
          position: "absolute",
          left: 0,
          bottom: -4,
          height: 6,
          borderRadius: 6,
          width: `${p * 100}%`,
          background: paper.rubric,
        }}
      />
    </span>
  );
}

export function End() {
  const t = useT();
  const { duration } = scene("end");
  const claim = cue("end", "any", 1);
  const edit = cue("end", "every");
  const close = cue("end", "if") - 0.08;
  const done = spoken("end");

  return (
    <Shell duration={duration}>
      <Card from={0} until={claim} background={paper.bg} color={paper.ink}>
        Any date.
      </Card>
      <Card from={claim} until={edit} background={dark.rubric} color={dark.bg}>
        Any claim.
      </Card>
      <Card
        from={edit}
        until={close}
        background={dark.bg}
        color={dark.ink}
        ghost={dark.rubric}
      >
        Every edit.
      </Card>

      {t >= close && (
        <AbsoluteFill style={{ background: paper.bg }}>
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(900px 520px at 50% 108%, rgba(178,58,35,0.2), transparent 70%)",
              opacity: ramp(t, close, 1.2),
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 150,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 30,
              ...rise(t, close, 30, 0.5),
            }}
          >
            <Mark size={132} light />
            <div
              style={{
                fontFamily: serif,
                fontWeight: 500,
                fontSize: 138,
                letterSpacing: "-0.025em",
                color: paper.ink,
              }}
            >
              Palimpsest
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 410,
              textAlign: "center",
              fontFamily: serif,
              fontSize: 70,
              color: paper.soft,
              ...rise(t, close + 0.1, 30, 0.5),
            }}
          >
            If Wikipedia ever said it,
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 516,
              textAlign: "center",
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 84,
              color: paper.ink,
              opacity: ramp(t, cue("end", "palimpsest") - 0.1, 0.3),
            }}
          >
            Palimpsest can <Under at={cue("end", "find")}>find it</Under>,{" "}
            <Under at={cue("end", "date", 1)}>date it</Under> and{" "}
            <Under at={cue("end", "answer")}>answer from it</Under>.
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 716,
              display: "flex",
              justifyContent: "center",
              gap: 22,
              ...rise(t, done + 0.15, 24, 0.5),
            }}
          >
            {["Built on MariaDB", "Answers by Gemini"].map((text) => (
              <div
                key={text}
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 32,
                  color: paper.ink,
                  background: paper.raised,
                  border: `1.5px solid ${paper.rule}`,
                  borderRadius: 60,
                  padding: "16px 34px",
                }}
              >
                {text}
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 836,
              textAlign: "center",
              ...rise(t, done + 0.45, 24, 0.5),
            }}
          >
            <span
              style={{
                fontFamily: mono,
                fontWeight: 500,
                fontSize: 36,
                color: paper.bg,
                background: paper.ink,
                borderRadius: 16,
                padding: "16px 34px",
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
              top: 962,
              textAlign: "center",
              ...rise(t, done + 0.7, 16, 0.5),
            }}
          >
            <Label color={paper.faint} size={19}>
              Junction 2026 · Wikipedia Through Time · 862,076 versions of
              Finnish Wikipedia
            </Label>
          </div>
        </AbsoluteFill>
      )}
    </Shell>
  );
}
