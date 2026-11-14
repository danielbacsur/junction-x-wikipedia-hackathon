"use client";

import type { Evidence, Sentence } from "@wtt/package-engine";
import { useEffect, useState } from "react";

import { jsonLines } from "@/lib/format";

type AskEvent =
  | { type: "evidence"; evidence: Evidence; ms: number }
  | { type: "text"; text: string }
  | {
      type: "done";
      answer: string;
      sentences: Sentence[];
      model: { name: string; where: string };
      ms: number;
    }
  | { type: "error"; message: string };

export type Asked = {
  status: "idle" | "searching" | "writing" | "done" | "error";
  evidence: Evidence | null;
  evidenceMs: number;
  answer: string;
  sentences: Sentence[];
  model: string;
  answerMs: number;
  error: string;
};

const IDLE: Asked = {
  status: "idle",
  evidence: null,
  evidenceMs: 0,
  answer: "",
  sentences: [],
  model: "",
  answerMs: 0,
  error: "",
};

const SEARCHING: Asked = { ...IDLE, status: "searching" };

/**
 * Asks one question as of one date and follows the answer as it arrives.
 * A new question or date abandons whatever was still on its way. What has
 * arrived is kept under the question it belongs to, so an answer to the
 * previous question is never shown under the new one.
 */
export function useAsk(question: string, date: string | null, enabled = true) {
  const key = question && enabled ? `${date ?? "now"}\n${question}` : "";
  const [arrived, setArrived] = useState<{ key: string; asked: Asked }>({
    key: "",
    asked: IDLE,
  });

  useEffect(() => {
    if (!key) return;

    const abort = new AbortController();

    const update = (change: (now: Asked) => Partial<Asked>) =>
      setArrived((held) => {
        const now = held.key === key ? held.asked : SEARCHING;

        return { key, asked: { ...now, ...change(now) } };
      });

    const run = async () => {
      const url = `/api/ask?q=${encodeURIComponent(question)}${
        date ? `&date=${encodeURIComponent(date)}` : ""
      }`;

      const response = await fetch(url, { signal: abort.signal });

      for await (const event of jsonLines<AskEvent>(response)) {
        if (event.type === "evidence") {
          update(() => ({
            status: event.evidence.sources.length > 0 ? "writing" : "done",
            evidence: event.evidence,
            evidenceMs: event.ms,
          }));
        } else if (event.type === "text") {
          update((now) => ({ answer: now.answer + event.text }));
        } else if (event.type === "done") {
          update(() => ({
            status: "done",
            answer: event.answer,
            sentences: event.sentences,
            model: event.model.name,
            answerMs: event.ms,
          }));
        } else {
          update(() => ({ status: "error", error: event.message }));
        }
      }
    };

    run().catch((error: unknown) => {
      if (abort.signal.aborted) return;

      update(() => ({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      }));
    });

    return () => abort.abort();
  }, [key, question, date]);

  if (!key) return IDLE;

  return arrived.key === key ? arrived.asked : SEARCHING;
}
