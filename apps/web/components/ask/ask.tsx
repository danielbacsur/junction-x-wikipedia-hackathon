"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { TimeDial } from "@/components/time-dial";

import { AnswerCard } from "./answer-card";
import { useAsk } from "./use-ask";
import { useStanding } from "./use-standing";

// The local model writes Finnish well and translates it loosely, so the
// first example is one it answers in the language of its passages.
const EXAMPLES = [
  { question: "Kuinka monta suomalaista kaatui talvisodassa?", year: 2007 },
  { question: "Kuka oli Suomen presidentti vuosina 1956–1982?", year: 2010 },
  { question: "Mistä Suomen sisällissota johtui?", year: 2006 },
  { question: "How many Finnish soldiers died in the Winter War?", year: 2007 },
  { question: "Vad hände i Finland år 1918?", year: 2010 },
];

const yearOf = (raw: string | null) =>
  raw && /^\d{4}$/.test(raw) ? Number(raw) : null;

/**
 * The front page: one question, one date, and the answer Wikipedia would
 * have given that day next to the one it gives now. The question and the
 * date live in the address, so any answer can be sent to someone.
 */
export function Ask() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const question = params.get("q") ?? "";
  const year = yearOf(params.get("date"));

  const [draft, setDraft] = useState(question);
  const [dial, setDial] = useState<number | null>(year);
  const [hovered, setHovered] = useState<number | null>(null);
  const [hoveredNow, setHoveredNow] = useState<number | null>(null);

  const then = useAsk(question, year === null ? null : String(year));
  const now = useAsk(question, null, year !== null);

  const go = (nextQuestion: string, nextYear: number | null) => {
    const next = new URLSearchParams();
    if (nextQuestion) next.set("q", nextQuestion);
    if (nextYear !== null) next.set("date", String(nextYear));

    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const comparing = question !== "" && year !== null;

  // Each answer shows only its own best passages, so the two lists cannot
  // be compared with each other. The versioned table is asked instead
  // whether every passage also stood on the other date.
  const thenToday = useStanding(
    comparing ? then.evidence?.sources : undefined,
    null,
  );
  const todayThen = useStanding(
    comparing ? now.evidence?.sources : undefined,
    year === null ? null : String(year),
  );

  const count = (standing: typeof thenToday, state: string) =>
    Object.values(standing ?? {}).filter((fate) => fate.state === state).length;

  const same = count(thenToday, "same");
  const reworded = count(thenToday, "reworded");
  const gone = count(thenToday, "absent");
  const fresh = count(todayThen, "absent");

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-12 pb-24">
      <section className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          What did Wikipedia say{" "}
          <em className="text-rubric">
            {dial === null ? "today" : `in ${dial}`}
          </em>
          ?
        </h1>

        <p className="mt-3 max-w-2xl text-ink-soft">
          Ask in English, Finnish or Swedish. The answer is written only from
          paragraphs that stood in Finnish Wikipedia on the date you pick. Each
          sentence cites a paragraph, and each paragraph links to the version
          that held it.
        </p>

        <form
          className="mt-7 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            go(draft.trim(), dial);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about the history of Finland…"
            aria-label="Your question"
            className="h-12 min-w-0 flex-1 rounded border border-rule bg-paper-raised px-4 font-serif text-lg outline-none placeholder:text-ink-faint focus:border-ink-soft"
          />
          <button
            type="submit"
            className="h-12 rounded bg-ink px-5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
          >
            Ask
          </button>
        </form>

        <div className="mt-7">
          <TimeDial
            year={dial}
            onChange={setDial}
            onCommit={(next) => {
              if (question) go(question, next);
            }}
          />
        </div>

        {!question && (
          <div className="mt-10">
            <p className="mb-2 text-xs tracking-wide text-ink-faint uppercase">
              Try
            </p>
            <ul className="flex flex-col gap-1.5">
              {EXAMPLES.map((example) => (
                <li key={example.question}>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(example.question);
                      setDial(example.year);
                      go(example.question, example.year);
                    }}
                    className="text-left font-serif text-lg text-ink-soft underline decoration-rule decoration-1 underline-offset-4 hover:text-ink hover:decoration-rubric"
                  >
                    {example.question}
                    <span className="ml-2 font-sans text-xs text-ink-faint no-underline">
                      {example.year ? `as of ${example.year}` : "today"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {question && (
        <section className="mt-14">
          {comparing && thenToday && todayThen && (
            <p className="rise mb-6 rounded border border-rule bg-paper-sunk px-4 py-3 text-sm text-ink-soft">
              Same question, two dates. Of the passages Wikipedia held in {year}
              , <b className="font-medium text-ink">{same}</b>{" "}
              {same === 1 ? "still stands" : "still stand"} word for word,{" "}
              <b className="font-medium text-rubric">{reworded}</b>{" "}
              {reworded === 1 ? "reads" : "read"} differently today and{" "}
              <b className="font-medium text-removed">{gone}</b>{" "}
              {gone === 1 ? "has" : "have"} no counterpart left. Of
              today&apos;s, <b className="font-medium text-added">{fresh}</b>{" "}
              had none in {year}.
            </p>
          )}

          <div
            className={`grid gap-10 ${comparing ? "lg:grid-cols-2" : "mx-auto max-w-3xl"}`}
          >
            <AnswerCard
              asked={then}
              side="then"
              standing={thenToday}
              other={{ label: "today", later: true }}
              hovered={hovered}
              onHover={setHovered}
            />
            {comparing && (
              <AnswerCard
                asked={now}
                side="now"
                standing={todayThen}
                other={{ label: `in ${year}`, later: false }}
                hovered={hoveredNow}
                onHover={setHoveredNow}
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}
