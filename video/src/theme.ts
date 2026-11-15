import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";

const latin = { subsets: ["latin" as const] };

export const serif = loadNewsreader("normal", {
  ...latin,
  weights: ["400", "500", "600"],
}).fontFamily;

loadNewsreader("italic", { ...latin, weights: ["400", "500"] });

export const sans = loadGeist("normal", {
  ...latin,
  weights: ["400", "500", "600"],
}).fontFamily;

export const mono = loadGeistMono("normal", {
  ...latin,
  weights: ["400", "500"],
}).fontFamily;

/** The product's dark palette: warm black paper, ink, and a scribe's red. */
export const dark = {
  bg: "#0f0d0a",
  raised: "#1a1612",
  sunk: "#0a0907",
  ink: "#ece5d6",
  soft: "#bcb3a2",
  faint: "#81786a",
  rule: "#332d25",
  rubric: "#e56a50",
  rubricWash: "#3a1d16",
  added: "#6cc0b0",
  addedWash: "#14302b",
  removed: "#e08a78",
  removedWash: "#3a1e18",
  gold: "#d2a441",
};

/** The light palette, for the cards that close the film. */
export const paper = {
  bg: "#f7f3ea",
  raised: "#fdfaf3",
  ink: "#1d1a16",
  soft: "#4d463c",
  faint: "#8a8172",
  rule: "#ddd4c1",
  rubric: "#b23a23",
};
