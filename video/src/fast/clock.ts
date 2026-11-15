import vo from "./vo.json";

export const FPS = 30;

/** Seconds of picture before the narrator speaks. */
const LEAD = 0.4;

export type LineId = keyof typeof vo;

export type Line = { id: LineId; start: number; end: number };

export const LINES: Line[] = [];

let at = LEAD;

for (const id of Object.keys(vo) as LineId[]) {
  LINES.push({ id, start: at, end: at + vo[id].duration });
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
