import { type Message, chatModel, streamChat } from "@wtt/package-models";

import type { Evidence } from "./evidence.ts";
import { languageOf } from "./keywords.ts";
import { LAST_EDIT } from "./time.ts";

const day = (at: string) => at.slice(0, 10);

const LANGUAGE = { fi: "Finnish", sv: "Swedish", en: "English" };

// Said last and in the language itself, which a small model obeys more
// often than an instruction in English at the top.
const REMINDER = {
  fi: "Vastaa suomeksi.",
  sv: "Svara på svenska.",
  en: "Answer in English.",
};

/**
 * What the model is told. It may only restate the numbered passages, and
 * every sentence has to say which passage it came from, so a reader can
 * check each one against the version of the article that held it.
 */
export const answerPrompt = (evidence: Evidence): Message[] => {
  const date = day(evidence.at ?? LAST_EDIT);
  const language = LANGUAGE[languageOf(evidence.question)];

  const sources = evidence.sources
    .map(
      (source) =>
        `[${source.n}] From the article "${source.title}", in a paragraph ` +
        `written on ${day(source.bornAt)}:\n${source.text}`,
    )
    .join("\n\n");

  return [
    {
      role: "system",
      content:
        `You answer questions about what Finnish Wikipedia said on ${date}. ` +
        `You are given numbered passages, in Finnish, that stood in Wikipedia ` +
        `on that date. Answer only from them, in two to four short sentences, ` +
        `in ${language}, the language of the question. Translate carefully: ` +
        `"kaatunut", "kuollut" and "menehtynyt" mean killed, "haavoittunut" ` +
        `means wounded, and "sotatoimissa kuollutta" means killed in action. ` +
        `Copy every ` +
        `number and name exactly as the passage has it. End every sentence ` +
        `with the number of the passage it comes from, like [1] or [2][3]. Do ` +
        `not use anything you know from elsewhere, and do not mention events ` +
        `after ${date}. If the passages do not answer the question, say that ` +
        `Wikipedia's passages from that date do not answer it, and say what ` +
        `they do cover.`,
    },
    {
      role: "user",
      content:
        `Passages:\n\n${sources}\n\nQuestion: ${evidence.question}\n\n` +
        REMINDER[languageOf(evidence.question)],
    },
  ];
};

/** One sentence of an answer with the passages it cites. */
export type Sentence = {
  text: string;
  cites: number[];

  /**
   * It cites passages that were given, and its numbers are in them. This
   * checks citations and figures. It does not check that the passage means
   * what the sentence says.
   */
  supported: boolean;

  /** Numbers in the sentence that none of its cited passages contain. */
  missing: string[];
};

type Figure = {
  /** The number as it was written. */
  written: string;

  /** Every value it can be read as, with thousands joined and "." for decimals. */
  readings: string[];

  /** The runs of digits a date or a decimal is made of. */
  parts: string[];
};

/**
 * The numbers in a text, one at a time. "26 662", "26,662" and "26.662"
 * are all 26662, "2,5" is 2.5, and a number written like "5.619" is kept
 * as both because the two languages disagree about it. Two numbers that
 * only stand next to each other, as in "1956–1982" or "27, 1982", stay
 * two numbers: running all the digits of a passage together let "5619"
 * pass as a number found in "1956–1982".
 */
export const figures = (text: string): Figure[] =>
  [
    ...text
      // A date such as "13.3.1940" is a day, a month and a year.
      .replace(/(?<![\d.])(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d)/g, "$1 / $2 / $3")
      .matchAll(
        /(?<!\d)(?:(\d{1,3}(?:[ \u00a0\u202f.,]\d{3}(?!\d))+)|(\d+)(?:[.,](\d+))?)/g,
      ),
  ].map(([written, grouped, whole, fraction]) => {
    if (grouped) {
      const groups = grouped.split(/\D/);
      const decimal = groups.length === 2 && /[.,]/.test(grouped);

      return {
        written,
        readings: [groups.join(""), ...(decimal ? [groups.join(".")] : [])],
        parts: [],
      };
    }

    return fraction
      ? {
          written,
          readings: [`${whole}.${fraction}`],
          parts: [whole, fraction],
        }
      : { written, readings: [whole], parts: [] };
  });

/**
 * Where an answer's sentences end. A full stop ends a sentence only when a
 * capital letter or the end of the text follows, because Finnish writes
 * dates as "13. maaliskuuta" and those stops end nothing. Neither does the
 * stop after an initial, as in "K. J. Ståhlberg".
 */
const sentences = (answer: string): string[] => {
  const found: string[] = [];
  const stop =
    /(?<!(?:^|[\s(])\p{Lu})[.!?]+(?:[\s,]*\[[\d,\s]+\])*(?=\s+[\p{Lu}"“”'(]|\s*$)/gu;
  let from = 0;

  for (let match = stop.exec(answer); match; match = stop.exec(answer)) {
    found.push(answer.slice(from, match.index + match[0].length));
    from = match.index + match[0].length;
  }

  if (answer.slice(from).trim()) found.push(answer.slice(from));

  return found.map((part) => part.trim()).filter(Boolean);
};

/**
 * Splits an answer into sentences and checks each one in code. A sentence
 * that cites nothing, cites a passage that was never given, or states a
 * number that is not in the passages it cites is marked as unsupported
 * instead of being trusted. A small model writes fluent sentences around
 * wrong figures, and this is the check that catches them.
 */
export const checkAnswer = (answer: string, sources: string[]): Sentence[] =>
  sentences(answer)
    .map((part) => {
      // A model writes [2][5] or [2, 5]; both cite passages 2 and 5.
      const cites = [...part.matchAll(/\[([\d,\s]+)\]/g)].flatMap((match) =>
        match[1].split(",").map(Number).filter(Boolean),
      );
      const text = part.replace(/\s*\[[\d,\s]+\]/g, "").trim();
      const valid =
        cites.length > 0 &&
        cites.every((cite) => cite >= 1 && cite <= sources.length);

      const cited = new Set(
        valid
          ? cites
              .flatMap((cite) => figures(sources[cite - 1]))
              .flatMap((figure) => [...figure.readings, ...figure.parts])
          : [],
      );

      // Single digits are left alone: "one of the two" is not a figure.
      const missing = valid
        ? figures(text)
            .filter((figure) => figure.written.replace(/\D/g, "").length > 1)
            .filter(
              (figure) =>
                !figure.readings.some((reading) => cited.has(reading)),
            )
            .map((figure) => figure.written)
        : [];

      return { text, cites, supported: valid && missing.length === 0, missing };
    })
    .filter((sentence) => sentence.text.length > 0);

/** Streams the answer to a question from its evidence. */
export const streamAnswer = (evidence: Evidence): AsyncGenerator<string> =>
  streamChat(answerPrompt(evidence), { maxTokens: 400, temperature: 0.1 });

export const answerModel = chatModel;
