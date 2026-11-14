"use client";

import type { Source, Standing } from "@wtt/package-engine";
import Link from "next/link";

import { SqlDrawer } from "@/components/sql-drawer";
import { day, readHref } from "@/lib/format";

import type { Asked } from "./use-ask";

function Cite({
  n,
  side,
  onHover,
}: {
  n: number;
  side: string;
  onHover: (n: number | null) => void;
}) {
  return (
    <a
      href={`#${side}-source-${n}`}
      onMouseEnter={() => onHover(n)}
      onMouseLeave={() => onHover(null)}
      className="mx-0.5 inline-flex h-[1.15rem] min-w-[1.15rem] -translate-y-0.5 items-center justify-center rounded-sm bg-rubric-wash px-1 font-sans text-[11px] font-medium text-rubric no-underline"
    >
      {n}
    </a>
  );
}

/** What the other date of a comparison is called on this card. */
type Other = { label: string; later: boolean };

function Fate({ standing, other }: { standing: Standing; other: Other }) {
  if (standing.state === "same") {
    return (
      <span className="rounded-sm bg-paper-sunk px-1.5 py-px text-[10px] tracking-wide text-ink-faint uppercase">
        same wording {other.label}
      </span>
    );
  }

  if (standing.state === "reworded") {
    return (
      <span className="rounded-sm bg-rubric-wash px-1.5 py-px text-[10px] tracking-wide text-rubric uppercase">
        worded differently {other.label}
      </span>
    );
  }

  return (
    <span
      className={`rounded-sm px-1.5 py-px text-[10px] tracking-wide uppercase ${
        other.later
          ? "bg-removed-wash text-removed"
          : "bg-added-wash text-added"
      }`}
    >
      {other.later
        ? `this wording is gone ${other.label}`
        : `this wording not yet written ${other.label}`}
    </span>
  );
}

type Word = { text: string; added?: boolean; removed?: boolean };

/**
 * The words always run from this passage to the other one. On the later
 * card that is backwards in time, so what counts as added and removed is
 * swapped, and each pair is turned round to read old word, then new word.
 */
const inTime = (words: Word[], later: boolean): Word[] => {
  if (later) return words;

  const swapped = words.map((word) => ({
    text: word.text,
    added: word.removed,
    removed: word.added,
  }));

  for (let i = 0; i + 1 < swapped.length; i++) {
    if (swapped[i].added && swapped[i + 1].removed) {
      [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
      i++;
    }
  }

  return swapped;
};

function SourceCard({
  source,
  side,
  at,
  lit,
  standing,
  other,
}: {
  source: Source;
  side: string;
  at: string | null;
  lit: boolean;

  /** What became of this passage on the other date of a comparison. */
  standing?: Standing;
  other?: Other;
}) {
  const here = readHref(source.title, at);
  const claim = `${here}${here.includes("?") ? "&" : "?"}claim=${source.hash}`;

  return (
    <li
      id={`${side}-source-${source.n}`}
      className={`rise scroll-mt-6 rounded border bg-paper-raised p-4 transition-colors ${
        lit ? "border-rubric" : "border-rule"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-baseline gap-2 text-sm">
        <span className="flex h-5 min-w-5 items-center justify-center rounded-sm bg-rubric-wash px-1 text-[11px] font-medium text-rubric">
          {source.n}
        </span>
        <Link
          href={`${here}#p-${source.hash}`}
          className="font-medium hover:underline"
        >
          {source.title}
        </Link>
        {standing && other && <Fate standing={standing} other={other} />}
      </div>

      <p className="font-serif text-[15px] leading-relaxed text-ink">
        {source.text}
      </p>

      {standing?.state === "reworded" && standing.words && other && (
        <p className="mt-3 border-l-2 border-rubric pl-3 font-serif text-[14px] leading-relaxed text-ink-soft">
          <span className="mb-1 block font-sans text-[10px] tracking-wide text-ink-faint uppercase">
            {other.later ? "what changed since" : "what changed to get here"}
            <span className="ml-2 normal-case tracking-normal">
              {standing.via === "meaning"
                ? `our reading: the same paragraph, matched by meaning at distance ${standing.distance?.toFixed(2)}`
                : "our reading: the same paragraph, followed through the edits"}
            </span>
          </span>
          {inTime(standing.words, other.later).map((word, index) =>
            word.added ? (
              <ins
                key={index}
                className="bg-added-wash text-added no-underline"
              >
                {word.text}
              </ins>
            ) : word.removed ? (
              <del key={index} className="bg-removed-wash text-removed">
                {word.text}
              </del>
            ) : (
              word.text
            ),
          )}
        </p>
      )}

      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-faint">
        <span>
          wording written {day(source.bornAt)}
          {source.bornBy ? ` by ${source.bornBy}` : ""}
        </span>
        {source.distance !== null && (
          <span
            title="Cosine distance between your question and this passage. 0 is the same meaning. It is our reading, not evidence."
            className="rounded-sm border border-dotted border-ink-faint px-1.5 text-[10px] tracking-wide uppercase"
          >
            distance {source.distance.toFixed(2)}
          </span>
        )}
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-rule hover:text-ink"
        >
          the article that day ↗
        </a>
        <Link href={claim} className="underline decoration-rule hover:text-ink">
          life of this paragraph
        </Link>
      </p>
    </li>
  );
}

/** One answer with the passages it stands on and the SQL that found them. */
export function AnswerCard({
  asked,
  side,
  standing,
  other,
  hovered,
  onHover,
}: {
  asked: Asked;

  /** Which of the two answers this is, so its anchors are its own. */
  side: "then" | "now";

  /** What became of each passage on the other date, by "page:hash". */
  standing?: Record<string, Standing> | null;
  other?: Other;
  hovered: number | null;
  onHover: (n: number | null) => void;
}) {
  const { evidence } = asked;
  const at = evidence?.at ?? null;

  return (
    <article className="flex min-w-0 flex-col gap-5">
      <header className="border-b border-rule pb-2">
        <p className="text-xs tracking-wide text-ink-faint uppercase">
          Wikipedia on
        </p>
        <h2 className="font-serif text-2xl text-rubric">
          {evidence ? day(at) : "…"}
          {evidence && at === null && (
            <span className="ml-2 font-sans text-xs text-ink-faint">
              latest in the dataset
            </span>
          )}
        </h2>
      </header>

      {asked.status === "searching" && (
        <p className="text-sm text-ink-faint">
          Looking for what stood in Wikipedia that day…
        </p>
      )}

      {asked.status === "error" && (
        <p className="rounded border border-removed bg-removed-wash p-3 text-sm text-removed">
          {asked.error}
        </p>
      )}

      {evidence && evidence.sources.length === 0 && (
        <p className="font-serif text-lg text-ink-soft">
          No passage that stood in Wikipedia on {day(at)} comes close to this
          question.
          {evidence.nearest !== null && (
            <span className="mt-2 block font-sans text-xs text-ink-faint">
              Our reading: the nearest passage is at cosine distance{" "}
              {evidence.nearest.toFixed(2)}, and beyond {evidence.tooFar} a
              passage is about something else, so no answer is written from it.
            </span>
          )}
        </p>
      )}

      {evidence && evidence.sources.length > 0 && (
        <div className="font-serif text-[19px] leading-relaxed">
          {asked.status === "done" && asked.sentences.length > 0 ? (
            asked.sentences.map((sentence, index) => (
              <span
                key={index}
                title={
                  sentence.supported
                    ? undefined
                    : sentence.missing.length > 0
                      ? `Not in the passage this sentence cites: ${sentence.missing.join(", ")}`
                      : "The model gave no valid passage for this sentence."
                }
                className={
                  sentence.supported
                    ? ""
                    : "text-ink-faint underline decoration-dotted decoration-1"
                }
              >
                {sentence.text}
                {[...new Set(sentence.cites)].map((cite) => (
                  <Cite key={cite} n={cite} side={side} onHover={onHover} />
                ))}{" "}
              </span>
            ))
          ) : (
            <span className={asked.status === "writing" ? "writing" : ""}>
              {asked.answer}
            </span>
          )}
        </div>
      )}

      {asked.status === "done" &&
        asked.model &&
        evidence &&
        evidence.sources.length > 0 && (
          <p className="-mt-2 text-xs text-ink-faint">
            Written by {asked.model} from the {evidence.sources.length} passages
            below in {(asked.answerMs / 1000).toFixed(1)} s. Passages found in{" "}
            {asked.evidenceMs} ms. The numbers are checked against the passage
            each sentence cites. The wording is the model&apos;s
            {asked.sentences.some((sentence) => !sentence.supported) &&
              ". Dotted sentences cite no passage, or state a number that is not in the passage they cite, and should not be trusted"}
            .
          </p>
        )}

      {evidence && (
        <SqlDrawer sql={evidence.sql} title="SQL behind these passages" />
      )}

      {evidence && evidence.sources.length > 0 && (
        <ol className="flex flex-col gap-3">
          {evidence.sources.map((source) => (
            <SourceCard
              key={`${source.pageId}-${source.hash}`}
              source={source}
              side={side}
              at={at}
              lit={hovered === source.n}
              standing={standing?.[`${source.pageId}:${source.hash}`]}
              other={other}
            />
          ))}
        </ol>
      )}
    </article>
  );
}
