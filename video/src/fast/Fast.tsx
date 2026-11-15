import type { ComponentType } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

import { Filters } from "../film/kit";
import { B } from "./beats";
import { FPS, LINES, TOTAL } from "./clock";
import { Title } from "./closing";
import { MovedNumbers, Vanish } from "./findings";
import { Count, OneSentence, ScribePage, Scriptorium } from "./opening";
import type { Shot } from "./parts";
import { AnyDay, FollowTheClaim, SideBySide, TwoDays } from "./powers";
import sounds from "./sounds.json";
import { Checked, Rows, Search } from "./tech";

const frames = (seconds: number) => Math.round(seconds * FPS);

/**
 * Every shot of the film, by the second it cuts in. The film follows one
 * sentence: what it says, why that makes it a palimpsest, how it is kept,
 * and everything that can then be asked of it.
 */
const CUTS: { at: number; shot: ComponentType<Shot> }[] = [
  { at: B.one, shot: OneSentence },
  { at: B.room, shot: Scriptorium },
  { at: B.page, shot: ScribePage },
  { at: B.flurry, shot: Count },
  { at: B.rows, shot: Rows },
  { at: B.open, shot: AnyDay },
  { at: B.diff, shot: SideBySide },
  { at: B.ask, shot: Search },
  { at: B.spark, shot: Checked },
  { at: B.twice, shot: TwoDays },
  { at: B.trace, shot: FollowTheClaim },
  { at: B.vanish, shot: Vanish },
  { at: B.numbers, shot: MovedNumbers },
  { at: B.title, shot: Title },
];

function Run({ shot: Picture, d }: { shot: ComponentType<Shot>; d: number }) {
  const frame = useCurrentFrame();

  return <Picture t={frame / FPS} d={d} />;
}

/** A sound, by the second of the film it starts at. */
type Hit = { sound: string; at: number; volume?: number; for?: number };

const has = (name: string) => (sounds as string[]).includes(name);

/** How loud each kind of sound sits against a narrator at -15 LUFS. */
const LEVEL: Record<string, number> = {
  whoosh: 0.17,
  quill: 0.7,
  scrape: 0.38,
  pages: 0.34,
  impact: 0.55,
  shimmer: 0.25,
  stamp: 1.1,
  tick: 0.3,
  flip: 1.0,
  thread: 0.9,
  ding: 3.4,
  birds: 0.14,
  fire: 4,
};

const HITS: Hit[] = [
  ...CUTS.slice(1).map((cut) => ({ sound: "whoosh", at: cut.at - 0.08 })),

  { sound: "quill", at: B.one + 0.5 },
  { sound: "quill", at: B.one + 2.2 },
  { sound: "tick", at: B.eighteen - 0.45, for: 1.0 },
  { sound: "impact", at: B.three, volume: 0.7 },

  { sound: "fire", at: B.room, for: B.page - B.room + 0.4 },
  { sound: "quill", at: B.word - 0.15 },
  { sound: "scrape", at: B.scraped - 0.02 },
  { sound: "scrape", at: B.scraped + 0.26 },
  { sound: "quill", at: B.wrote },
  { sound: "quill", at: B.wrote + 0.4 },
  { sound: "shimmer", at: B.ghost, volume: 0.7, for: 1.6 },

  { sound: "pages", at: B.flurry },
  { sound: "impact", at: B.counted + 0.25 },

  { sound: "flip", at: B.rows + 0.2 },
  { sound: "flip", at: B.rows + 0.48 },
  { sound: "stamp", at: B.maria },
  { sound: "ding", at: B.appeared, volume: 0.7 },
  { sound: "ding", at: B.replaced, volume: 0.7 },

  { sound: "tick", at: B.open + 0.3, for: (B.day - B.open) * 0.55 },
  { sound: "impact", at: B.day, volume: 0.5 },
  { sound: "ding", at: B.quick },

  { sound: "ding", at: B.see },
  { sound: "ding", at: B.see + 0.38 },
  { sound: "ding", at: B.see + 0.76 },

  { sound: "quill", at: B.ask + 0.1 },
  { sound: "thread", at: B.vector - 0.1 },
  { sound: "shimmer", at: B.meaning - 0.3, volume: 0.5, for: 1.2 },
  { sound: "scrape", at: B.stood, volume: 0.7 },
  { sound: "impact", at: B.query, volume: 0.6 },

  { sound: "shimmer", at: B.spark, volume: 0.6, for: 1.2 },
  { sound: "quill", at: B.answers - 0.05 },
  { sound: "thread", at: B.only - 0.1 },
  { sound: "stamp", at: B.checked, volume: 0.8 },
  { sound: "ding", at: B.checked + 0.05 },

  { sound: "flip", at: B.twice + 0.05 },
  { sound: "flip", at: B.twice + 0.2 },
  { sound: "quill", at: B.today },
  { sound: "ding", at: B.higher },

  { sound: "thread", at: B.follow - 0.2 },
  { sound: "thread", at: B.follow + 1.3 },
  { sound: "impact", at: B.back + 0.5, volume: 0.7 },

  { sound: "quill", at: B.vanish + 0.25 },
  { sound: "scrape", at: B.vanished },
  { sound: "tick", at: B.hundred, for: B.returned + 0.45 - B.hundred },
  { sound: "quill", at: B.returned },
  { sound: "ding", at: B.returned + 0.45 },

  { sound: "flip", at: B.numbers + 0.2 },
  { sound: "flip", at: B.numbers + 0.6 },
  { sound: "flip", at: B.numbers + 1.0 },
  { sound: "impact", at: B.quietly },

  { sound: "birds", at: B.title + 0.2 },
  { sound: "impact", at: B.named - 0.05 },
  { sound: "quill", at: B.named },
  { sound: "ding", at: B.find + 0.2, volume: 0.6 },
  { sound: "ding", at: B.dated, volume: 0.6 },
  { sound: "ding", at: B.answer + 0.15, volume: 0.6 },
];

/** How loud the music plays in the pauses, and under the voice. */
const MUSIC = { loud: 0.64, under: 0.19 };

/** The music sits under the narrator and rises where he pauses. */
const underVoice = (frame: number) => {
  const second = frame / FPS;
  const fadeOut = Math.min(1, Math.max(0, (TOTAL - second) / 1.8));
  let speaking = 0;

  for (const spoken of LINES) {
    const near = Math.min(
      second - (spoken.start - 0.25),
      spoken.end + 0.35 - second,
    );

    speaking = Math.max(speaking, Math.min(1, Math.max(0, near / 0.25)));
  }

  return (MUSIC.loud - speaking * (MUSIC.loud - MUSIC.under)) * fadeOut;
};

export function Fast() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Filters />

      {CUTS.map((cut, index) => {
        const d = (CUTS[index + 1]?.at ?? B.end) - cut.at;

        return (
          <Sequence
            key={index}
            from={frames(cut.at)}
            durationInFrames={Math.max(1, frames(cut.at + d) - frames(cut.at))}
          >
            <Run shot={cut.shot} d={d} />
          </Sequence>
        );
      })}

      {LINES.map((spoken) => (
        <Sequence key={spoken.id} from={frames(spoken.start)}>
          <Audio src={staticFile(`fast/audio/${spoken.id}.mp3`)} volume={1} />
        </Sequence>
      ))}

      {HITS.filter((hit) => has(hit.sound)).map((hit, index) => (
        <Sequence
          key={index}
          from={Math.max(0, frames(hit.at))}
          durationInFrames={hit.for ? Math.max(1, frames(hit.for)) : undefined}
        >
          <Audio
            src={staticFile(`fast/audio/${hit.sound}.mp3`)}
            volume={(hit.volume ?? 1) * (LEVEL[hit.sound] ?? 0.5)}
          />
        </Sequence>
      ))}

      {has("music") && (
        <Audio src={staticFile("fast/audio/music.mp3")} volume={underVoice} />
      )}
    </AbsoluteFill>
  );
}
