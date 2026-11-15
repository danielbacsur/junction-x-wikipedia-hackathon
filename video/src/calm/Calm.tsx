import type { ComponentType } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

import { Filters, ramp } from "../film/kit";
import { B, DISSOLVE } from "./beats";
import { FPS, LINES, TOTAL } from "./clock";
import type { Shot } from "./kit";
import {
  AnyDay,
  AskTwoDays,
  Dusk,
  FollowTheClaim,
  Kept,
  SideBySide,
  WhoChanged,
} from "./powers";
import { Hall, Hill, Light, ScribePage, WikiPage } from "./story";

const frames = (seconds: number) => Math.round(seconds * FPS);

const Title: ComponentType<Shot> = (shot) => <Dusk {...shot} title />;

/** Every shot of the film, by the second it begins to dissolve in. */
const SHOTS: { at: number; shot: ComponentType<Shot> }[] = [
  { at: B.hill, shot: Hill },
  { at: B.hall, shot: Hall },
  { at: B.page, shot: ScribePage },
  { at: B.wiki, shot: WikiPage },
  { at: B.light, shot: Light },
  { at: B.open, shot: AnyDay },
  { at: B.diff, shot: SideBySide },
  { at: B.ask, shot: AskTwoDays },
  { at: B.trace, shot: FollowTheClaim },
  { at: B.who, shot: WhoChanged },
  { at: B.kept, shot: Kept },
  { at: B.dusk, shot: Dusk },
  { at: B.title, shot: Title },
];

/** One shot, dissolving in over the one before and drifting a little closer. */
function Run({
  shot: Picture,
  d,
  first,
}: {
  shot: ComponentType<Shot>;
  d: number;
  first: boolean;
}) {
  const t = useCurrentFrame() / FPS;

  return (
    <AbsoluteFill
      style={{
        opacity: first ? 1 : ramp(t, 0, DISSOLVE, (n) => n),
        transform: `scale(${1 + t * 0.004})`,
      }}
    >
      <Picture t={t} d={d} />
    </AbsoluteFill>
  );
}

/** A sound, by the second of the film it starts at. */
type Hit = { sound: string; at: number; volume?: number; for?: number };

/** The levels of the voice, the music and the two ambiences. */
const LEVELS = {
  voice: 1,
  musicLoud: 0.28,
  musicUnder: 0.09,
  meadow: 2.4,
  evening: 0.14,
};

/** Where each sound lives, and how loud it sits against the narrator. */
const LEVEL: Record<string, [string, number]> = {
  meadow: ["calm", LEVELS.meadow],
  evening: ["calm", LEVELS.evening],
  quill: ["fast", 0.38],
  scrape: ["fast", 0.2],
  pages: ["fast", 0.12],
  shimmer: ["fast", 0.14],
  stamp: ["fast", 0.6],
  flip: ["fast", 0.54],
  thread: ["fast", 0.48],
  ding: ["fast", 1.9],
  tick: ["fast", 0.16],
};

const HITS: Hit[] = [
  { sound: "meadow", at: 0, for: B.hall + DISSOLVE + 0.4 },
  { sound: "quill", at: B.hall + 0.5, volume: 0.6 },
  { sound: "quill", at: B.hall + 1.7, volume: 0.6 },

  { sound: "scrape", at: B.scraped + 0.1 },
  { sound: "scrape", at: B.scraped + 0.6 },
  { sound: "quill", at: B.wrote },
  { sound: "quill", at: B.wrote + 0.7 },
  { sound: "shimmer", at: B.ghost, for: 2.2 },
  { sound: "quill", at: B.called + 0.3 },

  { sound: "quill", at: B.wiki + 0.5 },
  { sound: "scrape", at: B.rewritten },
  { sound: "quill", at: B.rewritten + 0.75 },
  { sound: "scrape", at: B.thousand + 0.1 },
  { sound: "quill", at: B.thousand + 0.85 },

  { sound: "shimmer", at: B.lit - 0.3 },
  { sound: "pages", at: B.lit + 0.5, for: 1.6 },

  { sound: "tick", at: B.open + 0.7, for: 1.6 },
  { sound: "ding", at: B.see },
  { sound: "ding", at: B.see + 0.6 },
  { sound: "ding", at: B.see + 1.2 },
  { sound: "quill", at: B.ask + 0.5 },
  { sound: "flip", at: B.gemini },
  { sound: "shimmer", at: B.gemini - 0.2, for: 1.6, volume: 0.8 },
  { sound: "flip", at: B.today },
  { sound: "thread", at: B.back - 0.4 },
  { sound: "thread", at: B.back + 1.0 },
  { sound: "quill", at: B.hand + 0.4 },
  { sound: "scrape", at: B.who + 0.9 },
  { sound: "quill", at: B.down },
  { sound: "ding", at: B.down + 0.65 },
  { sound: "flip", at: B.kept + 0.1 },
  { sound: "flip", at: B.kept + 0.3 },
  { sound: "flip", at: B.kept + 0.5 },
  { sound: "stamp", at: B.seal - 0.05 },
  { sound: "evening", at: B.dusk, for: TOTAL - B.dusk },
  { sound: "quill", at: B.named - 0.5 },
];

/** The music sits under the narrator and rises where she pauses. */
const underVoice = (frame: number) => {
  const second = frame / FPS;
  const fadeIn = Math.min(1, second / 1.5);
  const fadeOut = Math.min(1, Math.max(0, (TOTAL - second) / 2.4));
  let speaking = 0;

  for (const spoken of LINES) {
    const near = Math.min(
      second - (spoken.start - 0.4),
      spoken.end + 0.6 - second,
    );

    speaking = Math.max(speaking, Math.min(1, Math.max(0, near / 0.4)));
  }

  return (
    (LEVELS.musicLoud - speaking * (LEVELS.musicLoud - LEVELS.musicUnder)) *
    fadeIn *
    fadeOut
  );
};

export function Calm() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Filters />

      {SHOTS.map((each, index) => {
        const next = SHOTS[index + 1]?.at;
        const until = next === undefined ? B.end : next + DISSOLVE;

        return (
          <Sequence
            key={index}
            from={frames(each.at)}
            durationInFrames={frames(until) - frames(each.at)}
          >
            <Run
              shot={each.shot}
              d={(next ?? B.end) - each.at}
              first={index === 0}
            />
          </Sequence>
        );
      })}

      {LINES.map((spoken) => (
        <Sequence key={spoken.id} from={frames(spoken.start)}>
          <Audio
            src={staticFile(`calm/audio/${spoken.id}.mp3`)}
            volume={LEVELS.voice}
          />
        </Sequence>
      ))}

      {HITS.map((hit, index) => {
        const [folder, level] = LEVEL[hit.sound];

        return (
          <Sequence
            key={index}
            from={Math.max(0, frames(hit.at))}
            durationInFrames={
              hit.for ? Math.max(1, frames(hit.for)) : undefined
            }
          >
            <Audio
              src={staticFile(`${folder}/audio/${hit.sound}.mp3`)}
              volume={(hit.volume ?? 1) * level}
            />
          </Sequence>
        );
      })}

      <Audio src={staticFile("calm/audio/music.mp3")} volume={underVoice} />
    </AbsoluteFill>
  );
}
