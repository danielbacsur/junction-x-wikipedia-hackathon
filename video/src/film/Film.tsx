import type { ReactNode } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";

import { DISSOLVE, FPS, LINES, SHOTS, TOTAL, line, said, until } from "./clock";
import type { ShotId } from "./clock";
import { Dawn } from "./Dawn";
import { Filters, ramp, useNow } from "./kit";
import { Layers } from "./Layers";
import { Page } from "./Page";
import { Room } from "./Room";
import sounds from "./sounds.json";

const frames = (seconds: number) => Math.round(seconds * FPS);

const PICTURE: Record<ShotId, ReactNode> = {
  room: <Room />,
  page: <Page />,
  layers: <Layers />,
  dawn: <Dawn />,
};

/** A shot that dissolves in over the one before it. */
function Dissolve({ shot, children }: { shot: ShotId; children: ReactNode }) {
  const now = useNow(SHOTS[shot]);

  return (
    <AbsoluteFill
      style={{
        opacity:
          shot === "room" ? 1 : ramp(now, SHOTS[shot], DISSOLVE, (n) => n),
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/** A sound, by the second of the film it starts at. */
type Hit = { sound: string; at: number; volume: number; for?: number };

const has = (name: string) => (sounds as string[]).includes(name);

/** How loud each kind of sound sits against a narrator at -18 LUFS. */
const LEVEL: Record<string, number> = {
  scratch: 0.22,
  scrape: 0.43,
  page: 0.42,
  shimmer: 0.56,
  thread: 0.18,
  birds: 0.25,
};

const scrape = said("scraped", "scraped") - 0.1;
const write = said("scraped", "wrote") - 0.25;
const called = said("called", "palimpsest") - 0.55;
const figures = [
  line("largest").start + 1.0,
  said("everyday", "another") - 0.15,
  line("everyday").end + 0.7,
];

const HITS: Hit[] = [
  { sound: "fire", at: 0, volume: 0.5, for: SHOTS.page + DISSOLVE },
  { sound: "scratch", at: 2.2, volume: 0.22, for: 3.6 },

  { sound: "scrape", at: scrape, volume: 0.6 },
  { sound: "scrape", at: scrape + 0.72, volume: 0.6 },
  { sound: "scratch", at: write, volume: 0.55, for: 2.0 },
  { sound: "scratch", at: called, volume: 0.55, for: 1.15 },

  { sound: "scratch", at: line("largest").start, volume: 0.4, for: 0.9 },
  { sound: "scratch", at: figures[0], volume: 0.55, for: 0.85 },
  { sound: "scrape", at: said("everyday", "scraped") - 0.1, volume: 0.6 },
  { sound: "scratch", at: figures[1], volume: 0.55, for: 0.85 },
  { sound: "scrape", at: line("everyday").end + 0.05, volume: 0.6 },
  { sound: "scratch", at: figures[2], volume: 0.55, for: 0.85 },

  { sound: "page", at: SHOTS.layers + 0.2, volume: 0.5 },
  { sound: "shimmer", at: said("light", "light") - 0.3, volume: 0.55 },
  { sound: "page", at: line("light").end + 0.45, volume: 0.6 },
  { sound: "stamp", at: said("versions", "kept"), volume: 0.7 },
  { sound: "page", at: said("ask", "any"), volume: 0.4 },
  { sound: "scratch", at: line("ask").start + 0.15, volume: 0.35, for: 1.35 },
  { sound: "scratch", at: said("ask", "gemini") + 0.2, volume: 0.35, for: 1.4 },
  { sound: "thread", at: line("follow").start + 0.1, volume: 0.5 },
  { sound: "scratch", at: line("hand").start + 0.35, volume: 0.35, for: 1.55 },

  { sound: "birds", at: SHOTS.dawn + 0.2, volume: 0.4 },
  { sound: "scratch", at: line("name").start - 0.1, volume: 0.45, for: 1.2 },
];

/** The music sits under the narrator and rises where she pauses. */
const underVoice = (frame: number) => {
  const second = frame / FPS;
  const fadeIn = Math.min(1, second / 1.2);
  const fadeOut = Math.min(1, Math.max(0, (TOTAL - second) / 2.2));
  let speaking = 0;

  for (const spoken of LINES) {
    const near = Math.min(
      second - (spoken.start - 0.4),
      spoken.end + 0.6 - second,
    );

    speaking = Math.max(speaking, Math.min(1, Math.max(0, near / 0.4)));
  }

  return (0.32 - speaking * 0.22) * fadeIn * fadeOut;
};

export function Film() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Filters />

      {(Object.keys(SHOTS) as ShotId[]).map((shot) => (
        <Sequence
          key={shot}
          name={shot}
          from={frames(SHOTS[shot])}
          durationInFrames={frames(until(shot) - SHOTS[shot])}
        >
          <Dissolve shot={shot}>{PICTURE[shot]}</Dissolve>
        </Sequence>
      ))}

      {LINES.map((spoken) => (
        <Sequence
          key={spoken.id}
          name={`voice ${spoken.id}`}
          from={frames(spoken.start)}
        >
          <Audio src={staticFile(`film/audio/${spoken.id}.mp3`)} volume={1} />
        </Sequence>
      ))}

      {HITS.filter((hit) => has(hit.sound)).map((hit, index) => (
        <Sequence
          key={index}
          name={hit.sound}
          from={frames(hit.at)}
          durationInFrames={hit.for ? frames(hit.for) : undefined}
        >
          <Audio
            src={staticFile(`film/audio/${hit.sound}.mp3`)}
            volume={hit.volume * (LEVEL[hit.sound] ?? 1)}
          />
        </Sequence>
      ))}

      {has("music") && (
        <Audio src={staticFile("film/audio/music.mp3")} volume={underVoice} />
      )}
    </AbsoluteFill>
  );
}
