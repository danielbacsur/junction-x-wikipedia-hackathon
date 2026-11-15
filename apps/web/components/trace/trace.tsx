"use client";

import type { Trace, Tracing } from "@wtt/package-engine";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SqlDrawer } from "@/components/sql-drawer";
import validation from "@/content/validation.json";
import { day, number, readHref } from "@/lib/format";

import { ImageClaim } from "./image-claim";
import { arrange } from "./arrange";
import { Timeline } from "./timeline";
import { useTrace } from "./use-trace";
import { WordingCard } from "./wording-card";

const EXAMPLES = [
  {
    claim: "Talvisodassa kuoli 26 662 suomalaista sotilasta",
    about: "losses in the Winter War",
  },
  {
    claim: "Urho Kekkonen oli Suomen presidentti vuosina 1956–1982",
    about: "Kekkonen's presidency",
  },
  {
    claim:
      "Suomen sisällissota käytiin vuonna 1918 punaisten ja valkoisten välillä",
    about: "the civil war of 1918",
  },
  {
    claim: "Finland declared independence from Russia in December 1917",
    about: "asked in English",
  },
];

/**
 * How much of history can be found at all: only a wording with a vector,
 * and the job that computes them is still running. Counting them reads
 * every vector, so the count is the one taken when the data was last
 * checked.
 */
const COVERAGE =
  `${number(validation.corpus.embeddedWordings)} of ` +
  `${number(validation.corpus.searchableWordings)} wordings had a vector ` +
  `when last counted, on ${day(validation.validatedAt.replace("T", " "))}`;

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

function Examples({ onPick }: { onPick: (claim: string) => void }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {EXAMPLES.map((example) => (
        <li key={example.claim}>
          <button
            type="button"
            onClick={() => onPick(example.claim)}
            className="text-left font-serif text-lg text-ink-soft underline decoration-rule decoration-1 underline-offset-4 hover:text-ink hover:decoration-rubric"
          >
            {example.claim}
            <span className="ml-2 inline-block font-sans text-xs text-ink-faint no-underline">
              {example.about}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The answer in one line, then every wording behind it. */
function Found({ tracing, earliest }: { tracing: Tracing; earliest: Trace }) {
  const [lit, setLit] = useState<string | null>(null);

  const { traces, terms, figures, earliestSaying } = tracing;
  const groups = arrange(traces);
  const figure = figures.join(" and ");
  const standing = traces.filter((trace) => trace.alive).length;
  const gone = traces.length - standing;

  const writer = earliest.writtenBy;
  const anonymous = writer.editor === "ip" || writer.editor === "temp";

  return (
    <>
      <div className="rise mx-auto max-w-3xl">
        <h2 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          Earliest wording found:{" "}
          <span className="text-rubric">{day(earliest.firstSeen)}</span>, in{" "}
          <Link
            href={`${readHref(earliest.title, earliest.firstSeen)}#p-${earliest.hash}`}
            className="italic underline decoration-rule decoration-1 underline-offset-4 hover:decoration-rubric"
          >
            {earliest.title}
          </Link>
          , by{" "}
          {!writer.user
            ? "a hidden user"
            : anonymous
              ? `an anonymous editor (${writer.user})`
              : writer.user}
          .
        </h2>

        {figures.length > 0 && !earliest.saysFigures && (
          <p className="mt-3 font-serif text-xl text-ink-soft">
            That wording gives another number.{" "}
            {earliestSaying ? (
              <>
                {figure} is first written on{" "}
                <a
                  href={`${readHref(earliestSaying.title, earliestSaying.firstSeen)}#p-${earliestSaying.hash}`}
                  className="text-rubric underline decoration-rule decoration-1 underline-offset-4"
                >
                  {day(earliestSaying.firstSeen)}
                </a>
                , in {earliestSaying.title}.
              </>
            ) : (
              <>None of the close wordings found has {figure} in it.</>
            )}
          </p>
        )}

        <p className="mt-4 text-ink-soft">
          {traces.length === tracing.limit
            ? `The ${tracing.limit} closest wordings`
            : plural(traces.length, "wording", "wordings")}{" "}
          in {plural(groups.length, "article", "articles")}{" "}
          {traces.length === 1 ? "says" : "say"} something close to this.{" "}
          <b className="font-medium text-added">
            {standing === 0
              ? "None still stands"
              : standing === 1
                ? "1 still stands"
                : `${standing} still stand`}
          </b>{" "}
          on {day(null)}, the latest in the dataset
          {gone > 0 && (
            <>
              ; <b className="font-medium text-ink">{gone}</b>{" "}
              {gone === 1 ? "was" : "were"} removed or rewritten
            </>
          )}
          .
        </p>

        <p className="mt-2 text-xs text-ink-faint">
          What each wording says, when it stood and who saved it is what MariaDB
          returned. That it means what you wrote is our reading: a cosine
          distance of {tracing.farthest} or less, shown on every card.
          {tracing.subject &&
            ` Passages are stored under their article's title, so the claim was asked as one about ${tracing.subject}, the article of the nearest wording.`}{" "}
          “Earliest” is the oldest of the wordings within {tracing.near} of the
          closest one before limiting displayed results. {tracing.coverage.matched} matching histories were considered; {tracing.coverage.shown} are shown. An older one may be missing: {COVERAGE}
          {traces.length === tracing.limit &&
            `, and only the ${tracing.limit} closest are shown, so a gap in the chart is not proof the claim was absent`}
          .
        </p>
      </div>

      <div className="mt-10">
        <Timeline
          groups={groups}
          earliest={`${earliest.pageId}-${earliest.hash}`}
          lit={lit}
          onLight={setLit}
        />
      </div>

      <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-10">
        {groups.map((group) => (
          <section key={group.pageId} className="flex flex-col gap-3">
            <header className="border-b border-rule pb-2">
              <p className="text-xs tracking-wide text-ink-faint uppercase">
                {plural(group.placed.length, "wording", "wordings")} in
              </p>
              <h3 className="font-serif text-2xl">{group.title}</h3>
            </header>

            {group.linked && (
              <p className="text-xs text-ink-faint">
                Oldest first. A dotted “rewording of” joins wordings we take for
                one paragraph being rewritten: our reading of the edits, not
                evidence.
              </p>
            )}

            <ol className="flex flex-col gap-3">
              {group.placed.map((placed) => (
                <WordingCard
                  key={placed.key}
                  placed={placed}
                  lit={lit === placed.key}
                  onLight={setLit}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-3">
        <p className="text-sm text-ink-soft">
          What the database did: the vector index named the nearest wordings
          from all of history, living or long removed, and{" "}
          <code className="font-mono text-[12px] text-rubric">
            FOR SYSTEM_TIME ALL
          </code>{" "}
          on the versioned passage table returned every stretch of time each one
          stood.{" "}
          {terms.foreign
            ? "The claim is not in Finnish, so only meaning was compared and keyword search was skipped."
            : terms.rare.length > 0 &&
              `Full-text matches on the stems ${terms.rare.join(", ")} only moved close wordings up the list.`}
        </p>

        <SqlDrawer sql={tracing.sql} title="SQL behind this trace" />
      </div>
    </>
  );
}

/**
 * The trace page: one claim, and every wording in the edit history that
 * means the same. The claim lives in the address, so a trace can be sent
 * to someone.
 */
export function TraceClaim() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const claim = params.get("claim")?.trim() ?? "";

  const [draft, setDraft] = useState(claim);

  const traced = useTrace(claim);

  const go = (next: string) => {
    const query = new URLSearchParams();
    if (next) query.set("claim", next);

    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };

  const pick = (example: string) => {
    setDraft(example);
    go(example);
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-12 pb-24">
      <section className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          <em className="text-rubric">When</em> did Wikipedia start saying this?
        </h1>

        <p className="mt-3 max-w-2xl text-ink-soft">
          Paste a claim in any language. The wordings closest to it in meaning
          are looked up across the whole edit history of Finnish
          Wikipedia&apos;s articles on the history of Finland: when each
          appeared, how long it stood, who wrote it and whether it is still
          there.
        </p>

        <form
          className="mt-7 flex items-start gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            go(draft.replace(/\s+/g, " ").trim());
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends the claim, as in a one-line field. A claim is one
              // sentence, so there is no line to break.
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            placeholder="Paste something Wikipedia says, or used to say…"
            aria-label="The claim to trace"
            className="field-sizing-content min-h-12 min-w-0 flex-1 resize-none rounded border border-rule bg-paper-raised px-4 py-[9px] font-serif text-lg outline-none placeholder:text-ink-faint focus:border-ink-soft"
          />
          <button
            type="submit"
            className="h-12 rounded bg-ink px-5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
          >
            Trace
          </button>
        </form>

        <ImageClaim onExtract={setDraft} />

        {!claim && (
          <div className="mt-10">
            <p className="mb-2 text-xs tracking-wide text-ink-faint uppercase">
              Try
            </p>
            <Examples onPick={pick} />
          </div>
        )}
      </section>

      {claim && (
        <section key={claim} className="mt-14">
          {traced.status === "tracing" && (
            <>
              <div className="mx-auto max-w-3xl">
                <p className="font-serif text-2xl text-ink-faint">
                  <span className="writing">
                    Searching every wording that has a vector
                  </span>
                </p>
                <p className="mt-2 text-sm text-ink-faint">
                  All of the edit history is searched at once, living and long
                  removed, not one date. On a busy laptop that takes a few
                  seconds.
                </p>
              </div>

              {/* The line of time waits empty, so the wait shows what is coming. */}
              <div className="mt-10">
                <Timeline
                  groups={[]}
                  earliest={null}
                  lit={null}
                  onLight={() => {}}
                />
              </div>
            </>
          )}

          {traced.status === "error" && (
            <p className="mx-auto max-w-3xl rounded border border-removed bg-removed-wash p-3 text-sm text-removed">
              {traced.error}
            </p>
          )}

          {traced.status === "done" && traced.tracing.traces.length === 0 && (
            <div className="rise mx-auto flex max-w-3xl flex-col gap-3">
              <p className="font-serif text-2xl text-ink-soft">
                Nothing close to this among the paragraphs embedded so far.
              </p>
              <p className="text-sm text-ink-soft">
                That is not proof Wikipedia never said it. Only part of the edit
                history has been given a vector yet ({COVERAGE}), and a
                background job is still adding the rest, so a wording that did
                stand can be missing here. The 300 nearest wordings the vector
                index returned held none within cosine distance{" "}
                {traced.tracing.farthest} of your claim.
              </p>

              <div className="mt-4 mb-6">
                <p className="mb-2 text-xs tracking-wide text-ink-faint uppercase">
                  Try instead
                </p>
                <Examples onPick={pick} />
              </div>

              <SqlDrawer
                sql={traced.tracing.sql}
                title="SQL behind this trace"
              />
            </div>
          )}

          {traced.status === "done" && traced.tracing.earliest && (
            <Found
              tracing={traced.tracing}
              earliest={traced.tracing.earliest}
            />
          )}
        </section>
      )}
    </main>
  );
}
