"use client";

import type { Shown } from "@wtt/package-engine";
import { useEveAgent } from "eve/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SqlDrawer } from "@/components/sql-drawer";
import { Reply } from "./reply";

const EXAMPLES = [
  "What did Wikipedia say about Finnish losses in the Winter War in 2007, and what does it say now?",
  "When did the article Talvisota first say that Finland lost about 26 600 men?",
  "Who was president of Finland on 1 March 1925, according to Wikipedia at the end of 2012?",
  "Mitä Wikipedia kertoi talvisodan tappioista vuonna 2007?",
  "Show the editing timeline of Suomen sisällissota.",
];
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
function Dates({ text }: { text: string }) {
  return text.split(/(\b\d{4}(?:-\d{2})?(?:-\d{2})?\b)/).map((s, i) =>
    i % 2 ? (
      <span key={i} className="text-rubric tabular-nums">
        {s}
      </span>
    ) : (
      s
    ),
  );
}
function ToolPanel({
  name,
  input,
  output,
  state,
  error,
}: {
  name: string;
  input: unknown;
  output: unknown;
  state: string;
  error?: unknown;
}) {
  const result = record(output);
  const sql = Array.isArray(result.sql)
    ? result.sql.filter(
        (s): s is Shown =>
          typeof s?.sql === "string" &&
          typeof s?.ms === "number" &&
          typeof s?.rows === "number",
      )
    : [];
  const collection = [
    "paragraphs",
    "passages",
    "articles",
    "changes",
    "matches",
    "lifetimes",
  ].find((k) => Array.isArray(result[k]));
  // The two tools that answer in one call say what they found, so the
  // evidence can be compared with the reply without opening anything.
  const snapshot = (side: unknown) => {
    const { asOf, wikipediaAsOf, passages, holders } = record(side);
    const [passage] = Array.isArray(passages) ? passages.map(record) : [];
    const names = Array.isArray(holders)
      ? holders.map((holder) => String(record(holder).holder)).join(", ")
      : null;

    return passage
      ? `${String(asOf)} · ${String(passage.article)}: ${String(passage.text).slice(0, 170)}…`
      : names !== null
        ? `Wikipedia as of ${String(wikipediaAsOf)}: ${names || "no article claims that day"}`
        : null;
  };
  const sides = [
    snapshot(result.then),
    snapshot(result.onTheDateAsked),
    snapshot(result.now),
  ].filter((line): line is string => line !== null);

  const summary = result.error
    ? String(result.error)
    : sides.length > 0
      ? sides.join("\n")
      : collection
        ? `${(result[collection] as unknown[]).length} ${collection} returned${result.article ? ` · ${result.article}` : ""}${result.asOf ? ` · ${result.asOf}` : ""}`
        : result.edits !== undefined
          ? `${result.edits} edits · ${result.reverts} reverts · ${result.firstEdit} – ${result.lastEdit}`
          : state === "completed"
            ? "Lookup complete"
            : state === "failed"
              ? `Lookup failed: ${String(error ?? "please retry")}`
              : "Looking it up…";
  const { sql: omitted, ...evidence } = result;
  void omitted;
  return (
    <section
      className="rise my-4 min-w-0 border-y border-rule py-3"
      aria-label={`${name} tool call`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs">{name}</h3>
        <span className="text-xs text-ink-faint">{state}</span>
      </div>
      <p className="mt-2 break-words font-mono text-xs text-ink-soft">
        <Dates
          text={Object.entries(record(input))
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(" · ")}
        />
      </p>
      <p className="mt-2 text-sm whitespace-pre-line text-ink-soft">
        <Dates text={summary} />
      </p>
      {output !== undefined && (
        <details className="my-3 text-xs text-ink-soft">
          <summary className="cursor-pointer">Inspect evidence</summary>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs">
            {JSON.stringify(evidence, null, 2)}
          </pre>
        </details>
      )}
      <SqlDrawer sql={sql} title={`SQL · ${name}`} />
    </section>
  );
}
export function Historian() {
  const params = useSearchParams();
  const sessionId = params.get("session");
  return <Conversation key={sessionId ?? "new"} sessionId={sessionId} />;
}
function Conversation({ sessionId }: { sessionId: string | null }) {
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");
  const [model, setModel] = useState("Connecting to the historian…");
  const agent = useEveAgent({
    agent: "historian",
    initialSession: sessionId ? { sessionId, streamIndex: 0 } : undefined,
    resume: !!sessionId,
    onSessionChange: (session) => {
      if (session)
        window.history.replaceState(
          null,
          "",
          `/agent?session=${encodeURIComponent(session.sessionId)}`,
        );
    },
  });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/eve/historian/v1/info", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Unavailable");
        return r.json();
      })
      .then((info) => {
        const m = info.agent?.model;
        setModel(
          m
            ? `${m.id} · ${m.endpoint?.provider === "ollama" ? "runs on this laptop" : "hosted model"}`
            : "Model information unavailable",
        );
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setModel("Model information unavailable");
      });
    return () => controller.abort();
  }, []);
  const busy = agent.status !== "idle";
  async function send(message: string) {
    if (!message.trim() || busy) return;
    setSendError("");
    try {
      await agent.send(message.trim());
      setDraft("");
    } catch (e) {
      setSendError(
        e instanceof Error ? e.message : "Message could not be sent",
      );
    }
  }
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-12 pb-24">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-xs tracking-wide text-ink-faint uppercase">
          Palimpsest / The historian
        </p>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Ask the historian agent.
        </h1>
        <p className="mt-4 text-ink-soft">
          Ask what Finnish Wikipedia said, when a claim appeared, or how an
          article changed. A local model picks the lookups, and each one shows
          what MariaDB returned and the SQL it ran.
        </p>
        <p className="mt-4 text-xs text-ink-faint">AI historian · {model}</p>
        <p className="mt-1 text-xs text-ink-faint">
          Latest in the dataset:{" "}
          <span className="text-rubric">1 October 2026</span>.
        </p>
        {agent.messages.length === 0 && (
          <div className="my-10">
            <p className="mb-3 text-xs tracking-wide text-ink-faint uppercase">
              Try
            </p>
            <ul className="space-y-3">
              {EXAMPLES.map((q) => (
                <li key={q}>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setDraft(q);
                      void send(q);
                    }}
                    className="text-left font-serif text-lg text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink disabled:opacity-50"
                  >
                    <Dates text={q} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-10 space-y-8" aria-label="Conversation">
          {agent.messages.map((message) => (
            <article key={message.id} className="rise min-w-0">
              <h2 className="mb-3 text-xs tracking-wide text-ink-faint uppercase">
                {message.role === "user" ? "You" : "Historian"}
              </h2>
              {message.parts.map((part, i) =>
                part.type === "text" ? (
                  <Reply
                    key={part.id ?? i}
                    text={part.text}
                    streaming={busy && message.role !== "user"}
                  />
                ) : part.type === "tool" ? (
                  <ToolPanel
                    key={part.callId}
                    name={part.name}
                    input={part.input}
                    output={part.output}
                    state={part.state}
                    error={part.error}
                  />
                ) : null,
              )}
              {message.role !== "user" &&
                !busy &&
                message.parts.some((part) => part.type === "text") && (
                  <p className="mt-3 text-xs text-ink-faint">
                    Written by the model from the lookups above. Its wording is
                    not checked against them, so open the evidence before
                    trusting a number.
                  </p>
                )}
            </article>
          ))}
        </div>
        {busy && (
          <p role="status" className="writing mt-6 text-sm text-ink-soft">
            {agent.status === "resuming"
              ? "Reopening the conversation…"
              : "Looking it up. The local model takes a few seconds."}
          </p>
        )}
        {(sendError || agent.error) && (
          <p role="alert" className="mt-4 text-sm text-removed">
            {sendError || agent.error?.message}
          </p>
        )}
        <form
          className="mt-8 border-t border-rule pt-6"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <label
            htmlFor="historian-question"
            className="text-xs tracking-wide text-ink-faint uppercase"
          >
            {agent.messages.length
              ? "Continue the conversation"
              : "Your question"}
          </label>
          <textarea
            id="historian-question"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, and Shift with Enter starts a new line.
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                if (draft.trim()) void send(draft);
              }
            }}
            rows={3}
            disabled={busy}
            placeholder="What did Wikipedia say about…"
            className="mt-2 w-full resize-y rounded border border-rule bg-paper-raised p-4 font-serif text-lg outline-none focus:border-ink-soft disabled:opacity-60"
          />
          <div className="mt-3 flex items-center justify-between gap-4">
            <a
              href="/agent"
              className="text-xs text-ink-soft underline decoration-rule underline-offset-4"
            >
              New conversation
            </a>
            <button
              disabled={busy || !draft.trim()}
              className="rounded bg-ink px-5 py-3 text-sm font-medium text-paper disabled:opacity-40"
              type="submit"
            >
              Ask the historian
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
