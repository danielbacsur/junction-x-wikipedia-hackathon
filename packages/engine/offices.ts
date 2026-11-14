import { db } from "@wtt/package-db";

import { type Shown, show } from "./sql.ts";
import { LAST_EDIT, asOf, moment, when } from "./time.ts";

/** The offices the table holds, by the name a person would type. */
export const OFFICES = {
  president: "Suomen tasavallan presidentti",
  "prime minister": "Suomen pääministeri",
  regent: "Suomen valtionhoitaja",
} as const;

/** An acting holder's office ends in this, as the infoboxes remark "vt.". */
const ACTING = " (vt.)";

/** The office as the infoboxes name it, from that name or an English one. */
const officeNamed = (input: string) => {
  const wanted = input.trim().toLowerCase();

  for (const [english, finnish] of Object.entries(OFFICES)) {
    if (wanted === english || wanted === finnish.toLowerCase()) return finnish;
  }

  return null;
};

/**
 * A day of history as MariaDB reads a date. Unlike a Wikipedia date it has
 * to be a whole day: "1925" is not a day somebody held an office on.
 */
const dayOf = (input: string) => {
  const parts = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(input.trim());
  const [year, month, day] = (parts ?? []).slice(1).map(Number);

  if (
    !parts ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate()
  ) {
    throw new Error(`"${input}" is not a date: a day is written 1925-03-01`);
  }

  return `${parts[1]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export type StatedTerm = {
  /** The article that makes the statement, and its title. */
  pageId: number;
  person: string;
  office: string;
  acting: boolean;

  /** The stated first day in office. */
  from: string;

  /**
   * The stated end, exclusive: the handover day belongs to the successor.
   * Null while the article says the holder is still in office.
   */
  to: string | null;

  /** The version that first said it, and who saved that version. */
  revId: number;
  url: string;
  editor: string | null;
  editorKind: string;
  comment: string | null;

  /** How long Wikipedia said it. Null while it still does. */
  saidSince: string;
  saidUntil: string | null;

  /** Accepted versions that repeated it, and the field as first written. */
  versions: number;
  sourceText: string;
};

type TermRow = {
  page_id: number;
  person: string;
  office: string;
  valid_from: string;
  valid_to: string | null;
  rev_id: number;
  editor: string | null;
  editor_kind: string;
  comment: string | null;
  said_since: string;
  said_until: string | null;
  versions: number;
  source_text: string;
};

// A period column cannot be NULL, so a term still running is stored as
// ending on 9999-12-31, and a row still current ends at the last moment a
// timestamp can hold. Both are turned back into "no end" here.
const TERM = `page_id, person, office, valid_from,
            IF(open_ended, NULL, valid_to) AS valid_to,
            rev_id, editor, editor_kind, comment, row_start AS said_since,
            IF(row_end > NOW(6), NULL, row_end) AS said_until,
            versions, source_text`;

const term = (row: TermRow): StatedTerm => ({
  pageId: row.page_id,
  person: row.person,
  office: row.office,
  acting: row.office.endsWith(ACTING),
  from: row.valid_from,
  to: row.valid_to,
  revId: row.rev_id,
  url: `https://fi.wikipedia.org/?oldid=${row.rev_id}`,
  editor: row.editor,
  editorKind: row.editor_kind,
  comment: row.comment,
  saidSince: row.said_since,
  saidUntil: row.said_until,
  versions: row.versions,
  sourceText: row.source_text,
});

export type Holding = {
  office: string;
  day: string;

  /** The moment of Wikipedia that was asked, or null for the latest. */
  at: string | null;

  /**
   * Usually one. None when no article claims the day, two when two
   * articles do, or when one states an acting holder beside the president.
   */
  holders: StatedTerm[];
  sql: Shown[];
};

/**
 * Who held an office on a day, according to Wikipedia as it stood on a
 * date. Both timelines are in one statement: the day is compared with the
 * stated term, and FOR SYSTEM_TIME picks the Wikipedia that is asked.
 * Valid time has no clause of its own, so that side is two comparisons.
 */
export const whoHeld = async (
  office: string,
  day: string,
  date?: string | null,
): Promise<Holding | null> => {
  const named = officeNamed(office);
  if (!named) return null;

  const database = db().traced();
  const on = dayOf(day);
  const at = moment(date);

  const rows = await database.query<TermRow>(
    `SELECT ${TERM}
     FROM office_term ${asOf(at)}
     WHERE office IN (?, ?)
       AND valid_from <= DATE ? AND valid_to > DATE ?
     ORDER BY office, valid_from`,
    [...when(at), named, named + ACTING, on, on],
  );

  return {
    office: named,
    day: on,
    at,
    holders: rows.map(term),
    sql: database.statements.map(show),
  };
};

/** The holders of an office with their terms, as Wikipedia stated them on a date. */
export const listTerms = async (
  office: string,
  date?: string | null,
): Promise<{
  office: string;
  at: string | null;
  terms: StatedTerm[];
  sql: Shown[];
} | null> => {
  const named = officeNamed(office);
  if (!named) return null;

  const database = db().traced();
  const at = moment(date);

  const rows = await database.query<TermRow>(
    `SELECT ${TERM}
     FROM office_term ${asOf(at)}
     WHERE office IN (?, ?)
     ORDER BY valid_from, office`,
    [...when(at), named, named + ACTING],
  );

  return {
    office: named,
    at,
    terms: rows.map(term),
    sql: database.statements.map(show),
  };
};

/**
 * Every statement Wikipedia ever made about an office, each with the
 * stretch of time it was made. The table is small enough to hand over
 * whole, and a page that holds it can answer any day as of any date
 * without asking again.
 */
export const termHistory = async (
  office: string,
): Promise<{ office: string; terms: StatedTerm[]; sql: Shown[] } | null> => {
  const named = officeNamed(office);
  if (!named) return null;

  const database = db().traced();

  const rows = await database.query<TermRow>(
    `SELECT ${TERM}
     FROM office_term FOR SYSTEM_TIME ALL
     WHERE office IN (?, ?)
     ORDER BY row_start, valid_from`,
    [named, named + ACTING],
  );

  return {
    office: named,
    terms: rows.map(term),
    sql: database.statements.map(show),
  };
};

export type TermChange = {
  at: string;
  pageId: number;
  person: string;
  office: string;
  what: "start" | "end" | "start and end" | "term closed";
  before: { from: string; to: string | null };
  after: { from: string; to: string | null };

  /** Where the change led, measured against what Wikipedia states today. */
  verdict: "to today's value" | "away from today's value" | "between";

  /** How long the new value stood. Null while it still does. */
  stoodDays: number | null;

  /** Whether the old value was put straight back afterwards. */
  putBack: boolean;
  editor: string | null;
  editorKind: string;
  revId: number;
  url: string;
  comment: string | null;
};

/**
 * Every time Wikipedia replaced a stated start or end of a term with
 * another. A statement's system period ends at the instant another
 * statement about overlapping days begins in the same article, and the
 * version that begins it is the edit that changed the date.
 *
 * It is a lower bound: a term that vanished for a while and came back
 * different is not paired, and neither is a replacement about entirely
 * different days.
 */
export const termChanges = async (
  office?: string | null,
): Promise<{ changes: TermChange[]; sql: Shown[] } | null> => {
  const named = office ? officeNamed(office) : undefined;
  if (named === null) return null;

  const database = db().traced();

  const rows = await database.query<{
    changed_at: string;
    page_id: number;
    person: string;
    office: string;
    what_changed: TermChange["what"];
    from_before: string;
    to_before: string | null;
    from_after: string;
    to_after: string | null;
    verdict: TermChange["verdict"];
    stood_days: number | null;
    put_back: number;
    editor: string | null;
    editor_kind: string;
    rev_id: number;
    comment: string | null;
  }>(
    `SELECT b.row_start AS changed_at, a.page_id, a.person, a.office,
            CASE WHEN a.open_ended AND NOT b.open_ended AND a.valid_from = b.valid_from THEN 'term closed'
                 WHEN a.valid_from <> b.valid_from AND a.valid_to <> b.valid_to THEN 'start and end'
                 WHEN a.valid_from <> b.valid_from THEN 'start'
                 ELSE 'end' END AS what_changed,
            a.valid_from AS from_before, IF(a.open_ended, NULL, a.valid_to) AS to_before,
            b.valid_from AS from_after, IF(b.open_ended, NULL, b.valid_to) AS to_after,
            CASE WHEN today_after.rev_id IS NOT NULL THEN 'to today''s value'
                 WHEN today_before.rev_id IS NOT NULL THEN 'away from today''s value'
                 ELSE 'between' END AS verdict,
            IF(b.row_end > NOW(6), NULL,
               ROUND(TIMESTAMPDIFF(SECOND, b.row_start, b.row_end) / 86400, 2)) AS stood_days,
            back.rev_id IS NOT NULL AS put_back,
            b.editor, b.editor_kind, b.rev_id, b.comment
     FROM office_term FOR SYSTEM_TIME ALL AS a
     JOIN office_term FOR SYSTEM_TIME ALL AS b
       ON b.page_id = a.page_id AND b.office = a.office
      AND b.row_start = a.row_end
      AND a.valid_from < b.valid_to AND b.valid_from < a.valid_to
     LEFT JOIN office_term AS today_after
       ON today_after.page_id = b.page_id AND today_after.office = b.office
      AND today_after.valid_from = b.valid_from AND today_after.valid_to = b.valid_to
     LEFT JOIN office_term AS today_before
       ON today_before.page_id = a.page_id AND today_before.office = a.office
      AND today_before.valid_from = a.valid_from AND today_before.valid_to = a.valid_to
     LEFT JOIN office_term FOR SYSTEM_TIME ALL AS back
       ON back.page_id = a.page_id AND back.office = a.office
      AND back.row_start = b.row_end
      AND back.valid_from = a.valid_from AND back.valid_to = a.valid_to
     ${named ? "WHERE a.office IN (?, ?)" : ""}
     ORDER BY changed_at, a.valid_from`,
    named ? [named, named + ACTING] : [],
  );

  return {
    changes: rows.map((row) => ({
      at: row.changed_at,
      pageId: row.page_id,
      person: row.person,
      office: row.office,
      what: row.what_changed,
      before: { from: row.from_before, to: row.to_before },
      after: { from: row.from_after, to: row.to_after },
      verdict: row.verdict,
      stoodDays: row.stood_days,
      putBack: row.put_back === 1,
      editor: row.editor,
      editorKind: row.editor_kind,
      revId: row.rev_id,
      url: `https://fi.wikipedia.org/?oldid=${row.rev_id}`,
      comment: row.comment,
    })),
    sql: database.statements.map(show),
  };
};

export type TermGap = {
  outgoing: string;
  statedEnd: string;
  incoming: string;
  statedStart: string;

  /** Days no article claims. */
  days: number;

  /** When the two statements that leave the gap first stood together. */
  firstSaid: string;

  /** The first and last year whose end showed the gap. */
  firstYear: number;
  lastYear: number;
};

export type TermOverlap = {
  one: { person: string; from: string; to: string | null };
  other: { person: string; from: string; to: string | null };

  /** Days both articles claim. Null when both terms are still running. */
  days: number | null;
  from: string;
  seconds: number;
};

/**
 * Where the articles disagree with each other about one office: handovers
 * that leave days nobody claims, and stretches two articles claimed at
 * once. No constraint could have kept these out without refusing real
 * history, so they are found by asking.
 */
export const termConflicts = async (
  office: string,
): Promise<{
  office: string;
  gaps: TermGap[];
  overlaps: TermOverlap[];
  sql: Shown[];
} | null> => {
  const named = officeNamed(office);
  if (!named) return null;

  const database = db().traced();

  // FOR SYSTEM_TIME AS OF takes one moment. To ask the end of every year
  // at once, the years come from MariaDB's sequence engine and each one is
  // joined to the rows whose system period holds it.
  const gaps = await database.query<{
    outgoing: string;
    stated_end: string;
    incoming: string;
    stated_start: string;
    days: number;
    first_said: string;
    first_year: number;
    last_year: number;
  }>(
    `WITH snapshot AS (
       SELECT y.seq AS year, o.person, o.valid_from, o.row_start,
              LAG(o.person) OVER w AS previous,
              LAG(o.valid_to) OVER w AS previous_to,
              LAG(o.row_start) OVER w AS previous_start
       FROM seq_2006_to_${LAST_EDIT.slice(0, 4)} AS y
       JOIN office_term FOR SYSTEM_TIME ALL AS o
         ON o.row_start <= TIMESTAMP(CONCAT(y.seq, '-12-31 23:59:59'))
        AND o.row_end > TIMESTAMP(CONCAT(y.seq, '-12-31 23:59:59'))
       WHERE o.office = ?
       WINDOW w AS (PARTITION BY y.seq ORDER BY o.valid_from, o.valid_to))
     SELECT previous AS outgoing, previous_to AS stated_end,
            person AS incoming, valid_from AS stated_start,
            DATEDIFF(valid_from, previous_to) AS days,
            MIN(GREATEST(row_start, previous_start)) AS first_said,
            MIN(year) AS first_year, MAX(year) AS last_year
     FROM snapshot
     WHERE valid_from > previous_to
     GROUP BY outgoing, stated_end, incoming, stated_start
     ORDER BY stated_start, first_year`,
    [named],
  );

  // The bitemporal join: two articles, valid periods that intersect, and
  // system periods that intersect.
  const overlaps = await database.query<{
    one: string;
    one_from: string;
    one_to: string | null;
    other: string;
    other_from: string;
    other_to: string | null;
    days: number | null;
    both_from: string;
    seconds: number;
  }>(
    `SELECT a.person AS one, a.valid_from AS one_from,
            IF(a.open_ended, NULL, a.valid_to) AS one_to,
            b.person AS other, b.valid_from AS other_from,
            IF(b.open_ended, NULL, b.valid_to) AS other_to,
            IF(a.open_ended AND b.open_ended, NULL,
               DATEDIFF(LEAST(a.valid_to, b.valid_to),
                        GREATEST(a.valid_from, b.valid_from))) AS days,
            GREATEST(a.row_start, b.row_start) AS both_from,
            TIMESTAMPDIFF(SECOND, GREATEST(a.row_start, b.row_start),
                          LEAST(a.row_end, b.row_end, NOW(6))) AS seconds
     FROM office_term FOR SYSTEM_TIME ALL AS a
     JOIN office_term FOR SYSTEM_TIME ALL AS b
       ON b.office = a.office AND b.page_id <> a.page_id
      AND (a.valid_from < b.valid_from
           OR (a.valid_from = b.valid_from AND a.page_id < b.page_id))
      AND a.valid_from < b.valid_to AND b.valid_from < a.valid_to
      AND a.row_start < b.row_end AND b.row_start < a.row_end
     WHERE a.office = ?
     ORDER BY both_from`,
    [named],
  );

  return {
    office: named,
    gaps: gaps.map((row) => ({
      outgoing: row.outgoing,
      statedEnd: row.stated_end,
      incoming: row.incoming,
      statedStart: row.stated_start,
      days: row.days,
      firstSaid: row.first_said,
      firstYear: row.first_year,
      lastYear: row.last_year,
    })),
    overlaps: overlaps.map((row) => ({
      one: { person: row.one, from: row.one_from, to: row.one_to },
      other: { person: row.other, from: row.other_from, to: row.other_to },
      days: row.days,
      from: row.both_from,
      seconds: row.seconds,
    })),
    sql: database.statements.map(show),
  };
};
