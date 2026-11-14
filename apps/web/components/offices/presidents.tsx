"use client";

import type {
  Holding,
  Shown,
  StatedTerm,
  TermChange,
  TermGap,
  TermOverlap,
} from "@wtt/package-engine";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Sql } from "@/components/sql";
import { SqlDrawer } from "@/components/sql-drawer";
import { LATEST, day as written, minute, number } from "@/lib/format";
import { useJson } from "@/lib/use-json";

import { Changes } from "./changes";
import { Conflicts } from "./conflicts";
import { DayDial } from "./dials";
import { TermsChart, stated } from "./terms-chart";
import {
  FIRST_DAY,
  FIRST_SAID,
  LAST_DAY,
  endOf,
  holderSql,
  holdingOn,
  readDay,
  readMoment,
  standingAt,
  writeMoment,
} from "./time";

type Dials = { day: string; at: string | null };

/** The cases worth jumping to: one day, asked of different Wikipedias. */
const PRESETS: {
  day: string;
  about: string;
  asOf: [string, string | null][];
}[] = [
  {
    day: "1925-03-01",
    about: "the handover two editors moved three times",
    asOf: [
      ["end of 2006", "2006-12-31 23:59:59"],
      ["end of 2008", "2008-12-31 23:59:59"],
      ["end of 2012", "2012-12-31 23:59:59"],
      ["latest", null],
    ],
  },
  {
    day: "1944-08-02",
    about: "a day that lost its president",
    asOf: [
      ["8 Aug 2011", "2011-08-08 23:59:59"],
      ["9 Aug 2011", "2011-08-09 23:59:59"],
    ],
  },
  {
    day: "1981-12-01",
    about: "a president on sick leave",
    asOf: [
      ["end of 2016", "2016-12-31 23:59:59"],
      ["latest", null],
    ],
  },
];

/** A moment of Wikipedia in words. Year ends and days need no clock time. */
const moment = (at: string | null) =>
  at === null
    ? written(LATEST)
    : at.endsWith("23:59:59")
      ? written(at)
      : minute(at);

function Holder({ term, at }: { term: StatedTerm; at: string | null }) {
  return (
    <div className="rise">
      <h2 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
        {term.person}
      </h2>
      {term.acting && (
        <span className="mt-2 inline-block rounded-sm bg-paper-sunk px-1.5 py-px text-[10px] tracking-wide text-ink-soft uppercase">
          acting, while the president was on sick leave
        </span>
      )}

      <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-ink-faint">Stated term</dt>
        <dd className="tabular-nums">{stated(term)}</dd>

        <dt className="text-ink-faint">Wikipedia said so</dt>
        <dd className="tabular-nums">
          from <span className="text-rubric">{written(term.saidSince)}</span>
          {term.saidUntil ? (
            <>
              {" "}
              to <span className="text-rubric">{written(term.saidUntil)}</span>
            </>
          ) : (
            `, and still does on ${written(LATEST)}`
          )}
          <span className="text-ink-faint">
            {" "}
            · repeated by {number(term.versions)}{" "}
            {term.versions === 1 ? "version" : "versions"}
          </span>
        </dd>

        <dt className="text-ink-faint">First said by</dt>
        <dd>
          {term.editor ?? "a hidden editor"} in{" "}
          <a
            href={term.url}
            className="font-mono text-[13px] underline decoration-rule hover:decoration-rubric"
          >
            {term.revId}
          </a>
          {term.comment && (
            <span className="font-serif text-ink-soft"> “{term.comment}”</span>
          )}
        </dd>

        <dt className="text-ink-faint">As written</dt>
        <dd className="line-clamp-2 font-mono text-[12px] leading-relaxed break-all text-ink-soft">
          {term.sourceText}
        </dd>
      </dl>

      {at !== null && term.saidUntil === null && (
        <p className="mt-2 text-xs text-ink-faint">
          The statement has not changed since.
        </p>
      )}
    </div>
  );
}

/** What the terms on either side say when no stated term covers the day. */
function Nobody({
  standing,
  day,
  at,
}: {
  standing: StatedTerm[];
  day: string;
  at: string | null;
}) {
  const own = standing.filter((term) => !term.acting);
  const before = own
    .filter((term) => term.to !== null && term.to <= day)
    .sort((a, b) => b.to!.localeCompare(a.to!))[0];
  const after = own
    .filter((term) => term.from > day)
    .sort((a, b) => a.from.localeCompare(b.from))[0];

  return (
    <div className="rise">
      <p className="font-serif text-4xl leading-tight tracking-tight text-ink-faint sm:text-5xl">
        Nobody.
      </p>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
        {standing.length === 0
          ? at !== null && at < FIRST_SAID
            ? `No infobox stated a term of office before ${written(FIRST_SAID)}.`
            : "No article stated a term we could read at that moment."
          : "No article stated a term that covers this day."}{" "}
        {before && (
          <>
            {before.person}’s article ended the term on{" "}
            <span className="tabular-nums">{written(before.to!)}</span>
            {after ? ", and " : "."}
          </>
        )}
        {after && (
          <>
            {after.person}’s {before ? "" : "article "}started it on{" "}
            <span className="tabular-nums">{written(after.from)}</span>.
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Two timelines. One dial is a day of history and the other a day of
 * Wikipedia, and the answer is who held the presidency on the first
 * according to the second. Every statement ever made is 59 rows, so they
 * are fetched once and each move of a dial is answered here; MariaDB is
 * asked the same question whenever a dial comes to rest, to show its work.
 */
export function Presidents() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const settled: Dials = {
    day: readDay(params.get("day")) ?? "1925-03-01",
    at: readMoment(params.get("date")),
  };

  const [dials, setDials] = useState(settled);
  const { day, at } = dials;

  // The address carries both dials, so any answer can be sent to someone.
  const go = (next: Dials) => {
    const query = new URLSearchParams({ day: next.day });
    if (next.at) query.set("date", writeMoment(next.at));

    setDials(next);
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };

  const history = useJson<{ terms: StatedTerm[]; sql: Shown[] }>(
    "/api/offices?history=1",
  );
  const changes = useJson<{ changes: TermChange[]; sql: Shown[] }>(
    "/api/offices?changes=1",
  );
  const conflicts = useJson<{
    gaps: TermGap[];
    overlaps: TermOverlap[];
    sql: Shown[];
  }>("/api/offices?conflicts=1");

  const asked = useJson<Holding>(
    `/api/offices?day=${settled.day}${
      settled.at ? `&date=${encodeURIComponent(settled.at)}` : ""
    }`,
  );

  const terms = history.data?.terms ?? [];
  const standing = standingAt(terms, at);
  const holders = holdingOn(standing, day);

  // MariaDB's answer belongs under the statement only while the dials rest
  // where it was asked.
  const ran =
    asked.data && settled.day === day && settled.at === at && !asked.loading
      ? asked.data
      : null;
  const agrees =
    ran !== null &&
    ran.holders.map((term) => term.revId).join() ===
      holders.map((term) => term.revId).join();

  const list = changes.data?.changes ?? [];
  const count = (test: (change: TermChange) => boolean) =>
    list.filter(test).length;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-12 pb-24">
      <section className="max-w-4xl">
        <p className="text-xs tracking-wide text-ink-faint uppercase">
          Two timelines
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl">
          Who was president on{" "}
          <span className="whitespace-nowrap">{written(day)}</span>, according
          to Wikipedia as it stood on{" "}
          <em className="whitespace-nowrap text-rubric">{moment(at)}</em>?
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink-soft">
          History has two timelines: when something was true, and when Wikipedia
          said so. MariaDB has both built in. One table of 102 rows, read from
          17,845 saved versions of the thirteen presidents’ infoboxes, keeps the
          stated term as an application-time period and the stretch Wikipedia
          stated it as system time, so one statement can ask about a day in 1925
          and a day in 2008 at once.
        </p>
      </section>

      <section className="mt-9 rounded border border-rule bg-paper-raised">
        <div className="grid gap-x-10 gap-y-7 p-5 lg:grid-cols-2">
          <DayDial
            ink
            label="The day in history"
            hint="valid time: when the term was"
            value={day}
            first={FIRST_DAY}
            last={LAST_DAY}
            marks={[1920, 1940, 1960, 1980, 2000, 2020]}
            onChange={(next) => setDials({ day: next, at })}
            onCommit={(next) => go({ day: next, at })}
          />
          <DayDial
            label="Wikipedia as it stood on"
            hint={
              at === null
                ? "system time: the latest in the dataset"
                : "system time: when Wikipedia said so"
            }
            value={at?.slice(0, 10) ?? LAST_DAY}
            first={FIRST_SAID}
            last={LAST_DAY}
            marks={[2008, 2012, 2016, 2020, 2024]}
            onChange={(next) => setDials({ day, at: endOf(next) })}
            onCommit={(next) => go({ day, at: endOf(next) })}
          />
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-rule px-5 py-3">
          {PRESETS.map((preset) => (
            <div
              key={preset.day}
              className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs"
            >
              <span className="text-ink-soft">
                <span className="font-medium tabular-nums">
                  {written(preset.day)}
                </span>
                <span className="text-ink-faint">, {preset.about}:</span>
              </span>
              {preset.asOf.map(([label, when]) => {
                const here = day === preset.day && at === when;

                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={here}
                    onClick={() => go({ day: preset.day, at: when })}
                    className={`rounded border px-2 py-1 tabular-nums transition-colors ${
                      here
                        ? "border-rubric bg-rubric-wash text-rubric"
                        : "border-rule text-ink-soft hover:bg-paper-sunk"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)]">
        <div
          aria-live="polite"
          className="rounded border border-rule bg-paper-raised p-5"
        >
          {history.error ? (
            <p className="text-sm text-removed">{history.error}</p>
          ) : !history.data ? (
            <p className="text-sm text-ink-faint">Reading the table…</p>
          ) : holders.length === 0 ? (
            <Nobody standing={standing} day={day} at={at} />
          ) : (
            <div className="flex flex-col gap-7">
              {holders.length > 1 && (
                <p className="text-xs tracking-wide text-ink-faint uppercase">
                  {holders.filter((term) => !term.acting).length > 1
                    ? "Two articles claimed this day at that moment"
                    : "Two statements cover this day"}
                </p>
              )}
              {holders.map((term) => (
                <Holder
                  key={`${term.pageId}:${term.office}:${term.from}:${term.saidSince}`}
                  term={term}
                  at={at}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col rounded border border-rule bg-paper-raised">
          <p className="border-b border-rule px-4 py-2.5 text-xs tracking-wide text-ink-faint uppercase">
            The statement that answers it
          </p>
          <div className="px-4 py-3">
            <Sql text={holderSql(day, at)} />
          </div>
          <ul className="mt-auto border-t border-rule px-4 py-2.5 text-xs leading-relaxed text-ink-faint">
            <li>
              <span className="font-medium text-rubric">System time</span>{" "}
              {at === null
                ? "has no clause here: a plain SELECT reads what is stated now."
                : "is the FOR SYSTEM_TIME clause: which Wikipedia is asked."}
            </li>
            <li>
              <span className="font-medium text-ink">Valid time</span> is the
              last line: MariaDB has no AS OF for an application-time period, so
              it is two comparisons.
            </li>
            <li className="mt-1.5 tabular-nums">
              {ran ? (
                <>
                  MariaDB answered in {ran.sql[0].ms} ms with{" "}
                  {ran.holders.length}{" "}
                  {ran.holders.length === 1 ? "row" : "rows"}
                  {history.data &&
                    (agrees
                      ? ", the same as shown here."
                      : ", which differs from the answer shown here.")}
                </>
              ) : (
                asked.error ||
                "The answer beside this is computed in the browser. MariaDB is asked when the dials rest."
              )}
            </li>
          </ul>
        </div>
      </section>

      <div className="mt-4">
        <SqlDrawer sql={asked.data?.sql ?? []} title="As it ran" />
      </div>

      <section className="mt-14">
        <h2 className="max-w-3xl font-serif text-3xl leading-tight tracking-tight">
          The whole list, as that Wikipedia stated it
        </h2>
        <p className="mt-2 max-w-3xl text-ink-soft">
          The second dial also picks the list below: every president’s article
          with the term its infobox stated at that moment. Move it back to see
          handover days change.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          {history.data && (
            <TermsChart
              terms={terms}
              day={day}
              at={at}
              onPick={(next) => go({ day: next, at })}
            />
          )}
          <SqlDrawer sql={history.data?.sql ?? []} title="All rows" />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="max-w-3xl font-serif text-3xl leading-tight tracking-tight">
          Wikipedia changed a stated date {list.length || 45} times
        </h2>
        <p className="mt-2 max-w-3xl text-ink-soft">
          A change is one statement ending at the instant another about the same
          days begins in the same article.{" "}
          {list.length > 0 && (
            <>
              {count((change) => change.verdict === "to today's value")} moved
              to the value stated today,{" "}
              {count((change) => change.verdict === "away from today's value")}{" "}
              away from it and {count((change) => change.verdict === "between")}{" "}
              between two values Wikipedia no longer states.{" "}
              {count((change) => change.editorKind === "ip")} were made without
              logging in and {count((change) => !change.comment)} gave no
              reason. None is vandalism: those versions were reverted within
              thirty days and never reached the table.
            </>
          )}
        </p>
        <div className="mt-5 flex flex-col gap-4">
          {changes.error && (
            <p className="text-sm text-removed">{changes.error}</p>
          )}
          {list.length > 0 && (
            <Changes
              changes={list}
              onShow={(on, when) => go({ day: on, at: when })}
            />
          )}
          <SqlDrawer sql={changes.data?.sql ?? []} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="max-w-3xl font-serif text-3xl leading-tight tracking-tight">
          Ten days without a president, and two presidents ten times
        </h2>
        <p className="mt-2 max-w-3xl text-ink-soft">
          Each article states its own president’s term, and nothing makes them
          agree. Since 9 August 2011 Ryti’s ends three days before Mannerheim’s
          begins and Mannerheim’s seven days before Paasikivi’s: one editor, one
          evening, citing a book from 1965. A key across articles would have
          refused the ten moments on the right, each an editor between one
          article and the next, so the table keeps them and a query finds them.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          {conflicts.error && (
            <p className="text-sm text-removed">{conflicts.error}</p>
          )}
          {conflicts.data && (
            <Conflicts
              gaps={conflicts.data.gaps}
              overlaps={conflicts.data.overlaps}
              onShow={(on, when) => go({ day: on, at: when })}
            />
          )}
          <SqlDrawer sql={conflicts.data?.sql ?? []} />
        </div>
      </section>

      <p className="mt-14 max-w-3xl text-xs leading-relaxed text-ink-faint">
        What this does not show. The terms are read from infoboxes only, which
        first stated one on {written(FIRST_SAID)}; the prose and the list
        articles are not parsed. A version counts as what Wikipedia said unless
        a standing revert removed it within thirty days. The parser is
        deterministic and refuses what it cannot read: 111 of 25,832 stated
        terms, kept with their reasons in a second table. The latest version is{" "}
        {written(LATEST)}, not live Wikipedia. Method and measurements:
        labs/bitemporal-offices.
      </p>
    </main>
  );
}
