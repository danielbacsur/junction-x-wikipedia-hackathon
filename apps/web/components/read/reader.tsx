"use client";

import type { ArticleView, Block } from "@wtt/package-engine";

import { Inline } from "@/components/inline";
import { LATEST, day, span } from "@/lib/format";

const READABLE = new Set(["prose", "list", "heading"]);

/** What a block that is not shown is called, one of it and several. */
const MARKUP: Record<string, [string, string]> = {
  template: ["template", "templates"],
  table: ["table", "tables"],
  file: ["image", "images"],
  meta: ["category", "categories"],
  markup: ["piece of markup", "pieces of markup"],
};

const daysBetween = (from: string, to: string) =>
  (Date.parse(`${to.slice(0, 19).replace(" ", "T")}Z`) -
    Date.parse(`${from.slice(0, 19).replace(" ", "T")}Z`)) /
  86_400_000;

/**
 * How old a wording was on the day in view, as the strength of the mark in
 * the margin: a paragraph written that week is red, one that had stood for
 * years has faded to the colour of the rules.
 */
const ageMark = (days: number) =>
  days < 30
    ? "bg-rubric"
    : days < 365
      ? "bg-gold"
      : days < 365 * 4
        ? "bg-ink-faint"
        : "bg-rule";

/**
 * Runs of markup blocks become one quiet line saying what was there. A
 * wording can stand in an article twice, so each readable block also gets
 * a key that tells the copies apart.
 */
const grouped = (blocks: Block[]) => {
  const groups: ({ block: Block; key: string } | { markup: Block[] })[] = [];
  const copies = new Map<string, number>();

  for (const block of blocks) {
    const last = groups.at(-1);

    if (READABLE.has(block.kind)) {
      const copy = copies.get(block.hash) ?? 0;
      copies.set(block.hash, copy + 1);
      groups.push({
        block,
        key: copy === 0 ? block.hash : `${block.hash}-${copy}`,
      });
    } else if (last && "markup" in last) {
      last.markup.push(block);
    } else {
      groups.push({ markup: [block] });
    }
  }

  return groups;
};

/**
 * The article as it stood on a date, paragraph by paragraph. Each one
 * carries the edit that wrote its wording: the mark in the margin shows
 * its age, and the note beside it says who wrote it and when.
 */
export function Reader({
  article,
  selected,
  fresh,
  noted,
  onSelect,
}: {
  article: ArticleView;

  /** The paragraph whose life is open or that the address points at, by hash. */
  selected: string | null;

  /** Paragraphs written after this moment are shown as newly arrived. */
  fresh: string | null;

  /** Whether there is room in the margin for the note on who wrote it. */
  noted: boolean;
  onSelect: (hash: string) => void;
}) {
  const at = article.at ?? LATEST;

  return (
    <div className="font-serif text-[17px] leading-relaxed">
      {grouped(article.blocks).map((group, index) => {
        if ("markup" in group) {
          const kinds = new Map<string, number>();

          for (const block of group.markup) {
            kinds.set(block.kind, (kinds.get(block.kind) ?? 0) + 1);
          }

          return (
            <p
              key={`m-${index}`}
              className="my-2 font-mono text-[11px] text-ink-faint select-none"
            >
              {[...kinds]
                .map(([kind, count]) => {
                  const [one, many] = MARKUP[kind] ?? [kind, kind];

                  return count > 1 ? `${count} ${many}` : `1 ${one}`;
                })
                .join(", ")}
              , not shown
            </p>
          );
        }

        const { block, key } = group;

        if (block.kind === "heading") {
          const Tag = block.level <= 2 ? "h2" : "h3";

          return (
            <Tag
              key={key}
              id={`p-${key}`}
              className={
                block.level <= 2
                  ? "mt-9 mb-2 border-b border-rule pb-1 text-2xl"
                  : "mt-6 mb-1 text-xl"
              }
            >
              {block.text}
            </Tag>
          );
        }

        const age = daysBetween(block.bornAt, at);
        const arrived = fresh !== null && block.bornAt > fresh;
        const open = selected === block.hash;

        return (
          <div
            key={key}
            id={`p-${key}`}
            className={`group relative -mx-3 scroll-mt-24 rounded px-3 py-1.5 transition-colors ${
              open
                ? "bg-rubric-wash"
                : arrived
                  ? "rise bg-added-wash"
                  : "hover:bg-paper-sunk"
            }`}
          >
            <span
              aria-hidden
              className={`absolute top-2 bottom-2 -left-1 w-[3px] rounded-full ${ageMark(age)}`}
            />

            <p className={block.kind === "list" ? "pl-5 -indent-5" : ""}>
              {block.kind === "list" && (
                <span className="text-ink-faint">– </span>
              )}
              <Inline nodes={block.nodes} date={article.at} />
              {block.kind === "prose" && block.references === 0 && (
                <sup
                  title="This paragraph carries no reference of its own. An opening paragraph often has none by convention."
                  className="ml-1 font-sans text-[10px] text-ink-faint"
                >
                  no footnote
                </sup>
              )}{" "}
              <button
                type="button"
                onClick={() => onSelect(block.hash)}
                aria-label="Life of this paragraph"
                className={`font-sans text-xs text-ink-faint group-hover:opacity-100 hover:text-rubric focus:opacity-100 [@media(hover:hover)]:opacity-0 ${noted ? "xl:hidden" : ""}`}
              >
                ¶ life
              </button>
            </p>

            {/* On a wide screen the note sits in the margin, where a scribe
                would put it, so showing it moves nothing. */}
            <button
              type="button"
              onClick={() => onSelect(block.hash)}
              className={`absolute top-1.5 left-full ml-5 hidden w-44 text-left font-sans text-[11px] leading-snug wrap-anywhere text-ink-faint hover:text-rubric ${
                noted ? "xl:block" : ""
              } ${
                open
                  ? ""
                  : "opacity-0 group-hover:opacity-100 focus:opacity-100"
              }`}
            >
              written {day(block.bornAt)}
              {block.bornBy ? ` by ${block.bornBy}` : ""}
              {block.bornEditor === "ip" || block.bornEditor === "temp"
                ? " (anonymous)"
                : ""}
              , {span(age)} before this date
              <span className="block text-rubric">
                life of this paragraph →
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
