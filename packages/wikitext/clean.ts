const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&ndash;": "–",
  "&mdash;": "—",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&shy;": "",
  "&thinsp;": " ",
  "&minus;": "−",
  "&times;": "×",
};

/** Removes every [[File:...]] link, which may hold links of its own. */
const dropFiles = (text: string) => {
  const opener = /\[\[(?:tiedosto|kuva|file|image|luokka|category):/gi;
  let result = "";
  let from = 0;

  for (let match = opener.exec(text); match; match = opener.exec(text)) {
    let depth = 0;
    let end = match.index;

    for (; end < text.length; end++) {
      if (text.startsWith("[[", end)) depth++;
      else if (text.startsWith("]]", end) && --depth === 0) break;
    }

    result += text.slice(from, match.index);
    from = Math.min(text.length, end + 2);
    opener.lastIndex = from;
  }

  return result + text.slice(from);
};

/** Removes templates from the inside out, since they nest. */
const dropTemplates = (text: string) => {
  if (!text.includes("{{")) return text;

  for (let i = 0; i < 8; i++) {
    const next = text.replace(/\{\{[^{}]*\}\}/g, "");
    if (next === text) break;
    text = next;
  }

  // Whatever is left was never closed, so the rest of the block is markup.
  const stray = text.indexOf("{{");
  return stray === -1 ? text : text.slice(0, stray);
};

/**
 * Turns one block of wikitext into the plain text a reader sees: links
 * become their words, and references, templates, files and markup go.
 */
export const clean = (wikitext: string): string => {
  let text = wikitext;

  if (text.includes("<")) {
    text = text
      .replace(/<!--[\s\S]*?(-->|$)/g, "")
      .replace(/<ref\b[^>]*\/>/gi, "")
      .replace(/<ref\b[^>]*>[\s\S]*?(<\/ref\s*>|$)/gi, "")
      .replace(
        /<(gallery|math|timeline|source|syntaxhighlight)\b[\s\S]*?(<\/\1\s*>|$)/gi,
        "",
      );
  }

  text = dropTemplates(text);
  if (text.includes("[[")) text = dropFiles(text);

  text = text
    .replace(/\[\[[^\[\]|]*\|([^\[\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\[\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1")
    .replace(/\[https?:\/\/[^\]\s]*\]/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/'{2,}/g, "")
    .replace(/&[a-z]+;/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/^=+\s*(.*?)\s*=+\s*$/, "$1")
    .replace(/^[*#:;]+\s*/, "")
    .replace(/\}\}|\{\{/g, "")
    .replace(/\s+/g, " ");

  return text.trim();
};
