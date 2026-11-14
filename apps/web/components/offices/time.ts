import type { StatedTerm } from "@wtt/package-engine";

import { LATEST } from "@/lib/format";

/** The line of history the page covers: the republic's first president took office in 1919. */
export const FIRST_DAY = "1919-01-01";
export const LAST_DAY = LATEST.slice(0, 10);

/** The day an infobox first stated a term. Before it the table is silent. */
export const FIRST_SAID = "2006-01-16";

export const PRESIDENT = "Suomen tasavallan presidentti";

const DAY_MS = 86_400_000;

/** A day as a count of days, so a dial can step through them. */
export const dayNumber = (day: string) =>
  Math.round(Date.parse(`${day}T00:00:00Z`) / DAY_MS);

export const dayAt = (count: number) =>
  new Date(count * DAY_MS).toISOString().slice(0, 10);

const clamp = (day: string, first: string, last: string) =>
  day < first ? first : day > last ? last : day;

/** The day of history in the address, or null when it is not one. */
export const readDay = (raw: string | null) => {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  if (Number.isNaN(Date.parse(`${raw}T00:00:00Z`))) return null;

  return clamp(raw, FIRST_DAY, LAST_DAY);
};

/**
 * The Wikipedia date in the address, read the way the engine reads one:
 * "2008" is the last second of 2008, a day is the last second of that day,
 * and nothing or a date past the dataset is the latest version, null.
 */
export const readMoment = (raw: string | null) => {
  const parts =
    /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?(?:[T ](\d{2}):(\d{2}):(\d{2}))?$/.exec(
      raw?.trim() ?? "",
    );
  if (!parts) return null;

  const year = Number(parts[1]);
  const month = parts[2] ? Number(parts[2]) : 12;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const date = parts[3] ? Number(parts[3]) : last;

  if (month < 1 || month > 12 || date < 1 || date > last) return null;

  const time = parts[4] ? `${parts[4]}:${parts[5]}:${parts[6]}` : "23:59:59";
  const pad = (value: number) => String(value).padStart(2, "0");
  const at = `${year}-${pad(month)}-${pad(date)} ${time}`;

  return at >= LATEST ? null : at;
};

/** The shortest way to write a moment in the address. */
export const writeMoment = (at: string) =>
  at.endsWith("-12-31 23:59:59")
    ? at.slice(0, 4)
    : at.endsWith(" 23:59:59")
      ? at.slice(0, 10)
      : at.replace(" ", "T");

/** The last second of a day, which is what "as of that day" means here. */
export const endOf = (day: string) =>
  day >= LAST_DAY ? null : `${day} 23:59:59`;

/** One second before a moment: the Wikipedia an edit was about to change. */
export const justBefore = (at: string) =>
  new Date(Date.parse(`${at.slice(0, 19).replace(" ", "T")}Z`) - 1_000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

/**
 * The statements Wikipedia was making at a moment. This is FOR SYSTEM_TIME
 * AS OF done in the browser: a row counts when its system period holds the
 * moment, and the latest version is the rows that have no end.
 */
export const standingAt = (terms: StatedTerm[], at: string | null) => {
  if (at === null) return terms.filter((term) => term.saidUntil === null);

  // Row times carry microseconds, and a moment without them means .000000.
  const moment = at.length === 19 ? `${at}.000000` : at;

  return terms.filter(
    (term) =>
      term.saidSince <= moment &&
      (term.saidUntil === null || term.saidUntil > moment),
  );
};

/** The stated terms that cover a day. The end is exclusive, as in the table. */
export const holdingOn = (terms: StatedTerm[], day: string) =>
  terms.filter(
    (term) => term.from <= day && (term.to === null || term.to > day),
  );

/** Whether Wikipedia states exactly this term in its latest version. */
export const statedToday = (terms: StatedTerm[], term: StatedTerm) =>
  terms.some(
    (other) =>
      other.saidUntil === null &&
      other.pageId === term.pageId &&
      other.office === term.office &&
      other.from === term.from &&
      other.to === term.to,
  );

/**
 * The statement that answers the two dials, written out here so it can
 * follow them without a request. The engine's whoHeld runs the same FROM
 * and WHERE with more columns, and the page shows that one as MariaDB ran
 * it whenever the dials come to rest.
 */
export const holderSql = (day: string, at: string | null) =>
  [
    "SELECT person, valid_from, valid_to,",
    "       rev_id, row_start AS said_since",
    "FROM office_term",
    ...(at ? [`  FOR SYSTEM_TIME AS OF TIMESTAMP '${at}'`] : []),
    `WHERE office IN ('${PRESIDENT}',`,
    `                 '${PRESIDENT} (vt.)')`,
    `  AND valid_from <= DATE '${day}'`,
    `  AND valid_to > DATE '${day}';`,
  ].join("\n");
