import { type Message, chatModel, streamChat } from "@wtt/package-models";

import type { Evidence } from "./evidence.ts";
import { LAST_EDIT } from "./time.ts";

const day = (at: string) => at.slice(0, 10);

/**
 * What the model is told. It may only restate the numbered passages, and
 * every sentence has to say which passage it came from, so a reader can
 * check each one against the version of the article that held it.
 */
export const answerPrompt = (evidence: Evidence): Message[] => {
  const date = day(evidence.at ?? LAST_EDIT);

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
        `in the language of the question. Translate carefully: "kaatunut" and ` +
        `"menehtynyt" mean killed, "haavoittunut" means wounded. Copy every ` +
        `number and name exactly as the passage has it. End every sentence ` +
        `with the number of the passage it comes from, like [1] or [2][3]. Do ` +
        `not use anything you know from elsewhere, and do not mention events ` +
        `after ${date}. If the passages do not answer the question, say that ` +
        `Wikipedia's passages from that date do not answer it, and say what ` +
        `they do cover.`,
    },
    {
      role: "user",
      content: `Passages:\n\n${sources}\n\nQuestion: ${evidence.question}`,
    },
  ];
};

/** One sentence of an answer with the passages it cites. */
export type Sentence = { text: string; cites: number[]; supported: boolean };

/**
 * Splits an answer into sentences and checks every citation in code. A
 * sentence that cites nothing, or a passage that was never given, is
 * marked as unsupported instead of being trusted.
 */
export const checkAnswer = (answer: string, sources: number): Sentence[] =>
  (answer.match(/[^.!?\n]+(?:[.!?]+|$)(?:\s*\[\d+\])*/g) ?? [])
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const cites = [...part.matchAll(/\[(\d+)\]/g)].map((match) =>
        Number(match[1]),
      );

      return {
        text: part.replace(/\s*\[\d+\]/g, "").trim(),
        cites,
        supported:
          cites.length > 0 &&
          cites.every((cite) => cite >= 1 && cite <= sources),
      };
    })
    .filter((sentence) => sentence.text.length > 0);

/** Streams the answer to a question from its evidence. */
export const streamAnswer = (evidence: Evidence): AsyncGenerator<string> =>
  streamChat(answerPrompt(evidence), { maxTokens: 400, temperature: 0.1 });

export const answerModel = chatModel;
