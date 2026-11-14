import Link from "next/link";

import { day, number } from "@/lib/format";

import {
  ann,
  article,
  clusters,
  corpus,
  exposure,
  journeys,
  names,
  offices,
  peakOf,
  reading,
  readings,
  snapshots,
  sourcing,
  survival,
  swaps,
  temporary,
  whiteNameStrings,
  words,
} from "./data";
import { Clusters, Exposure as ExposureChart } from "./exposure";
import { duration, fullDay, percent } from "./format";
import { Journeys as JourneysChart, Transfers } from "./journeys";
import { MainArticle } from "./main-article";
import { NameSwaps } from "./name-swaps";
import { Offices as OfficesChart } from "./offices";
import * as queries from "./queries";
import {
  CANDIDATE_OVERLAP,
  EXACT_GLOBAL_1000,
  JOURNEY,
  ONE_ACCOUNT_2008,
  ONE_BOOK_1975,
  PLAN_AT_1000,
  REWRITE,
  WORDING_AT_LEAST,
} from "./quoted";
import { Search as SearchChart, Shapes } from "./search";
import { N, Section } from "./section";
import { Audit, Sourcing } from "./sources";
import { Oldest, Survival as SurvivalChart } from "./survival";
import { Temporary as TemporaryChart } from "./temporary";
import { WarNames } from "./war-names";
import { Words } from "./words";
import { YearHeat } from "./year-heat";

const HISTORY = "labs/history-of-history";
const CLOCK = "labs/exposure-clock";
const SEARCH = "labs/temporal-ann";
const SURVIVAL = "labs/paragraph-survival";
const OFFICES = "labs/bitemporal-offices";
const JOURNEYS = "labs/sentence-journeys";
const SOURCES = "labs/claims-before-sources";

/* ── The name of the war ──────────────────────────────────────────────── */

const firstNames = names[0];
const lastNames = names[names.length - 1];

const whiteShare = (row: (typeof names)[number]) => row.vapaussota / row.total;

const whitePeak = names.reduce((best, row) =>
  whiteShare(row) > whiteShare(best) ? row : best,
);
const whiteLow = names
  .slice(names.indexOf(whitePeak))
  .reduce((best, row) => (whiteShare(row) < whiteShare(best) ? row : best));

const civilShare = lastNames.sisallissota / lastNames.total;

const gainedIn2008 =
  names.find((row) => row.date === "2008-12-31")!.sisallissota -
  names.find((row) => row.date === "2007-12-31")!.sisallissota;

function Names() {
  return (
    <Section
      id="names"
      lab="History of history · the name of the 1918 war"
      title={
        <>
          The 1918 war is “sisällissota” in <N>{percent(civilShare, 1)}</N> of
          the mentions a reader sees, and no other name has led at any of the{" "}
          {snapshots.length} dates.
        </>
      }
      figure={<WarNames />}
      facts={[
        {
          value: `${percent(firstNames.sisallissota / firstNames.total, 1)} → ${percent(civilShare, 1)}`,
          label: `sisällissota, end of 2004 (${firstNames.sisallissota} of ${firstNames.total} mentions) to 1 October 2026 (${number(lastNames.sisallissota)} of ${number(lastNames.total)})`,
        },
        {
          value: percent(whiteShare(whitePeak), 1),
          label: `vapaussota at its highest, end of ${whitePeak.date.slice(0, 4)}`,
        },
        {
          value: `${percent(whiteShare(whiteLow), 1)} → ${percent(whiteShare(lastNames), 1)}`,
          label: `vapaussota since the end of ${whiteLow.date.slice(0, 4)}: ${whiteLow.vapaussota} mentions then, ${lastNames.vapaussota} now`,
        },
        {
          value: `${number(whiteNameStrings.medal)} of ${number(whiteNameStrings.all)}`,
          label:
            "“vapaussota” strings in the latest wikitext that are the name of a medal, not of the war",
        },
      ]}
      queries={queries.NAMES}
      source={HISTORY}
    >
      <p>
        Six names of the war were counted in the running text of every article,
        as the articles stood at {snapshots.length} dates:{" "}
        {number(firstNames.articles)} articles at the end of 2004,{" "}
        {number(lastNames.articles)} on 1 October 2026. Vapaussota, war of
        liberation, is the name the Whites gave the war. It reached{" "}
        {percent(whiteShare(whitePeak), 1)} at the end of{" "}
        {whitePeak.date.slice(0, 4)}, fell to {percent(whiteShare(whiteLow), 1)}{" "}
        by the end of {whiteLow.date.slice(0, 4)} and has gained since.
      </p>
      <p>
        These are counts of words, not of meanings: an unqualified
        “sisällissota” in an article about Spain still counts. Counting the raw
        string would tell a different story, because{" "}
        {number(whiteNameStrings.medal)} of the {number(whiteNameStrings.all)}{" "}
        “vapaussota” strings are the medal Vapaussodan muistomitali and{" "}
        {number(whiteNameStrings.otherCountries)} are other countries’ wars, so
        those are removed first. And one editor shaped the curve: of the{" "}
        {number(gainedIn2008)} mentions sisällissota gained in 2008,{" "}
        {number(ONE_ACCOUNT_2008.mentions)} came from one account editing{" "}
        {ONE_ACCOUNT_2008.articles} articles.
      </p>
    </Section>
  );
}

/* ── The edit war ─────────────────────────────────────────────────────── */

const { toWhite, toCivil } = swaps;

function EditWar() {
  return (
    <Section
      id="edit-war"
      lab="History of history · the edit war over the name"
      title={
        <>
          An edit that replaces “sisällissota” with “vapaussota” is undone{" "}
          <N>{percent(toWhite.freshUndone / toWhite.fresh)}</N> of the time. The
          opposite edit, <N>{percent(toCivil.freshUndone / toCivil.fresh)}</N>.
        </>
      }
      figure={<NameSwaps />}
      facts={[
        {
          value: `${Math.ceil(toWhite.medianSecondsToUndo / 60)} minutes`,
          label: `half of the ${toWhite.freshUndone} undone edits toward vapaussota were undone within this, ${toWhite.undoneWithinHour} within the hour`,
        },
        {
          value: `${toWhite.onMainArticle.undone} of ${toWhite.onMainArticle.all}`,
          label: `undone on the article ${article.title} itself`,
        },
        {
          value: `${toWhite.anonymous.undone} of ${toWhite.anonymous.all}`,
          label: `undone when the editor was anonymous, against ${toWhite.named.undone} of ${toWhite.named.all} for named editors`,
        },
      ]}
      queries={queries.SWAPS}
      source={HISTORY}
    >
      <p>
        In all {number(corpus.edits)} versions, {swaps.edits} edits in{" "}
        {swaps.articles} articles lowered the count of one name of the war and
        raised the count of another. Leaving out the edits that were themselves
        reverts, {toWhite.fresh} moved mentions from sisällissota to vapaussota
        and {toWhite.freshUndone} of them were later undone; {toCivil.fresh}{" "}
        moved them the other way and {toCivil.freshUndone} were undone.
      </p>
      <p>
        A swap is not always a rename. The rule also catches a large rewrite:
        revision {REWRITE.revId} added {REWRITE.kilobytes} KB to one article and
        moved {REWRITE.moved} mentions. Swaps count every mention, not only
        running text. And an undo records what editors did, not which name is
        right.
      </p>
    </Section>
  );
}

/* ── The main article ─────────────────────────────────────────────────── */

function Article() {
  return (
    <Section
      id="article"
      lab="History of history · the article on the war itself"
      title={
        <>
          The article opened as “Suomen vuoden 1918 sota” for{" "}
          <N>{Math.round(article.warOf1918.days)} days</N>, and its infobox
          listed the Reds first for <N>{number(article.reds.days)} days</N>.
        </>
      }
      figure={<MainArticle />}
      facts={[
        {
          value: `${article.liberation.versions} versions`,
          label: `opened the article as “Suomen vapaussota”. Together they stood ${article.liberation.days} days.`,
        },
        {
          value: day(article.switched.row_start),
          label: `revision ${article.switched.rev_id} put the Whites first. ${article.whites.versions} versions and ${number(article.whites.days)} days later it has not switched back.`,
        },
      ]}
      queries={queries.ARTICLE}
      source={HISTORY}
    >
      <p>
        The article is {article.title}, page {article.pageId}, with{" "}
        {number(article.versions)} versions. It opened as “Suomen sisällissota”
        from {day(article.civil.first_seen)}, as “Suomen vuoden 1918 sota”
        (Finland’s war of 1918) from {day(article.warOf1918.first_seen)}, and as
        “Suomen sisällissota” again since {day(article.warOf1918.last_seen)}.
        Its infobox arrived on {day(article.reds.first_seen)} with the Reds as
        the first belligerent and has listed the Whites first since{" "}
        {day(article.whites.first_seen)}.
      </p>
      <p>
        The name is read from the first bold phrase of each version and the side
        from one infobox parameter, both with a regular expression, so this is
        what the wikitext says and not a reading of the article. The title could
        not be used: the dump keeps one title per page, and none of the{" "}
        {number(corpus.articles)} articles shows a second one.
      </p>
    </Section>
  );
}

/* ── Which years the articles talk about ──────────────────────────────── */

const lastReading = readings[readings.length - 1];
const firstLead = readings.find((row) => row.topYear === 1918)!;
const earlier = readings.slice(0, readings.indexOf(firstLead));
const since2017 = reading("2017-12-31");
const peak1910s = peakOf(1910);
const now1910s = lastReading.cells.find((cell) => cell.decade === 1910)!.share;

const growth = (year: number) => lastReading.at(year) / since2017.at(year);

function Years() {
  return (
    <Section
      id="years"
      lab="History of history · which years the articles talk about"
      title={
        <>
          Since the end of {firstLead.date.slice(0, 4)}, the year the articles
          mention most is <N>1918</N> at every reading.
        </>
      }
      figure={<YearHeat />}
      facts={[
        {
          value: `${number(firstLead.at(1918))} → ${number(lastReading.at(1918))}`,
          label: `mentions of 1918, end of ${firstLead.date.slice(0, 4)} to 1 October 2026`,
        },
        {
          value: percent(peak1910s.share, 2),
          label: `the 1910s at their highest share, end of ${peak1910s.date.slice(0, 4)}. Now ${percent(now1910s, 2)}.`,
        },
        {
          value: `${growth(1809).toFixed(2)}×`,
          label: `mentions of 1809 since the end of 2017 (${since2017.at(1809)} to ${number(lastReading.at(1809))}). 1808 grew ${growth(1808).toFixed(2)} times, all years ${(lastReading.total / since2017.total).toFixed(2)} times, 1918 ${growth(1918).toFixed(2)} times.`,
        },
      ]}
      queries={queries.YEARS}
      source={HISTORY}
    >
      <p>
        Every four-digit year from 1000 to 2026 was counted in every article as
        it stood on the date, outside footnotes and citation templates:{" "}
        {number(readings[0].total)} year mentions at the end of 2004,{" "}
        {number(lastReading.total)} on 1 October 2026. At the first{" "}
        {earlier.length} readings the most mentioned year was one Wikipedia had
        lived through ({earlier.map((row) => row.topYear).join(", ")}). The
        1910s peaked in {peak1910s.date.slice(0, 4)}, not at the centenary of
        the war. After 2017 the fastest-growing years with at least 300 mentions
        are 1809 and 1808, the years of the Finnish War.
      </p>
      <p>
        Share is not interest: a decade’s share falls when other decades grow
        faster, and the 1910s lost share while their mentions kept growing. What
        is counted is still not clean. Populations, page numbers and street
        numbers between 1000 and 2026 count as years, and of the{" "}
        {number(lastReading.at(1975))} mentions of 1975, {number(ONE_BOOK_1975)}{" "}
        are the publication line of one book.
      </p>
    </Section>
  );
}

/* ── Words ────────────────────────────────────────────────────────────── */

const nato = (date: string) => words.nato.find((row) => row.date === date)!;
const finlandization = (date: string) =>
  words.suomettuminen.find((row) => row.date === date)!;

const natoBefore = nato("2021-12-31");
const natoNow = words.nato[words.nato.length - 1];

const steady = words.nato
  .filter((row) => row.date >= "2007-12-31" && row.date <= "2021-12-31")
  .map((row) => row.share);

function Nato() {
  const before = finlandization("2021-12-31");
  const now = words.suomettuminen[words.suomettuminen.length - 1];

  return (
    <Section
      id="nato"
      lab="History of history · words"
      title={
        <>
          “Nato” was in {natoBefore.articles} articles on the history of Finland
          at the end of 2021. On 1 October 2026 it is in{" "}
          <N>{natoNow.articles}</N>.
        </>
      }
      figure={<Words />}
      facts={[
        {
          value: `${percent(natoBefore.share, 2)} → ${percent(natoNow.share, 2)}`,
          label: `of the articles that existed: ${natoBefore.articles} of ${number(natoBefore.total)}, then ${natoNow.articles} of ${number(natoNow.total)}`,
        },
        {
          value: `${before.articles} → ${now.articles}`,
          label: `articles with “suomettuminen” over the same years, ${percent(before.share, 2)} to ${percent(now.share, 2)}`,
        },
      ]}
      queries={queries.WORDS}
      source={HISTORY}
    >
      <p>
        An article counts if the word occurs in it at least once, as it stood on
        the date. At every year-end from 2007 to 2021 the share for Nato was
        between {percent(Math.min(...steady), 2)} and{" "}
        {percent(Math.max(...steady), 2)}.
      </p>
      <p>
        These are small counts, under 1 % of the articles, and they say that a
        word is present, not how much is said. The pattern is{" "}
        <code className="font-mono text-[13px]">{words.patterns.nato}</code>,
        which matches any word that begins with “nato”. The lab also counted
        “lappalainen” against “saamelainen” and found the pair confounded by the
        surname Lappalainen, so it is not drawn here.
      </p>
    </Section>
  );
}

/* ── Exposure clock ───────────────────────────────────────────────────── */

const anonymous = exposure.byEditor("ip");
const named = exposure.byEditor("named");

const fastest = exposure.years.reduce((best, row) =>
  row.medianMinutes < best.medianMinutes ? row : best,
);
const slowest = exposure.years.reduce((best, row) =>
  row.medianMinutes > best.medianMinutes ? row : best,
);

function Exposure() {
  const overall = exposure.knownHash.medianSeconds / 60;

  return (
    <Section
      id="exposure"
      lab="Exposure clock · how long undone edits stood"
      title={
        <>
          Half of the edits that were later undone were undone within{" "}
          <N>{overall.toFixed(2)} minutes</N>. The yearly medians do not show it
          getting faster.
        </>
      }
      figure={
        <>
          <ExposureChart />
          <Clusters />
        </>
      }
      facts={[
        {
          value: duration(anonymous.median_seconds),
          label: `median for edits from an IP address undone by someone else (${number(anonymous.n)}), ${percent(anonymous.within_hour, 2)} within the hour`,
        },
        {
          value: duration(named.median_seconds),
          label: `median for named editors (${number(named.n)}), ${percent(named.within_hour, 2)} within the hour. Not a comparison of editor quality: named edits have a much longer historical tail.`,
        },
        {
          value: number(clusters.events),
          label: `reverts in which a named editor undid a different named editor, across ${number(clusters.articleMonths)} article-months. The busiest has ${clusters.top[0].events}.`,
        },
      ]}
      queries={queries.EXPOSURE}
      source={CLOCK}
    >
      <p>
        A version counts as undone when a later revision restored an earlier
        text exactly, by its hash. The clock runs from the save of the undone
        version to the save of the revision that restored the text, over{" "}
        {number(exposure.knownHash.n)} such versions in {number(corpus.edits)}{" "}
        edits. The median was {fastest.medianMinutes.toFixed(2)} minutes in{" "}
        {fastest.year} and {slowest.medianMinutes.toFixed(2)} in {slowest.year}.
      </p>
      <p>
        This is the time until a recorded restore. It is not what readers saw
        and it does not say the undone text was vandalism: a restore that
        reaches far back sweeps up ordinary edits made in between. The data
        labels {number(exposure.allLabels)} versions as undone;{" "}
        {number(exposure.missingHash)} of those point to a restore whose hash is
        missing and are left out here. The two medians by kind of editor, listed
        next, use all the labels.
      </p>
    </Section>
  );
}

/* ── Temporary accounts ───────────────────────────────────────────────── */

const fall = (before: number, after: number) => (before - after) / before;

function Temporary() {
  const { before, after, yearEarlier, namedBefore, namedAfter } = temporary;
  const { shareDifference, medianDifference } = temporary;

  return (
    <Section
      id="temporary"
      lab="Exposure clock · before and after temporary accounts"
      title={
        <>
          After temporary accounts appeared, the share of anonymous edits undone
          within a week went from {percent(before.share, 2)} to{" "}
          <N>{percent(after.share, 2)}</N>. That is an association, not
          causation.
        </>
      }
      figure={<TemporaryChart />}
      facts={[
        {
          value: `+${shareDifference.estimate.toFixed(2)} points`,
          label: `after minus before. 95 % interval ${shareDifference.lower.toFixed(2)} to ${shareDifference.upper.toFixed(2)}.`,
        },
        {
          value: `${number(before.edits)} → ${number(after.edits)}`,
          label: `anonymous edits in the two windows, down ${percent(fall(before.edits, after.edits), 1)}. Named edits fell ${percent(fall(namedBefore.edits, namedAfter.edits), 1)}.`,
        },
        {
          value: `${before.medianSeconds} → ${after.medianSeconds} s`,
          label: `median time to the undo. The interval of the difference, −${Math.abs(Math.round(medianDifference.lower))} to ${number(Math.round(medianDifference.upper))} seconds, includes zero: no clear change.`,
        },
      ]}
      queries={queries.TEMPORARY}
      source={CLOCK}
    >
      <p>
        The first temporary account in the data edits on{" "}
        {day(corpus.firstTemporaryAccount)}. The comparison takes the six months
        before (March to August 2025) and six months after (October 2025 to
        March 2026), leaves September out, and asks what share of anonymous
        edits someone else undid within seven days: {number(before.undone)} of{" "}
        {number(before.edits)}, then {number(after.undone)} of{" "}
        {number(after.edits)}. October 2024 to February 2025, the winter a year
        earlier, had {percent(yearEarlier.share, 2)}.
      </p>
      <p>
        This is an observed before and after, not an experiment. Calendar
        trends, which articles were edited, who edits anonymously and how edits
        get noticed all changed over the same months and are not controlled for.
        The interval measures how much the result depends on particular articles
        and nothing else. The data do not show that the switch caused the rise,
        and do not show that undoing became slower.
      </p>
    </Section>
  );
}

/* ── Paragraph survival ───────────────────────────────────────────────── */

const halfLife = (stays: { medianDays: number | null }) =>
  (stays.medianDays ?? 0).toFixed(1);

function Survival() {
  const { all, raw, named, anonymous, slots, removals } = survival;
  const [oldest] = survival.oldest;

  return (
    <Section
      id="survival"
      lab="Paragraph survival · how long an exact wording stands"
      title={
        <>
          Half of the exact wordings of a paragraph are gone after{" "}
          <N>{halfLife(all)} days</N>: after <N>{halfLife(named)}</N> when a
          named account introduced them, after <N>{halfLife(anonymous)}</N> when
          an anonymous one did.
        </>
      }
      figure={
        <>
          <SurvivalChart />
          <Oldest />
        </>
      }
      facts={[
        {
          value: `${percent(all.goneBy(survival.HOUR), 2)} / ${percent(all.goneBy(survival.DAY), 2)}`,
          label: "of wordings are gone within an hour and within a day",
        },
        {
          value: `${halfLife(raw)} days`,
          label: `the half-life if every removal counts. The headline leaves ${number(survival.undoneRemovals)} endings open, because the edit that removed the wording was itself undone.`,
        },
        {
          value: percent(survival.standingSinceBefore2010, 2),
          label: `of the ${number(survival.standing)} prose wordings standing on 1 October 2026 have stood without interruption since before 2010`,
        },
        {
          value: `${removals.stillThereAfter} of ${removals.checked}`,
          label: `of the longest-lived paragraphs that count as finally removed kept their whole reading text in the article straight after the removal. ${removals.stillThereNow} still have it today.`,
        },
      ]}
      queries={queries.SURVIVAL}
      source={SURVIVAL}
    >
      <p>
        A wording is the exact wikitext of one prose paragraph of at least{" "}
        {WORDING_AT_LEAST} characters in one article, and a stay is the time it
        stands there without a break: {number(all.n)} stays over the whole
        history of the {number(corpus.articles)} articles, of which{" "}
        {number(raw.endings)} had ended by 1 October 2026. The oldest still
        standing is in {oldest.title}, unchanged since {day(oldest.since)}.
        Anonymous means an IP address or a temporary account, and the account is
        the one whose edit began the stay, which can be someone restoring a
        paragraph and not its writer.
      </p>
      <p>
        The end of a wording is not a retraction. A corrected typo, a new
        footnote or a change of markup ends a stay as surely as a deletion does,
        because the hash is of the wikitext. The lab also followed inferred
        paragraphs through their rewordings: of {number(slots.n)},{" "}
        {number(slots.endings)} have finally disappeared, so that curve never
        comes down to a half. Even those are not all removals. Reread by hand,
        the {removals.checked} longest-lived include a paragraph merged into its
        neighbour and one that only gained a reference. The gap between named
        and anonymous accounts is a description, not an effect of who wrote: the
        groups differ in what they edit and when, and nothing is adjusted for
        that. And leaving undone removals open leans on a label that is broader
        than vandalism, which is why the figure with every removal counted is
        given next to it.
      </p>
    </Section>
  );
}

/* ── Bitemporal offices ───────────────────────────────────────────────── */

const surname = (person: string) => person.split(" ").at(-1);

function Offices() {
  const { flip, unclaimed } = offices;
  const [first, ...later] = flip.asked;
  const now = later.pop()!;

  const nobody = flip.inBetween.filter((stretch) => !stretch.named.length);
  const both = flip.inBetween.filter((stretch) => stretch.named.length > 1);

  return (
    <Section
      id="offices"
      lab="Bitemporal offices · when it was true, and when Wikipedia said so"
      title={
        <>
          Who was president on {fullDay(flip.date)}?{" "}
          {surname(first.answer.named[0].person)}, said Wikipedia at the end of{" "}
          <N>{first.asOf?.slice(0, 4)}</N>.{" "}
          {later.map(({ asOf, answer }) => (
            <span key={asOf}>
              {surname(answer.named[0].person)} at the end of{" "}
              <N>{asOf?.slice(0, 4)}</N>,{" "}
            </span>
          ))}
          and {surname(now.answer.named[0].person)} today.
        </>
      }
      figure={<OfficesChart />}
      facts={[
        {
          value: `${number(offices.statements)} → ${offices.rows}`,
          label: `statements of a term, one per saved version, collapse into one row per lifetime of a claim. ${offices.presidencyRows} of the rows are about the presidency and ${offices.statedToday} are stated today.`,
        },
        {
          value: `${offices.changes} changes`,
          label: `of a stated start or end date, ${offices.presidencyChanges} of them on the presidency. ${offices.changesToTodaysValue} moved to the value stated today, ${offices.changesWithoutSummary} came without an edit summary.`,
        },
        {
          value: `${offices.gaps[offices.gaps.length - 1].days} days`,
          label: `of history for which today’s articles name no president: ${unclaimed.map((gap) => `${gap.days} between ${surname(gap.outgoing)} and ${surname(gap.incoming)}`).join(", ")}. The gaps first opened on ${[...new Set(unclaimed.map((gap) => day(gap.since)))].join(" and ")}.`,
        },
        {
          value: `${offices.flipMs} ms`,
          label: `for the statement that asks the day of four Wikipedias, and ${offices.changesMs} ms to find all ${offices.changes} changes. Medians of seven runs on a laptop.`,
        },
      ]}
      queries={queries.OFFICES}
      source={OFFICES}
    >
      <p>
        One table holds two kinds of time. Valid time is the term an infobox
        states, as a MariaDB application-time period. System time is when
        Wikipedia stated it, loaded from the real edit times of{" "}
        {number(offices.versions)} versions of the {offices.articles}{" "}
        presidents’ articles. Asked for one day of history as of one moment of
        Wikipedia’s, the table returns a name and the revision that said it. The
        handover of 1925 moved between 1 and 2 March {flip.answers.length - 1}{" "}
        times, each time in one sitting across two articles. Between the two
        edits of a sitting the day belonged to nobody for{" "}
        {nobody.map((stretch) => stretch.seconds).join(" and ")} seconds, and to
        both men for {both.map((stretch) => stretch.seconds).join(" and ")}{" "}
        seconds.
      </p>
      <p>
        “Wikipedia said” has a definition here: a version that a revert removed
        within 30 days is skipped, {number(offices.skipped)} of them, and
        without that rule the table would have {offices.rowsWithEveryVersion}{" "}
        rows. The statements come from the infoboxes and nothing else.{" "}
        {number(offices.withoutInfobox)} accepted versions have none, the parser
        refused {offices.refused} stated terms, and the articles’ prose and the
        lists of presidents, which could disagree with the infoboxes, were not
        read. The count of changes is a lower bound: it pairs a statement only
        with the one that replaced it in the same edit. The lab does not judge
        which date is right. And one thing it learned about MariaDB:{" "}
        <code className="font-mono text-[13px]">WITHOUT OVERLAPS</code> on a
        system-versioned table compares only rows with the same{" "}
        <code className="font-mono text-[13px]">row_end</code>, so the key keeps
        today’s statements from overlapping and does not make history
        consistent.
      </p>
      <p>
        <Link
          href="/atlas/presidents"
          className="font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-rubric"
        >
          Turn both dials yourself
        </Link>{" "}
        <span aria-hidden className="font-mono text-xs text-rubric">
          →
        </span>
      </p>
    </Section>
  );
}

/* ── Sentence journeys ────────────────────────────────────────────────── */

function Journeys() {
  const { delay, transfers, outlasting } = journeys;
  const [largest] = transfers.largest;

  return (
    <Section
      id="journeys"
      lab="Sentence journeys · paragraphs observed in more than one article"
      title={
        <>
          <N>{number(journeys.shared)}</N> of {number(journeys.wordings)}{" "}
          paragraphs stood in more than one article. The copy outlasted the text
          it was first observed in <N>{number(outlasting.later)}</N> times,
          against <N>{outlasting.first}</N>.
        </>
      }
      figure={
        <>
          <JourneysChart />
          <Transfers />
        </>
      }
      facts={[
        {
          value: `${delay.medianDays.toFixed(2)} days`,
          label: `median from the first article to the second. ${percent(delay.withinHour, 2)} arrived within an hour, ${percent(delay.withinDay, 2)} within a day.`,
        },
        {
          value: `${transfers.events} transfers`,
          label: `in which at least ${JOURNEY.paragraphs} paragraphs arrived in one revision. The largest took ${largest.paragraphs} from ${largest.source} to ${largest.destination} on ${day(largest.at)}. In ${transfers.withComment} an edit summary has a word for moving or copying.`,
        },
        {
          value: `${journeys.bornWithEarlierText} articles`,
          label: `began with a paragraph first observed in another of the articles. ${journeys.bornWithFive} began with five or more.`,
        },
        {
          value: `${percent(outlasting.laterAfterAYear / outlasting.followedAYear, 2)} / ${percent(outlasting.firstAfterAYear / outlasting.followedAYear, 2)}`,
          label: `unchanged a year on, in the second article and in the first, among the ${number(outlasting.followedAYear)} pairs that can be followed for a year`,
        },
      ]}
      queries={queries.JOURNEYS}
      source={JOURNEYS}
    >
      <p>
        A paragraph here is the exact wikitext of a prose paragraph of at least{" "}
        {JOURNEY.atLeast} characters, and it has travelled when the same text is
        found in a second article. {journeys.inFiveOrMore} reached five articles
        and none more than {journeys.mostArticles}. Most of it is not sentences
        wandering off on their own: {number(transfers.wordings)} of the{" "}
        {number(journeys.shared)} (
        {percent(transfers.wordings / journeys.shared, 1)}) took part in a bulk
        transfer, an editor splitting an article or moving a section to a new
        one.
      </p>
      <p>
        All of this is the order in which text was first observed within these{" "}
        {number(journeys.articles)} articles. It is not authorship, and it is
        not the first appearance on Wikipedia: the earlier article may have
        taken the paragraph from an article outside the collection, from a
        deleted revision or from a source both used, and a paraphrase is not
        detected at all. Identity is the hash of the wikitext, which is stricter
        than what a reader sees. The {number(journeys.shared)} hashes are{" "}
        {number(journeys.readingTexts)} distinct reading texts, and a change of
        markup alone ends a copy’s life, so “outlasted” means stayed unchanged
        for longer. It leaves out the {outlasting.bothStanding} pairs that both
        still stand. Nobody should be called a copyist on this evidence.
      </p>
    </Section>
  );
}

/* ── Claims before sources ────────────────────────────────────────────── */

const read = (verdict: string) =>
  sourcing.audit.filter((row) => row.verdict.startsWith(verdict)).length;

function Sources() {
  const { wait } = sourcing;

  return (
    <Section
      id="sources"
      lab="Claims before sources · when a paragraph gets its reference"
      title={
        <>
          <N>{percent(sourcing.referenced / sourcing.paragraphs, 2)}</N> of
          today’s paragraphs carry a reference. Of the{" "}
          <N>{sourcing.candidates}</N> whose first source is younger than the
          claim, the {sourcing.audit.length} that waited longest were read, and
          circular sourcing was confirmed in <N>{sourcing.confirmedCircular}</N>
          .
        </>
      }
      figure={
        <>
          <Sourcing />
          <Audit />
        </>
      }
      facts={[
        {
          value: number(sourcing.gained),
          label: `paragraphs gained their first reference after they were written, after a median of ${number(Math.round(wait.medianDays))} days (quartiles ${number(Math.round(wait.q25Days))} and ${number(Math.round(wait.q75Days))}). ${number(sourcing.bornReferenced)} were born with one.`,
        },
        {
          value: number(sourcing.neverIn15Years),
          label: `paragraphs that are at least 15 years old have never carried an inline reference. ${number(sourcing.lostTheirs)} of today’s unreferenced paragraphs once had one.`,
        },
        {
          value: percent(sourcing.dated / sourcing.references, 2),
          label: `of the ${number(sourcing.references)} references in today’s paragraphs give a publication year the parser accepts. ${number(sourcing.namedElsewhere)} are named references defined outside their paragraph. Only the dated ones can be screened.`,
        },
      ]}
      queries={queries.SOURCES}
      source={SOURCES}
    >
      <p>
        A paragraph counts as referenced when its wikitext holds a{" "}
        <code className="font-mono text-[13px]">&lt;ref&gt;</code> tag:{" "}
        {number(sourcing.referenced)} of the {number(sourcing.paragraphs)} prose
        paragraphs of at least {WORDING_AT_LEAST} characters standing on 1
        October 2026, and {number(sourcing.unreferenced)} without. The search
        for a claim older than its source asks for more: a first reference whose
        citation gives a publication year later than the year the paragraph was
        first seen, no gap in the paragraph’s history before it, the same source
        still cited today, and at least {percent(CANDIDATE_OVERLAP)} of the
        words shared between the original, the first referenced and the current
        wording. {sourcing.candidates} paragraphs pass.
      </p>
      <p>
        This is a negative result. Read one by one, the {sourcing.audit.length}{" "}
        that waited longest are {read("claim was updated")} paragraphs whose
        claim was itself changed in the edit that brought the source (a death
        date, a corrected year), {read("later better source")} old claims that
        were probably just sourced late, and {read("possible circular")} that
        cannot be settled without the publication in hand. None is a confirmed
        case of a source that took its claim from Wikipedia. The screen hands an
        editor candidates to check. It does not find culprits: a long wait is
        ordinary, publication years are typed in by editors and some are wrong,
        and word overlap cannot say which sentence a citation supports. The
        waits describe paragraphs that survive and are referenced today, not
        every paragraph ever written.
      </p>
    </Section>
  );
}

/* ── Temporal ANN ─────────────────────────────────────────────────────── */

function Search() {
  const { versioned80, versioned1000, joined1000, exact } = ann;

  return (
    <Section
      id="search"
      lab="Temporal ANN · a finding about MariaDB"
      title={
        <>
          Searching a versioned table through its vector index as of a date
          found <N>{percent(versioned80.recall)}</N> of the true ten nearest.
          Filtering by lifetime first and comparing exactly found{" "}
          <N>{percent(exact.recall)}</N>, in{" "}
          <N>{exact.medianMs.toFixed(2)} ms</N>.
        </>
      }
      figure={
        <>
          <SearchChart />
          <Shapes />
        </>
      }
      facts={[
        {
          value: percent(versioned1000.recall, 2),
          label: `design A with ef_search raised to 1,000. Its 95th percentile, ${versioned1000.p95Ms.toFixed(2)} ms, is then slower than exact search’s ${exact.p95Ms.toFixed(2)} ms.`,
        },
        {
          value: percent(joined1000.fullButWrong, 1),
          label: `of design B’s answers with 1,000 candidates are ten rows with a true neighbour missing. Nothing in the result says so.`,
        },
        {
          value: `${number(ann.fewestAlive)} to ${number(ann.mostAlive)}`,
          label: `rows alive on a date, of ${number(ann.vectors)} stored: ${percent(ann.fewestAlive / ann.vectors, 2)} to ${percent(ann.mostAlive / ann.vectors, 2)}. The index returns mostly rows that are dead on the date.`,
        },
      ]}
      queries={queries.SEARCH}
      source={SEARCH}
    >
      <p>
        The corpus is {number(ann.vectors)} vectors from {number(ann.articles)}{" "}
        articles, one per saved version, with the real edit times as{" "}
        <code className="font-mono text-[13px]">row_start</code> and{" "}
        <code className="font-mono text-[13px]">row_end</code>. {ann.queries}{" "}
        held-out queries were run at {ann.dates} dates, each against the exact
        ten nearest rows alive on that date. What the plans show, stated as
        narrowly as the evidence allows: design A does use the vector index, the
        period condition is applied to the rows the index returns, and the
        search stops before ten live rows are found. At ef_search 1,000 one
        traced query read {number(PLAN_AT_1000.rowsRead)} rows from the index
        and kept {PLAN_AT_1000.rowsKept}. Why it stops there, the plans do not
        say.
      </p>
      <p>
        The vectors are a stress case, not real passages: each article’s real
        current vector with a little noise added per version, which makes every
        version a near-duplicate of its neighbours. With no date at all the same
        index found {percent(ann.unfiltered80)} of the true ten on this corpus,
        so the experiment shows the whole search failing when dead
        near-duplicates crowd the index. It does not isolate a defect in system
        versioning. One corpus, one index build per design, a shared laptop with
        warm caches. The {exact.medianMs.toFixed(2)} ms holds for up to{" "}
        {number(ann.mostAlive)} live rows and should not be extrapolated. Taking
        the exact global top 1,000 before the date filter reached{" "}
        {percent(EXACT_GLOBAL_1000.recall, 2)} recall and still came up short on{" "}
        {percent(EXACT_GLOBAL_1000.underfilled)} of pairs, which is why the
        product filters by lifetime first.
      </p>
    </Section>
  );
}

/**
 * The page, top to bottom. A new lab gets a component here and, if its
 * number belongs in the opening row, an entry in HEADLINES.
 */
export const SECTIONS = [
  { id: "names", Finding: Names },
  { id: "edit-war", Finding: EditWar },
  { id: "article", Finding: Article },
  { id: "years", Finding: Years },
  { id: "nato", Finding: Nato },
  { id: "exposure", Finding: Exposure },
  { id: "temporary", Finding: Temporary },
  { id: "survival", Finding: Survival },
  { id: "journeys", Finding: Journeys },
  { id: "sources", Finding: Sources },
  { id: "offices", Finding: Offices },
  { id: "search", Finding: Search },
];

/** The numbers under the headline, each a door to its section. */
export const HEADLINES = [
  {
    href: "#names",
    value: percent(civilShare, 1),
    label: "of running-text mentions call the 1918 war “sisällissota”",
  },
  {
    href: "#edit-war",
    value: `${percent(toWhite.freshUndone / toWhite.fresh)} / ${percent(toCivil.freshUndone / toCivil.fresh)}`,
    label:
      "of edits swapping in “vapaussota” are undone, against the opposite edit",
  },
  {
    href: "#years",
    value: "1918",
    label: `the most mentioned year at every reading since ${firstLead.date.slice(0, 4)}`,
  },
  {
    href: "#exposure",
    value: `${(exposure.knownHash.medianSeconds / 60).toFixed(2)} min`,
    label: `median time an undone edit stood, over ${number(exposure.knownHash.n)} of them`,
  },
  {
    href: "#survival",
    value: `${halfLife(survival.all)} days`,
    label: `until half of the exact wordings of a paragraph are gone, over ${number(survival.all.n)} stays`,
  },
  {
    href: "#search",
    value: `${percent(ann.versioned80.recall)} → ${percent(ann.exact.recall)}`,
    label:
      "recall of search as of a date: through a versioned vector index, then exact",
  },
];
