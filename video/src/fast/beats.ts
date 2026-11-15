import { TOTAL, line, said } from "./clock";

/**
 * Every moment the picture hangs on, in seconds of the film. Each one is
 * the narrator reaching a word, so the cuts follow his voice.
 */
export const B = {
  // "This is one sentence from Wikipedia… eighteen wordings, three different numbers."
  one: 0,
  about: said("sentence", "how"),
  eighteen: said("sentence", "eighteen"),
  three: said("sentence", "three"),

  // "That's a palimpsest: a page scraped and written over, with the old words still showing through."
  room: line("name").start - 0.15,
  word: said("name", "palimpsest"),
  page: said("name", "page") - 0.25,
  scraped: said("name", "scraped"),
  wrote: said("name", "written"),
  ghost: said("name", "old"),

  // "Our Palimpsest keeps every layer: every version of nearly twenty thousand articles…"
  flurry: line("kept").start - 0.15,
  counted: said("kept", "of") - 0.25,
  finland: said("kept", "finland"),

  // "Each paragraph lives in a system-versioned MariaDB table, with the second it appeared and the second it was replaced."
  rows: said("kept", "each") - 0.15,
  versioned: said("kept", "system-versioned"),
  maria: said("kept", "mariadb"),
  appeared: said("kept", "appeared"),
  replaced: said("kept", "replaced"),

  // "Pick any day, and the article is back as it stood, in nine milliseconds."
  open: line("read").start - 0.15,
  day: said("read", "stood"),
  quick: said("read", "nine"),

  // "Put two days side by side, and every changed word is marked."
  diff: said("read", "put") - 0.15,
  next: said("read", "side"),
  see: said("read", "every"),

  // "Ask how many Finns died, and vector search finds the passages by meaning, as they stood that day, in one query."
  ask: line("ask").start - 0.15,
  asked: said("ask", "and"),
  vector: said("ask", "vector"),
  meaning: said("ask", "meaning"),
  stood: said("ask", "stood"),
  query: said("ask", "one"),

  // "Gemini answers only from those, and every number is checked against its source."
  spark: said("ask", "gemini") - 0.15,
  answers: said("ask", "answers"),
  only: said("ask", "only"),
  number: said("ask", "number"),
  checked: said("ask", "checked"),
  cited: said("ask", "source"),

  // "Ask again as of today, and the answer is sixty-two higher."
  twice: line("two").start - 0.15,
  today: said("two", "today"),
  higher: said("two", "sixty-two"),

  // "Follow a claim back through every rewrite, to whoever wrote it first: Cimon Avaro."
  trace: line("trace").start - 0.15,
  follow: said("trace", "follow"),
  back: said("trace", "cimon") - 0.75,

  // "See who changed what, to the second. This paragraph was deleted, and back a hundred and fifteen seconds later."
  vanish: line("who").start - 0.15,
  evening: said("who", "this"),
  vanished: said("who", "deleted"),
  hundred: said("who", "hundred"),
  returned: said("who", "later") - 0.45,

  // "Across the archive, nearly seven thousand numbers changed while the words around them stayed."
  numbers: line("wider").start - 0.15,
  quietly: said("wider", "seven"),
  stayed: said("wider", "while"),

  // "If Wikipedia ever said it, Palimpsest can find it, date it, and answer from it."
  title: line("slogan").start - 0.2,
  named: said("slogan", "palimpsest"),
  find: said("slogan", "can"),
  dated: said("slogan", "date"),
  answer: said("slogan", "and"),
  spoken: line("slogan").end,
  end: TOTAL,
};
