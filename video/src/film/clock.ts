import vo from "./vo.json";

export const FPS = 30;

/** Seconds of picture and music before the narrator speaks. */
const LEAD = 1.7;

export type LineId = keyof typeof vo;

export type Line = {
  id: LineId;
  shot: string;

  /** Seconds from the start of the film. */
  start: number;
  end: number;
};

export const LINES: Line[] = [];

let at = LEAD;

for (const id of Object.keys(vo) as LineId[]) {
  LINES.push({ id, shot: vo[id].shot, start: at, end: at + vo[id].duration });
  at += vo[id].duration + vo[id].gap;
}

export const TOTAL = Math.ceil(at * FPS) / FPS;

export const line = (id: LineId) => LINES.find((l) => l.id === id)!;

const plain = (word: string) => word.toLowerCase().replace(/[^a-z0-9-]/g, "");

/** The second of the film at which the narrator reaches a word. */
export const said = (id: LineId, word: string, nth = 0) => {
  const hit = vo[id].words.filter((w) => plain(w.w).startsWith(plain(word)))[
    nth
  ];

  if (!hit) throw new Error(`the narrator never says "${word}" in ${id}`);

  return line(id).start + hit.start;
};

/** How long one shot dissolves into the next. */
export const DISSOLVE = 0.7;

/** When each shot begins, in seconds of the film. */
export const SHOTS = {
  room: 0,
  page: line("scraped").start - 0.45,
  layers: line("light").start - 0.75,
  dawn: line("gone").start - 0.9,
};

export type ShotId = keyof typeof SHOTS;

const ORDER = Object.keys(SHOTS) as ShotId[];

/** The second a shot is gone, once the next has dissolved in over it. */
export const until = (shot: ShotId) => {
  const next = ORDER[ORDER.indexOf(shot) + 1];

  return next ? SHOTS[next] + DISSOLVE : TOTAL;
};
