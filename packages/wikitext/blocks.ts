/**
 * What a block of wikitext is, decided from how it starts. Only prose and
 * list items carry claims worth searching; the rest is kept so an article
 * can be rebuilt exactly.
 */
export type Kind =
  | "prose"
  | "list"
  | "heading"
  | "table"
  | "template"
  | "file"
  | "meta"
  | "markup";

export type Block = {
  /** The exact wikitext, one line or several when markup spans lines. */
  text: string;

  /** How many empty lines came right before it. */
  gap: number;

  kind: Kind;
};

export type Split = {
  blocks: Block[];

  /** How many empty lines end the text, after the last block. */
  tail: number;
};

// A block may not swallow the rest of an article because somebody forgot
// to close a template, so it is cut off at this size.
const MAX_LINES = 400;
const MAX_CHARS = 60_000;

const count = (line: string, pattern: RegExp) => {
  let found = 0;
  pattern.lastIndex = 0;
  while (pattern.test(line)) found++;
  return found;
};

const OPENERS = /\{\{/g;
const CLOSERS = /\}\}/g;
const REF_OPEN = /<ref\b[^>]*>/gi;
const REF_SELF = /<ref\b[^>]*\/>/gi;
const REF_CLOSE = /<\/ref\s*>/gi;
const COMMENT_OPEN = /<!--/g;
const COMMENT_CLOSE = /-->/g;
const TAG_OPEN =
  /<(nowiki|pre|math|gallery|source|syntaxhighlight|timeline)\b[^>]*>/gi;
const TAG_SELF =
  /<(nowiki|pre|math|gallery|source|syntaxhighlight|timeline)\b[^>]*\/>/gi;
const TAG_CLOSE =
  /<\/(nowiki|pre|math|gallery|source|syntaxhighlight|timeline)\s*>/gi;

const HEADING = /^=+[^=].*=+\s*$/;
const FILE = /^\[\[(tiedosto|kuva|file|image):/i;
const META =
  /^(\[\[(luokka|category):|\[\[[a-z-]{2,12}:[^\]]*\]\]\s*$|\{\{(aakkostus|defaultsort)\b)/i;

/** How far a line opens or closes markup that can span lines. */
const depthChange = (line: string) => {
  // Most lines hold none of this, and checking is far cheaper than counting.
  if (!line.includes("{{") && !line.includes("}}") && !line.includes("<")) {
    return 0;
  }

  return (
    count(line, OPENERS) -
    count(line, CLOSERS) +
    (count(line, REF_OPEN) - count(line, REF_SELF)) -
    count(line, REF_CLOSE) +
    count(line, COMMENT_OPEN) -
    count(line, COMMENT_CLOSE) +
    (count(line, TAG_OPEN) - count(line, TAG_SELF)) -
    count(line, TAG_CLOSE)
  );
};

const kindOf = (text: string, inTable: boolean): Kind => {
  const start = text.trimStart();

  if (HEADING.test(text) && !text.includes("\n")) return "heading";
  if (/^(\{\||\|\}|\|-|\|\+)/.test(start)) return "table";
  if (inTable && /^[|!]/.test(start)) return "table";
  if (FILE.test(start)) return "file";
  if (META.test(start)) return "meta";
  if (/^[*#:;]/.test(start)) return "list";
  if (/^(\{\{|\}\}|\|)/.test(start)) return "template";
  if (/^(<|__)/.test(start)) return "markup";

  return "prose";
};

/**
 * Cuts wikitext into blocks. A block is one line, which is what a paragraph,
 * a heading or a list item is in wikitext, or several lines while a
 * template, a reference or a comment is still open. Nothing is thrown away:
 * joinBlocks gives back the exact text.
 */
export const splitBlocks = (wikitext: string): Split => {
  const blocks: Block[] = [];
  const lines = wikitext.split("\n");

  let gap = 0;
  let open: string[] | undefined;
  let chars = 0;
  let depth = 0;
  let inTable = false;

  const close = () => {
    if (!open) return;

    const text = open.length === 1 ? open[0] : open.join("\n");
    const kind = kindOf(text, inTable);
    const start = text.trimStart();

    if (start.startsWith("{|")) inTable = true;
    else if (start.startsWith("|}")) inTable = false;

    blocks.push({ text, gap, kind });
    open = undefined;
    gap = 0;
    depth = 0;
    chars = 0;
  };

  for (const line of lines) {
    if (!open) {
      if (line === "") {
        gap++;
        continue;
      }

      open = [line];
    } else {
      // A heading always starts a new block, whatever was left open above.
      if (HEADING.test(line)) {
        close();
        open = [line];
      } else {
        open.push(line);
      }
    }

    chars += line.length;
    depth = Math.max(0, depth + depthChange(line));

    if (depth === 0 || open.length >= MAX_LINES || chars >= MAX_CHARS) close();
  }

  close();

  return { blocks, tail: gap };
};

/** The exact inverse of splitBlocks. */
export const joinBlocks = ({ blocks, tail }: Split): string => {
  const lines: string[] = [];

  for (const block of blocks) {
    for (let i = 0; i < block.gap; i++) lines.push("");
    lines.push(block.text);
  }

  for (let i = 0; i < tail; i++) lines.push("");

  return lines.join("\n");
};
