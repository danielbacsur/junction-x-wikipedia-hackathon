"use client";

import type { ArticleSearch, Featured } from "@wtt/package-engine";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SqlDrawer } from "@/components/sql-drawer";
import { day, number, readHref } from "@/lib/format";
import { useJson } from "@/lib/use-json";

/**
 * The way in to reading: search every article, or open one of those with
 * the longest histories. Search covers all 568,416 Finnish articles by
 * keyword, and the history of finland set in three languages by meaning.
 */
export function Library() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const question = params.get("q") ?? "";
  const [draft, setDraft] = useState(question);

  const found = useJson<ArticleSearch>(
    question
      ? `/api/search?q=${encodeURIComponent(question)}&everything=1`
      : null,
  );
  const featured = useJson<{ articles: Featured[] }>("/api/featured");

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-12 pb-24">
      <section className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          Read any article <em className="text-rubric">on any day</em>.
        </h1>
        <p className="mt-3 text-ink-soft">
          Every saved version of 19,742 Finnish Wikipedia articles on the
          history of Finland, from 2003 to 1 October 2026. Open one, pick a
          date, and see who wrote each paragraph and when.
        </p>

        <form
          className="mt-7 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            router.replace(
              draft.trim()
                ? `${pathname}?q=${encodeURIComponent(draft.trim())}`
                : pathname,
              { scroll: false },
            );
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Find an article: Talvisota, Kekkonen, peace treaty…"
            aria-label="Find an article"
            className="h-12 min-w-0 flex-1 rounded border border-rule bg-paper-raised px-4 font-serif text-lg outline-none placeholder:text-ink-faint focus:border-ink-soft"
          />
          <button
            type="submit"
            className="h-12 rounded bg-ink px-5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
          >
            Find
          </button>
        </form>
      </section>

      {question && (
        <section className="mx-auto mt-10 max-w-3xl">
          {found.loading && (
            <p className="text-sm text-ink-faint">Searching…</p>
          )}
          {found.error && <p className="text-sm text-removed">{found.error}</p>}

          {found.data && found.data.hits.length === 0 && (
            <p className="font-serif text-lg text-ink-soft">
              Nothing found for that.
            </p>
          )}

          <ol className="flex flex-col gap-2">
            {found.data?.hits.map((hit) => {
              const hasHistory = hit.lang === "fi" && hit.history;

              return (
                <li
                  key={`${hit.lang}-${hit.pageId}`}
                  className="rounded border border-rule bg-paper-raised p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[11px] text-ink-faint uppercase">
                      {hit.lang}
                    </span>
                    {hasHistory ? (
                      <Link
                        href={readHref(hit.title)}
                        className="font-serif text-xl hover:text-rubric"
                      >
                        {hit.title}
                      </Link>
                    ) : (
                      <a
                        href={hit.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-serif text-xl hover:text-rubric"
                      >
                        {hit.title} ↗
                      </a>
                    )}
                    {!hasHistory && (
                      <span className="rounded-sm bg-paper-sunk px-1.5 py-px text-[10px] tracking-wide text-ink-faint uppercase">
                        current text only
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-ink-faint tabular-nums">
                      {hit.vectorRank ? `meaning #${hit.vectorRank}` : ""}
                      {hit.vectorRank && hit.keywordRank ? " · " : ""}
                      {hit.keywordRank ? `keyword #${hit.keywordRank}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 font-serif text-[15px] text-ink-soft">
                    {hit.snippet}
                  </p>
                  {hit.also.length > 0 && (
                    <p className="mt-1 text-xs text-ink-faint">
                      Same topic:{" "}
                      {hit.also
                        .map((other) => `${other.title} (${other.lang})`)
                        .join(", ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>

          {found.data && (
            <div className="mt-4">
              <SqlDrawer sql={found.data.sql} title="SQL behind this search" />
            </div>
          )}
        </section>
      )}

      <section className="mt-14">
        <h2 className="mb-3 text-xs tracking-wide text-ink-faint uppercase">
          The longest histories
        </h2>
        <ul className="grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {featured.data?.articles.map((article) => (
            <li key={article.pageId} className="bg-paper-raised">
              <Link
                href={readHref(article.title)}
                className="block p-4 transition-colors hover:bg-paper-sunk"
              >
                <span className="font-serif text-xl">{article.title}</span>
                <span className="mt-1 block text-xs text-ink-faint tabular-nums">
                  {number(article.edits)} versions · {number(article.editors)}{" "}
                  editors · {number(article.reverts)} reverts · since{" "}
                  {day(article.firstEdit)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
