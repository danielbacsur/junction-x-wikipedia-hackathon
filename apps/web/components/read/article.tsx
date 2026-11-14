"use client";

import type {
  ArticleView,
  Comparison,
  Timeline as Life,
} from "@wtt/package-engine";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useState } from "react";

import { SqlDrawer } from "@/components/sql-drawer";
import { LAST_YEAR, LATEST, day, minute, number } from "@/lib/format";
import { useJson } from "@/lib/use-json";

import { Biography } from "./biography";
import { Changes } from "./changes";
import { Reader } from "./reader";
import { Timeline } from "./timeline";

/** An edit's moment as the address carries it, to the microsecond. */
const stamp = (at: string) => at.replace(" ", "T");

const yearsBefore = (date: string, years: number) =>
  `${Number(date.slice(0, 4)) - years}${date.slice(4, 10)}`;

/**
 * One article through time. The date in the address decides which version
 * is on screen, a second date turns on the comparison, and a paragraph's
 * hash opens its life, so every view of the page can be linked to.
 */
export function Article() {
  const { title } = useParams<{ title: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const name = decodeURIComponent(title).replaceAll("_", " ");
  const date = params.get("date");
  const from = params.get("from");
  const claim = params.get("claim");

  const base = `/api/article/${encodeURIComponent(name)}`;
  const article = useJson<ArticleView>(`${base}${date ? `?date=${date}` : ""}`);
  const life = useJson<Life>(`${base}/timeline`);
  const comparison = useJson<Comparison>(
    from ? `${base}/compare?from=${from}${date ? `&to=${date}` : ""}` : null,
  );

  const [playing, setPlaying] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);

  const go = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  // Replaying walks from the article's first year to the latest, a year a
  // step, and marks whatever was written since the step before.
  const firstYear = life.data ? Number(life.data.firstEdit.slice(0, 4)) : null;
  const year = date ? Number(date.slice(0, 4)) : LAST_YEAR;

  useEffect(() => {
    if (!playing) return;

    const timer = setTimeout(() => {
      if (year >= LAST_YEAR) {
        setPlaying(false);
        return;
      }

      setFresh(`${year}-12-31 23:59:59`);
      go({ date: year + 1 >= LAST_YEAR ? null : `${year + 1}-12-31` });
    }, 1_400);

    return () => clearTimeout(timer);
    // The step depends only on where the replay stands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, year]);

  const view = article.data;
  const at = view?.at ?? null;
  const ready = view?.revId;

  // A link to a paragraph's life should land on the paragraph.
  useEffect(() => {
    if (claim && ready) {
      document
        .getElementById(`p-${claim}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [claim, ready]);
  const shown = (at ?? LATEST).slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 pb-24">
      <header className="mb-6">
        <p className="text-xs tracking-wide text-ink-faint uppercase">
          Finnish Wikipedia, as it stood on
        </p>
        <div className="flex flex-wrap items-baseline gap-x-4">
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
            {view?.title ?? name}
          </h1>
          <span className="font-serif text-2xl text-rubric tabular-nums">
            {view ? day(at) : "…"}
          </span>
        </div>

        {view?.exists && (
          <p className="mt-2 text-sm text-ink-soft">
            The version a reader saw that day was saved by{" "}
            <b className="font-medium text-ink">
              {view.savedBy ?? "a hidden user"}
            </b>{" "}
            on {minute(view.savedAt)}
            {view.comment ? (
              <span className="text-ink-faint">
                {" "}
                “{view.comment.slice(0, 100)}”
              </span>
            ) : null}
            .{" "}
            <a
              href={view.url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-rule hover:text-rubric"
            >
              See it on Wikipedia ↗
            </a>
            {life.data && (
              <span className="text-ink-faint">
                {" "}
                · version {number(view.seq)} of {number(life.data.edits)}, by{" "}
                {number(life.data.editors)} editors since{" "}
                {day(life.data.firstEdit)}
              </span>
            )}
          </p>
        )}
      </header>

      {life.data && (
        <Timeline
          life={life.data}
          at={at}
          onPick={(picked) => {
            setPlaying(false);
            setFresh(null);
            go({ date: picked });
          }}
        />
      )}

      <div className="mt-4 mb-8 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2 rounded border border-rule bg-paper-raised px-3 py-1.5">
          <span className="text-xs text-ink-faint">Date</span>
          <input
            type="date"
            value={shown}
            min="2003-02-21"
            max="2026-10-01"
            onChange={(event) => {
              setFresh(null);
              go({ date: event.target.value || null });
            }}
            className="bg-transparent text-ink outline-none"
          />
        </label>

        <div className="flex overflow-hidden rounded border border-rule">
          <button
            type="button"
            disabled={article.loading || !view?.previousAt}
            onClick={() => {
              setFresh(null);
              go({ date: stamp(view!.previousAt!) });
            }}
            className="px-3 py-1.5 text-ink-soft hover:text-ink disabled:opacity-40"
          >
            ◂ Previous edit
          </button>
          <button
            type="button"
            disabled={article.loading || !view?.nextAt}
            onClick={() => {
              // What the next edit wrote is marked as newly arrived.
              setFresh(view!.savedAt || null);
              go({ date: stamp(view!.nextAt!) });
            }}
            className="border-l border-rule px-3 py-1.5 text-ink-soft hover:text-ink disabled:opacity-40"
          >
            Next edit ▸
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setFresh(null);
            go({ date: null });
          }}
          className="rounded border border-rule px-3 py-1.5 text-ink-soft hover:text-ink"
        >
          Latest
        </button>

        <button
          type="button"
          onClick={() => {
            if (playing) {
              setPlaying(false);
              return;
            }

            setFresh(null);
            go({ date: `${firstYear ?? 2003}-12-31`, from: null });
            setPlaying(true);
          }}
          className="rounded border border-rule px-3 py-1.5 text-ink-soft hover:text-ink"
        >
          {playing ? "■ Stop" : "▶ Replay its history"}
        </button>

        <span className="mx-1 h-5 w-px bg-rule" />

        <span className="text-xs text-ink-faint">Compare with</span>
        {[1, 5, 10].map((years) => (
          <button
            key={years}
            type="button"
            onClick={() => go({ from: yearsBefore(shown, years) })}
            className={`rounded border px-3 py-1.5 ${
              from === yearsBefore(shown, years)
                ? "border-rubric text-rubric"
                : "border-rule text-ink-soft hover:text-ink"
            }`}
          >
            {years === 1 ? "a year" : `${years} years`} earlier
          </button>
        ))}
        {from && (
          <button
            type="button"
            onClick={() => go({ from: null })}
            className="px-2 py-1.5 text-xs text-ink-faint underline decoration-rule hover:text-ink"
          >
            stop comparing
          </button>
        )}
      </div>

      {article.error && (
        <p className="rounded border border-removed bg-removed-wash p-4 text-sm text-removed">
          {article.error === "not found"
            ? `There is no article called “${name}” among the 19,742 whose history is loaded.`
            : article.error}
        </p>
      )}

      {view && !view.exists && (
        <p className="rounded border border-rule bg-paper-sunk p-5 font-serif text-lg">
          This article did not exist yet on {day(at)}. Its first version was
          saved on{" "}
          <button
            type="button"
            onClick={() => go({ date: view.firstEdit.slice(0, 10) })}
            className="text-rubric underline"
          >
            {day(view.firstEdit)}
          </button>
          .
        </p>
      )}

      <div
        className={`grid gap-10 ${claim ? "lg:grid-cols-[minmax(0,1fr)_26rem]" : ""}`}
      >
        <div className={`min-w-0 ${claim ? "" : "mx-auto w-full max-w-3xl"}`}>
          {from && comparison.data ? (
            <Changes
              comparison={comparison.data}
              onSelect={(hash) => go({ claim: hash })}
            />
          ) : from && comparison.error ? (
            <p className="text-sm text-removed">{comparison.error}</p>
          ) : (
            view?.exists && (
              <>
                <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-faint">
                  <span>
                    The mark beside a paragraph is the age of its wording that
                    day:
                  </span>
                  <span>
                    <i className="mr-1 inline-block h-3 w-[3px] rounded-full bg-rubric align-middle" />
                    under a month
                  </span>
                  <span>
                    <i className="mr-1 inline-block h-3 w-[3px] rounded-full bg-gold align-middle" />
                    under a year
                  </span>
                  <span>
                    <i className="mr-1 inline-block h-3 w-[3px] rounded-full bg-ink-faint align-middle" />
                    under four years
                  </span>
                  <span>
                    <i className="mr-1 inline-block h-3 w-[3px] rounded-full bg-rule align-middle" />
                    older
                  </span>
                </p>

                <Reader
                  article={view}
                  selected={claim}
                  fresh={fresh}
                  onSelect={(hash) => go({ claim: hash })}
                />
              </>
            )
          )}

          <div className="mt-10 flex flex-col gap-3">
            {view && <SqlDrawer sql={view.sql} title="SQL behind this page" />}
            {life.data && (
              <SqlDrawer sql={life.data.sql} title="SQL behind the timeline" />
            )}
          </div>
        </div>

        {claim && (
          <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
            <Biography
              key={claim}
              title={name}
              hash={claim}
              onClose={() => go({ claim: null })}
              onSelect={(hash) => go({ claim: hash })}
            />
          </div>
        )}
      </div>
    </main>
  );
}
