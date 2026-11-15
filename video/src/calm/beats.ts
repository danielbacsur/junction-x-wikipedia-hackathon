import { TOTAL, line, said } from "./clock";

/** How long one shot dissolves into the next. */
export const DISSOLVE = 0.6;

/**
 * Every moment the picture hangs on, in seconds of the film. Each one is
 * the narrator reaching a word.
 */
export const B = {
  hill: 0,
  hall: said("scribes", "so") - 0.5,
  page: said("scribes", "scraped") - 0.35,
  scraped: said("scribes", "scraped"),
  wrote: said("scribes", "and") - 0.05,
  ghost: said("scribes", "but"),
  called: said("scribes", "called"),

  wiki: line("wikipedia").start - 0.6,
  one: line("wikipedia").start,
  rewritten: said("wikipedia", "rewritten"),
  thousand: said("wikipedia", "sixty-two"),
  times: said("wikipedia", "times"),
  top: said("wikipedia", "top"),

  light: line("light").start - 0.6,
  lit: said("light", "light"),

  open: line("open").start - 0.5,
  diff: said("open", "lay") - 0.35,
  see: said("open", "see"),
  ask: said("open", "ask") - 0.35,
  gemini: said("open", "gemini"),
  today: said("open", "right"),

  trace: line("follow").start - 0.5,
  back: said("follow", "back"),
  hand: said("follow", "hand"),
  who: said("follow", "and") - 0.35,
  down: said("follow", "down"),

  kept: line("close").start - 0.5,
  seal: said("close", "kept"),
  dusk: said("close", "nothing") - 0.4,
  title: said("close", "this") - 0.3,
  named: said("close", "palimpsest"),
  end: TOTAL,
};
