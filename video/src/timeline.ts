import vo from "./vo.json";

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export type SceneId = keyof typeof vo;

/** Silence before the voice starts in a scene, and the hold after it ends. */
const PADS: Record<SceneId, { lead: number; tail: number }> = {
  hook: { lead: 0.7, tail: 0.55 },
  title: { lead: 0.45, tail: 0.7 },
  ask: { lead: 0.4, tail: 0.8 },
  trace: { lead: 0.4, tail: 0.8 },
  who: { lead: 0.4, tail: 0.7 },
  office: { lead: 0.4, tail: 0.7 },
  how: { lead: 0.4, tail: 0.8 },
  end: { lead: 0.3, tail: 2.9 },
};

export const ORDER: SceneId[] = [
  "hook",
  "title",
  "ask",
  "trace",
  "who",
  "office",
  "how",
  "end",
];

export type Scene = {
  id: SceneId;
  /** Seconds from the start of the film. */
  start: number;
  duration: number;
  /** Seconds into the scene at which the voice starts. */
  lead: number;
};

export const SCENES: Scene[] = [];

for (const id of ORDER) {
  const last = SCENES.at(-1);
  const { lead, tail } = PADS[id];

  SCENES.push({
    id,
    start: last ? last.start + last.duration : 0,
    duration: Math.ceil((lead + vo[id].duration + tail) * FPS) / FPS,
    lead,
  });
}

export const scene = (id: SceneId) => SCENES.find((s) => s.id === id)!;

export const TOTAL = SCENES.at(-1)!.start + SCENES.at(-1)!.duration;

const plain = (word: string) => word.toLowerCase().replace(/[^a-z0-9:-]/g, "");

/**
 * The second, counted from the start of its scene, at which the voice
 * reaches a word. Scenes hang their motion on these.
 */
export const cue = (id: SceneId, word: string, nth = 0) => {
  const hit = vo[id].words.filter((w) => plain(w.w).startsWith(plain(word)))[
    nth
  ];

  if (!hit) throw new Error(`the voice never says "${word}" in ${id}`);

  return scene(id).lead + hit.start;
};

/** The second at which the voice of a scene falls silent. */
export const spoken = (id: SceneId) => scene(id).lead + vo[id].duration;
