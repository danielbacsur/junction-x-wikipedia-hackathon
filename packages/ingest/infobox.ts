/**
 * Reads the terms of office an article's infobox states. Finnish
 * Wikipedia's {{Hallitsija}} (2006) and {{Valtionjohto}} (from 2007) pair
 * `arvo` / `arvoN`, the office, with `virassa` / `virassaN`, the term. The
 * term was written four ways over the years:
 *
 *   [[1. maaliskuuta|1.3.]] [[1956]]–[[27. tammikuuta|27.1.]] [[1982]]
 *   [[4. elokuuta]] [[1944]] – [[11. maaliskuuta]] [[1946]]
 *   1.3.1956 – 27.1.1982
 *   1.3.2012 –   or   1.3.2000 alkaen          still in office
 *
 * Nothing here guesses. A field that does not read as one of these is
 * refused with the reason and never repaired.
 */

export const PRESIDENT = "Suomen tasavallan presidentti";
export const PRIME_MINISTER = "Suomen pääministeri";
export const REGENT = "Suomen valtionhoitaja";

/** What an acting holder's office ends in, after the infobox remark "vt.". */
export const ACTING = " (vt.)";

/** A period column cannot be NULL, so "still in office" ends on this day. */
export const OPEN_END = "9999-12-31";

export type Term = {
  from: string;

  /** The stated last day, exclusive: the successor's first day. */
  to: string;
  openEnded: boolean;

  /** What the words in front of the range say it is. */
  remark: "regent" | "acting" | null;
};

export type Claim = {
  office: string;
  from: string;
  to: string;
  openEnded: boolean;

  /** The infobox field as written. */
  source: string;
};

export type Refusal = { office: string; text: string; reason: string };

/** What one infobox states, each statement under the key that identifies it. */
export type Stated = {
  claims: Map<string, Claim>;
  refused: Map<string, Refusal>;
};

const MONTHS = [
  "tammikuu",
  "helmikuu",
  "maaliskuu",
  "huhtikuu",
  "toukokuu",
  "kesäkuu",
  "heinäkuu",
  "elokuu",
  "syyskuu",
  "lokakuu",
  "marraskuu",
  "joulukuu",
];

// JavaScript's \b only knows the letters of English, so "presidenttiä"
// would end at its last i. These are a word boundary that knows ä and ö.
const NOT_AFTER_WORD = "(?<![\\p{L}\\p{N}_])";
const NOT_BEFORE_WORD = "(?![\\p{L}\\p{N}_])";

const MONTH_NAME = new RegExp(
  `(\\d{1,2})\\.\\s*(${MONTHS.join("|")})(?:ta|n)?${NOT_BEFORE_WORD}\\s*`,
  "giu",
);

const DATE = "(\\d{1,2})\\.\\s*(\\d{1,2})\\.\\s*(\\d{4})";

// En dash, em dash, minus sign, hyphen, figure dash or a plain hyphen:
// editors used every one of them between two dates.
const DASH = "\\s*[\\u2013\\u2014\\u2212\\u2010\\u2012-]+\\s*";

// A start and an end, a start that is still open, or "27.5. – 12.12.1918",
// where the start borrows the year of the end.
const RANGE = new RegExp(
  `${DATE}(?:${DASH}(?:${DATE})?|\\s+(?:alkaen|lähtien)${NOT_BEFORE_WORD})` +
    `|(?<![\\d.])(?<d0>\\d{1,2})\\.\\s*(?<m0>\\d{1,2})\\.${DASH}` +
    `(?<d1>\\d{1,2})\\.\\s*(?<m1>\\d{1,2})\\.\\s*(?<y1>\\d{4})`,
  "gu",
);

const YEAR_RANGE = new RegExp(
  `(?<![\\d.])(\\d{4})${DASH}(\\d{4})?(?![\\d.])`,
  "gu",
);

const REMARK = /\([^()]*\)/g;
const ACTING_LABEL = new RegExp(`${NOT_AFTER_WORD}vt${NOT_BEFORE_WORD}`, "u");

const PRESIDENT_TITLE = new RegExp(
  `${NOT_AFTER_WORD}(suomen|tasavallan)\\s+(\\d+\\.\\s*)?presidentti${NOT_BEFORE_WORD}`,
  "u",
);
const PRIME_MINISTER_TITLE = new RegExp(
  `(?<![a-zåäö])pääministeri${NOT_BEFORE_WORD}`,
  "u",
);

const OFFICE_FIELD = /\|\s*virassa\d*\s*=/;
const KEPT = /^(?:arvo|virassa)\d*$/;

/** A link becomes its label, because that is what the reader saw. */
const stripLinks = (text: string) =>
  text.replace(/\[\[(?:[^[\]|]*\|)?([^[\]|]*)\]\]/g, "$1");

/** The wikitext of one field as plain text, with every date as D.M.YYYY. */
export const normalize = (value: string) =>
  stripLinks(
    value
      .replace(/<!--.*?-->/gs, " ")
      .replace(/<ref[^>]*\/>/g, " ")
      .replace(/<ref[^>]*>.*?<\/ref>/gs, " ")
      // A reference nobody closed swallows the rest of the field.
      .replace(/<ref[^>]*>.*/gs, " ")
      .replaceAll("&nbsp;", " ")
      .replaceAll("&ndash;", "–")
      .replaceAll("&mdash;", "–")
      .replaceAll(" ", " "),
  )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{|\}\}|\|/g, "\n")
    .replaceAll("'''", "")
    .replaceAll("''", "")
    .replace(
      MONTH_NAME,
      (_, day: string, month: string) =>
        `${day}.${MONTHS.indexOf(month.toLowerCase()) + 1}.`,
    )
    .replace(/[ \t]+/g, " ")
    .trim();

/**
 * Which of the three offices we load a title names. Every other title,
 * speakers and ministers among them, returns null.
 */
export const officeOf = (title: string) => {
  const text = stripLinks(title.replace(/<[^>]+>/g, " "))
    .toLowerCase()
    .replace(/\s+/g, " ");

  // "Suomen valtionhoitaja<br>Suomen 6. presidentti" is the presidency: the
  // range that carries no label of its own in that field is the president's.
  if (PRESIDENT_TITLE.test(text) && !text.includes("oikeuden")) {
    return PRESIDENT;
  }
  if (text.includes("valtionhoitaja")) return REGENT;
  if (PRIME_MINISTER_TITLE.test(text)) return PRIME_MINISTER;

  return null;
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const leap = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const pad = (value: number) => String(value).padStart(2, "0");

/** The day as MariaDB reads a date, or null when the calendar has no such day. */
const calendarDay = (day: string, month: string, year: string) => {
  const [d, m, y] = [Number(day), Number(month), Number(year)];
  const last = m === 2 && leap(y) ? 29 : DAYS_IN_MONTH[m - 1];

  if (y < 1 || m < 1 || m > 12 || d < 1 || d > last) return null;

  return `${year}-${pad(m)}-${pad(d)}`;
};

const plausible = (day: string) => {
  const year = Number(day.slice(0, 4));

  return year >= 1800 && year <= 2100;
};

/**
 * The terms one field states, and what in it could not be read. The words
 * in front of a range can say what it is: "vt." makes it an acting term and
 * "valtionhoitajana" a regency. A range inside a parenthesis that says
 * neither is a remark, and is refused.
 */
export const parseTerms = (value: string) => {
  const text = normalize(value);
  const terms: Term[] = [];
  const refused: { text: string; reason: string }[] = [];

  if (!text) return { terms, refused };

  const remarks = [...text.matchAll(REMARK)].map((match) => ({
    from: match.index,
    to: match.index + match[0].length,
    text: match[0],
  }));

  let rest = text;
  let lastEnd = 0;

  for (const match of text.matchAll(RANGE)) {
    const end = match.index + match[0].length;
    const segment = match[0].trim();
    const label = text.slice(lastEnd, match.index).toLowerCase();
    const inside = remarks.find(
      (remark) => remark.from <= match.index && match.index < remark.to,
    );
    const groups = match.groups!;

    rest = rest.replace(segment, () => " ");
    lastEnd = end;

    const remark = label.includes("valtionhoitaja")
      ? "regent"
      : ACTING_LABEL.test(label)
        ? "acting"
        : null;

    if (inside && remark === null) {
      refused.push({ text: inside.text, reason: "range inside a remark" });
      continue;
    }

    let from: string | null;
    let to: string | null;
    let openEnded = false;

    if (groups.d0) {
      from = calendarDay(groups.d0, groups.m0, groups.y1);
      to = calendarDay(groups.d1, groups.m1, groups.y1);
    } else if (match[4]) {
      from = calendarDay(match[1], match[2], match[3]);
      to = calendarDay(match[4], match[5], match[6]);
    } else {
      // "1.3.1956 – tammikuu 1982" has an end, only not one we can read.
      const tail = text.slice(end).split("\n", 1)[0].replace(REMARK, " ");

      if (/\d/.test(tail)) {
        refused.push({
          text: (segment + tail).trim(),
          reason: "end date not understood",
        });
        continue;
      }

      from = calendarDay(match[1], match[2], match[3]);
      to = OPEN_END;
      openEnded = true;
    }

    if (from === null || to === null) {
      refused.push({ text: segment, reason: "not a calendar date" });
    } else if (!plausible(from) || (!openEnded && !plausible(to))) {
      refused.push({ text: segment, reason: "year out of range" });
    } else if (from >= to) {
      refused.push({ text: segment, reason: "end not after start" });
    } else if (
      !terms.some(
        (term) =>
          term.from === from && term.to === to && term.remark === remark,
      )
    ) {
      terms.push({ from, to, openEnded, remark });
    }
  }

  for (const years of rest.replace(REMARK, " ").matchAll(YEAR_RANGE)) {
    refused.push({ text: years[0].trim(), reason: "years only, no day" });
  }

  if (terms.length === 0 && refused.length === 0 && /\d/.test(text)) {
    refused.push({ text: text.slice(0, 200), reason: "no date range found" });
  }

  return { terms, refused };
};

/** Everything one infobox states about the offices we load. */
export const parseBox = (fields: Map<string, string>): Stated => {
  const claims = new Map<string, Claim>();
  const refused = new Map<string, Refusal>();

  const refuse = (office: string, text: string, reason: string) => {
    const clipped = text.slice(0, 200);
    refused.set([office, clipped, reason].join("\n"), {
      office,
      text: clipped,
      reason,
    });
  };

  for (const [name, title] of fields) {
    if (!name.startsWith("arvo")) continue;

    const office = officeOf(title);
    if (office === null) continue;

    const field = (fields.get(`virassa${name.slice(4)}`) ?? "").trim();
    const { terms, refused: unread } = parseTerms(field);

    for (const term of terms) {
      const stated =
        term.remark === "regent"
          ? REGENT
          : term.remark === "acting"
            ? office + ACTING
            : office;
      const key = [stated, term.from, term.to].join("\n");

      if (!claims.has(key)) {
        claims.set(key, {
          office: stated,
          from: term.from,
          to: term.to,
          openEnded: term.openEnded,
          source: field.slice(0, 600),
        });
      }
    }

    for (const { text, reason } of unread) refuse(office, text, reason);

    if (terms.length === 0 && unread.length === 0) {
      refuse(office, field, "term field empty");
    }
  }

  return { claims, refused };
};

/** The body of every template that is not inside another, in order. */
function* topTemplates(text: string) {
  let depth = 0;
  let start = -1;

  for (const brace of text.matchAll(/\{\{|\}\}/g)) {
    if (brace[0] === "{{") {
      if (depth === 0) start = brace.index;
      depth++;
    } else if (depth > 0) {
      depth--;
      if (depth === 0) yield text.slice(start + 2, brace.index);
    }
  }
}

/** A template's named parameters. A pipe inside a link or template is text. */
const parameters = (body: string) => {
  const parts: string[] = [];
  let templates = 0;
  let links = 0;
  let from = 0;

  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);

    if (two === "{{") templates++;
    else if (two === "}}") templates--;
    else if (two === "[[") links++;
    else if (two === "]]") links--;
    else {
      if (body[i] === "|" && templates <= 0 && links <= 0) {
        parts.push(body.slice(from, i));
        from = i + 1;
      }
      continue;
    }

    i++;
  }

  parts.push(body.slice(from));

  const named = new Map<string, string>();

  // The first part is the template's name. A parameter given twice keeps
  // its first value, which is not what MediaWiki shows, but it is what the
  // experiment measured and it never decides a date here.
  for (const part of parts.slice(1)) {
    const equals = part.indexOf("=");
    if (equals === -1) continue;

    const name = part.slice(0, equals).trim().toLowerCase();
    if (name && !named.has(name))
      named.set(name, part.slice(equals + 1).trim());
  }

  return named;
};

/**
 * The office and term fields of an article's office infobox: the first
 * top-level template with a `virassa` field, whatever it is called. Null
 * when the version has none.
 */
export const officeBox = (wikitext: string): Map<string, string> | null => {
  // Most versions before 2006 have no such field anywhere.
  if (!wikitext.includes("virassa")) return null;

  for (const body of topTemplates(wikitext)) {
    if (!OFFICE_FIELD.test(body)) continue;

    return new Map([...parameters(body)].filter(([name]) => KEPT.test(name)));
  }

  return null;
};

export type Lifetime<Version, Statement> = {
  statement: Statement;

  /** The version that first made the statement. */
  first: Version;

  /** How many versions in a row repeated it. */
  versions: number;

  /** The first version that no longer made it, or null while it stands. */
  endedBy: Version | null;
};

/**
 * Turns what each version states into the lifetimes of the statements. A
 * lifetime opens at the version where a statement first appears and closes
 * at the first version that no longer makes it, so rewriting a field
 * without changing its dates closes nothing.
 */
export const collapse = <Version, Statement>(
  history: { version: Version; statements: Map<string, Statement> }[],
) => {
  const open = new Map<string, Lifetime<Version, Statement>>();
  const closed: Lifetime<Version, Statement>[] = [];

  for (const { version, statements } of history) {
    for (const [key, lifetime] of open) {
      if (statements.has(key)) continue;

      closed.push({ ...lifetime, endedBy: version });
      open.delete(key);
    }

    for (const [key, statement] of statements) {
      const lifetime = open.get(key);

      if (lifetime) lifetime.versions++;
      else {
        open.set(key, {
          statement,
          first: version,
          versions: 1,
          endedBy: null,
        });
      }
    }
  }

  return [...closed, ...open.values()];
};
