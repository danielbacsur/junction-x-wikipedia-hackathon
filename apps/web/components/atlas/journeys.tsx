import { day, number } from "@/lib/format";

import { Figure, Shares } from "./chart";
import { journeys } from "./data";
import { across } from "./format";

const { delay, outlasting, transfers } = journeys;

/** The lab's own bins, in the words a reader would use for them. */
const WAITS: Record<string, { name: string; className: string }> = {
  "1 within hour": { name: "Within an hour", className: "fill-ink" },
  "2 hour to day": { name: "An hour to a day", className: "fill-ink-soft" },
  "3 day to year": { name: "A day to a year", className: "fill-ink-faint" },
  "4 over year": { name: "More than a year", className: "fill-rule" },
};

function Head({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-xs tracking-wide text-ink-faint uppercase">
      {children}
    </p>
  );
}

/** How soon a paragraph is seen in a second article, and which copy lasts. */
export function Journeys() {
  return (
    <Figure
      title={`Paragraphs that stood in more than one article · ${number(journeys.shared)} of ${number(journeys.wordings)} exact wordings`}
      read={
        <>
          Above, the time from the first article a wording was observed in to
          the second. Below, the pairs in which the first article still had the
          paragraph when the second received it, by which of the two kept it
          unchanged for longer. First means first observed in these{" "}
          {number(journeys.articles)} articles. It does not mean written there.
        </>
      }
    >
      <Head>From the first article to the second</Head>
      <Shares
        label={`Delay from the first article to the second, ${number(journeys.shared)} wordings`}
        parts={delay.bins.map((bin) => ({
          name: WAITS[bin.bin]?.name ?? bin.bin,
          count: bin.wordings,
          className: WAITS[bin.bin]?.className ?? "fill-ink-faint",
        }))}
      />

      <div className="mt-6 border-t border-rule pt-4">
        <Head>
          Which copy stood unchanged for longer · {number(outlasting.pairs)}{" "}
          pairs
        </Head>
        <Shares
          label={`Which copy outlasted the other, ${number(outlasting.pairs)} pairs`}
          parts={[
            {
              name: "The copy in the second article",
              count: outlasting.later,
              className: "fill-ink",
            },
            {
              name: "The one in the first article",
              count: outlasting.first,
              className: "fill-ink-faint",
            },
            {
              name: "Both stand today: undecided",
              count: outlasting.bothStanding,
              className: "fill-rule",
            },
          ]}
        />
      </div>
    </Figure>
  );
}

const SHOWN = 8;

function Key({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span className="whitespace-nowrap">
      <svg
        width="14"
        height="10"
        aria-hidden
        className="mr-1.5 inline-block align-[-1px]"
      >
        <rect width="14" height="10" className={className} />
      </svg>
      {children}
    </span>
  );
}

/** The revisions in which the most paragraphs arrived from an earlier article. */
export function Transfers() {
  const shown = transfers.largest.slice(0, SHOWN);
  const most = shown[0].paragraphs;

  return (
    <Figure
      title={`Bulk transfer candidates · the ${SHOWN} largest of ${transfers.events}`}
      read={
        <>
          A row is one revision in which at least five paragraphs arrived that
          an earlier article already had. The bar is the number of paragraphs:
          the dark part left the earlier article within an hour of arriving, the
          outlined part stayed in both. Titles are today’s. These are candidates
          by chronology. Where several earlier articles held the same text, the
          data cannot say which one it came from.
        </>
      }
    >
      <ol className="flex flex-col gap-2.5">
        {shown.map((transfer) => (
          <li
            key={transfer.revId}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 md:grid-cols-[minmax(0,25rem)_5.5rem_minmax(0,1fr)_1.5rem]"
          >
            <span
              className="truncate font-serif text-[15px]"
              title={`${transfer.source} → ${transfer.destination}`}
            >
              {transfer.source} <span className="text-ink-faint">→</span>{" "}
              {transfer.destination}
            </span>
            <span className="text-xs text-rubric tabular-nums max-md:text-right">
              {day(transfer.at)}
            </span>
            <span className="max-md:col-start-1">
              <svg width="100%" height="10" aria-hidden className="block">
                <rect
                  width={across(transfer.moved / most)}
                  height="10"
                  className="fill-ink-soft"
                />
                <rect
                  x={across(transfer.moved / most)}
                  y="0.5"
                  width={across(transfer.retained / most)}
                  height="9"
                  className="fill-paper-sunk stroke-ink-faint"
                />
              </svg>
            </span>
            <span className="text-right text-xs text-ink-soft tabular-nums">
              {transfer.paragraphs}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-rule pt-3 text-xs text-ink-faint">
        <Key className="fill-ink-soft">
          gone from the earlier article within an hour
        </Key>
        <Key className="fill-paper-sunk stroke-ink-faint">kept in both</Key>
      </p>
    </Figure>
  );
}
