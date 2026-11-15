import type { ReactNode } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";

import { Backdrop } from "./lib";
import sounds from "./sounds.json";
import { Ask } from "./scenes/Ask";
import { End } from "./scenes/End";
import { Hook } from "./scenes/Hook";
import { How } from "./scenes/How";
import { Office } from "./scenes/Office";
import { Title } from "./scenes/Title";
import { Trace } from "./scenes/Trace";
import { Who } from "./scenes/Who";
import { FPS, SCENES, TOTAL, cue, scene, spoken } from "./timeline";
import type { SceneId } from "./timeline";

const PICTURE: Record<SceneId, ReactNode> = {
  hook: <Hook />,
  title: <Title />,
  ask: <Ask />,
  trace: <Trace />,
  who: <Who />,
  office: <Office />,
  how: <How />,
  end: <End />,
};

const frames = (seconds: number) => Math.round(seconds * FPS);

/** A sound effect, placed by scene and by the second inside it. */
type Hit = {
  sound: string;
  in: SceneId;
  at: number;
  volume?: number;

  /** Seconds after which the sound is cut off. */
  for?: number;
};

const has = (name: string) => (sounds as string[]).includes(name);

/** How loud each kind of sound sits against a voice at -16 LUFS. */
const LEVEL: Record<string, number> = {
  typing: 0.5,
  impact: 0.6,
  count: 0.55,
  rewind: 0.6,
  whoosh: 0.75,
  step: 0.8,
  strike: 0.8,
  scan: 0.7,
};

const starts = SCENES.slice(1).map((s) => ({
  sound: "whoosh",
  in: s.id,
  at: -0.12,
  volume: 0.5,
})) satisfies Hit[];

const HITS: Hit[] = [
  ...starts,

  { sound: "rewind", in: "hook", at: cue("hook", "but"), volume: 0.6 },
  { sound: "tick", in: "hook", at: cue("hook", "but") + 0.85, volume: 0.7 },
  { sound: "tick", in: "hook", at: cue("hook", "but") + 1.6, volume: 0.7 },

  {
    sound: "impact",
    in: "title",
    at: cue("title", "palimpsest"),
    volume: 0.75,
  },
  { sound: "count", in: "title", at: cue("title", "eight"), volume: 0.4 },
  { sound: "pop", in: "title", at: cue("title", "in"), volume: 0.6 },
  { sound: "pop", in: "title", at: cue("title", "questioned"), volume: 0.6 },

  { sound: "typing", in: "ask", at: 0.2, volume: 0.55 },
  { sound: "click", in: "ask", at: cue("ask", "date"), volume: 0.8 },
  { sound: "click", in: "ask", at: cue("ask", "date") + 0.55, volume: 0.8 },
  { sound: "pop", in: "ask", at: cue("ask", "gemini"), volume: 0.45 },
  { sound: "pop", in: "ask", at: cue("ask", "next"), volume: 0.45 },
  { sound: "pop", in: "ask", at: cue("ask", "every"), volume: 0.4 },
  { sound: "chime", in: "ask", at: cue("ask", "every", 1), volume: 0.5 },

  { sound: "click", in: "trace", at: cue("trace", "paste") + 0.1, volume: 0.7 },
  { sound: "whoosh", in: "trace", at: cue("trace", "drop"), volume: 0.45 },
  {
    sound: "scan",
    in: "trace",
    at: cue("trace", "screenshot") + 0.3,
    volume: 0.45,
  },
  {
    sound: "count",
    in: "trace",
    at: cue("trace", "palimpsest") + 0.2,
    volume: 0.35,
  },
  { sound: "step", in: "trace", at: cue("trace", "twenty-two"), volume: 0.6 },
  { sound: "step", in: "trace", at: cue("trace", "twenty-six"), volume: 0.6 },
  { sound: "step", in: "trace", at: cue("trace", "and"), volume: 0.6 },
  { sound: "chime", in: "trace", at: cue("trace", "first"), volume: 0.5 },

  { sound: "strike", in: "who", at: cue("who", "deleted"), volume: 0.6 },
  {
    sound: "count",
    in: "who",
    at: cue("who", "two"),
    volume: 0.3,
    for: cue("who", "back") - cue("who", "two"),
  },
  { sound: "chime", in: "who", at: cue("who", "back"), volume: 0.5 },

  { sound: "impact", in: "office", at: 0.25, volume: 0.5 },
  { sound: "typing", in: "office", at: cue("office", "who"), volume: 0.45 },
  {
    sound: "tick",
    in: "office",
    at: cue("office", "1925") + 0.75,
    volume: 0.7,
  },
  { sound: "tick", in: "office", at: cue("office", "it"), volume: 0.7 },
  { sound: "tick", in: "office", at: cue("office", "which"), volume: 0.7 },
  { sound: "tick", in: "office", at: cue("office", "you"), volume: 0.7 },

  { sound: "typing", in: "how", at: 0.2, volume: 0.5 },
  { sound: "pop", in: "how", at: cue("how", "every"), volume: 0.4 },
  { sound: "pop", in: "how", at: cue("how", "every") + 0.3, volume: 0.4 },
  { sound: "pop", in: "how", at: cue("how", "every") + 0.6, volume: 0.4 },
  { sound: "chime", in: "how", at: cue("how", "vector"), volume: 0.4 },
  { sound: "chime", in: "how", at: cue("how", "time"), volume: 0.4 },
  { sound: "impact", in: "how", at: cue("how", "one"), volume: 0.45 },

  { sound: "impact", in: "end", at: 0.02, volume: 0.6 },
  { sound: "impact", in: "end", at: cue("end", "any", 1), volume: 0.6 },
  { sound: "impact", in: "end", at: cue("end", "every"), volume: 0.6 },
  { sound: "whoosh", in: "end", at: cue("end", "if") - 0.2, volume: 0.5 },
  { sound: "tick", in: "end", at: cue("end", "find"), volume: 0.5 },
  { sound: "tick", in: "end", at: cue("end", "date", 1), volume: 0.5 },
  { sound: "tick", in: "end", at: cue("end", "answer"), volume: 0.5 },
  { sound: "chime", in: "end", at: spoken("end") + 0.15, volume: 0.5 },
];

/** How long each typing sound may run before it is cut off. */
const TYPED: Partial<Record<SceneId, number>> = {
  ask: cue("ask", "date") - 0.5 - 0.2,
  office: cue("office", "1925") + 0.45 - cue("office", "who"),
  how: cue("how", "vector") - 0.6,
};

/** The music sits low under the voice and comes up where nobody speaks. */
const underVoice = (frame: number) => {
  const second = frame / FPS;
  const fadeIn = Math.min(1, second / 0.6);
  const fadeOut = Math.min(1, Math.max(0, (TOTAL - second) / 1.6));
  let speaking = 0;

  for (const s of SCENES) {
    const from = s.start + s.lead;
    const until = s.start + spoken(s.id);
    const near = Math.min(second - (from - 0.35), until + 0.5 - second);

    speaking = Math.max(speaking, Math.min(1, Math.max(0, near / 0.35)));
  }

  return (0.42 - speaking * 0.3) * fadeIn * fadeOut;
};

export function Main() {
  return (
    <AbsoluteFill style={{ background: "#0f0d0a" }}>
      <Backdrop />

      {SCENES.map((s) => (
        <Sequence
          key={s.id}
          name={s.id}
          from={frames(s.start)}
          durationInFrames={frames(s.duration)}
        >
          {PICTURE[s.id]}
          <Sequence from={frames(s.lead)} name={`voice ${s.id}`}>
            <Audio src={staticFile(`audio/vo-${s.id}.mp3`)} volume={1} />
          </Sequence>
        </Sequence>
      ))}

      {HITS.filter((hit) => has(hit.sound)).map((hit, index) => {
        const from = frames(scene(hit.in).start + hit.at);
        const typed =
          hit.for ?? (hit.sound === "typing" ? TYPED[hit.in] : undefined);

        return (
          <Sequence
            key={index}
            name={`${hit.sound} in ${hit.in}`}
            from={Math.max(0, from)}
            durationInFrames={typed ? frames(typed) : undefined}
          >
            <Audio
              src={staticFile(`audio/${hit.sound}.mp3`)}
              volume={(hit.volume ?? 0.5) * (LEVEL[hit.sound] ?? 1)}
            />
          </Sequence>
        );
      })}

      {has("music") && (
        <Audio src={staticFile("audio/music.mp3")} volume={underVoice} />
      )}
    </AbsoluteFill>
  );
}
