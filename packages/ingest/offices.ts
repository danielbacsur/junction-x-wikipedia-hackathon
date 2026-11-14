/**
 * Builds the bitemporal table of terms of office from the infoboxes of the
 * presidents' articles. Every accepted version is read, its term fields
 * are parsed, and consecutive versions that state the same term become one
 * row whose system time is when wikipedia said it. Safe to run again: both
 * tables are emptied and rebuilt from the revision table, in half a minute.
 *
 *   node offices.ts
 */
import { db } from "@wtt/package-db";

import {
  type Claim,
  type Lifetime,
  type Refusal,
  type Stated,
  collapse,
  officeBox,
  parseBox,
} from "./infobox.ts";

/** The thirteen presidents of Finland, by the page id of their article. */
const PAGES = [
  7650, 11443, 11444, 11445, 11398, 6021, 11446, 1275, 752, 5901, 1187, 1137,
  11396,
];

// A version of these articles is up to 126 KB of wikitext, so they are
// read a few megabytes at a time and only the infobox is kept.
const VERSIONS_AT_ONCE = 200;

type Version = {
  seq: number;
  rev_id: number;
  saved_at: string;
  user: string | null;
  editor: string;
  comment: string | null;
};

const SILENT: Stated = { claims: new Map(), refused: new Map() };

// Most edits leave the infobox alone: 17,845 versions hold under a thousand
// different ones, so each is parsed once.
const parsed = new Map<string, Stated>();

const stated = (wikitext: string) => {
  const box = officeBox(wikitext);
  if (!box) return null;

  const key = JSON.stringify([...box]);
  let found = parsed.get(key);
  if (!found) parsed.set(key, (found = parseBox(box)));

  return found;
};

const counts = {
  read: 0,
  accepted: 0,
  withBox: 0,
  fullyParsed: 0,
  termsRead: 0,
  termsRefused: 0,
};

const terms: { history: unknown[][]; current: unknown[][] } = {
  history: [],
  current: [],
};
const unread: typeof terms = { history: [], current: [] };

/** A statement still made gets no end, so MariaDB keeps it current. */
const file = <Statement>(
  into: typeof terms,
  lifetimes: Lifetime<Version, Statement>[],
  row: (lifetime: Lifetime<Version, Statement>) => unknown[],
) => {
  for (const lifetime of lifetimes) {
    if (lifetime.endedBy) {
      into.history.push([...row(lifetime), lifetime.endedBy.saved_at]);
    } else {
      into.current.push(row(lifetime));
    }
  }
};

const started = performance.now();

for (const pageId of PAGES) {
  const [{ title }] = await db().query<{ title: string }>(
    "SELECT title FROM revision WHERE page_id = ?",
    [pageId],
  );

  const [{ versions }] = await db().query<{ versions: number }>(
    "SELECT COUNT(*) AS versions FROM edit WHERE page_id = ?",
    [pageId],
  );

  const history: { version: Version; stated: Stated }[] = [];

  for (let after = 0; ;) {
    // A version that a standing revert removed within thirty days was
    // never what wikipedia said. That is where "78.3.1856 – 1.3.2012" and
    // the 400th president are: without this the table has 586 rows.
    const rows = await db().query<Version & { text: string }>(
      `SELECT e.seq, e.rev_id, e.saved_at, e.user, e.editor, e.comment, r.text
       FROM edit AS e
       JOIN revision FOR SYSTEM_TIME ALL AS r ON r.rev_id = e.rev_id
       WHERE e.page_id = ? AND e.seq > ? AND e.reverted_by IS NULL
       ORDER BY e.seq
       LIMIT ${VERSIONS_AT_ONCE}`,
      [pageId, after],
    );

    for (const { text, ...version } of rows) {
      const box = stated(text);

      if (box) {
        counts.withBox++;
        counts.fullyParsed += box.refused.size === 0 ? 1 : 0;
        counts.termsRead += box.claims.size;
        counts.termsRefused += box.refused.size;
      }

      history.push({ version, stated: box ?? SILENT });
    }

    if (rows.length < VERSIONS_AT_ONCE) break;
    after = rows.at(-1)!.seq;
  }

  const claims = collapse(
    history.map((entry) => ({
      version: entry.version,
      statements: entry.stated.claims,
    })),
  );
  const refusals = collapse(
    history.map((entry) => ({
      version: entry.version,
      statements: entry.stated.refused,
    })),
  );

  file<Claim>(terms, claims, ({ statement, first, versions }) => [
    pageId,
    title,
    statement.office,
    statement.from,
    statement.to,
    statement.openEnded,
    first.rev_id,
    first.seq,
    first.user,
    first.editor,
    first.comment,
    versions,
    statement.source,
    first.saved_at,
  ]);

  file<Refusal>(unread, refusals, ({ statement, first, versions }) => [
    pageId,
    title,
    statement.office,
    statement.text,
    statement.reason,
    first.rev_id,
    first.user,
    first.comment,
    versions,
    first.saved_at,
  ]);

  counts.read += versions;
  counts.accepted += history.length;

  console.log(
    `${title}: ${history.length.toLocaleString("en")} of ` +
      `${versions.toLocaleString("en")} versions accepted, ` +
      `${claims.length} statements`,
  );
}

const termColumns = `page_id, person, office, valid_from, valid_to, open_ended, rev_id,
  seq, editor, editor_kind, comment, versions, source_text, row_start`;
const unreadColumns = `page_id, person, office, raw_text, reason, rev_id, editor, comment,
  versions, row_start`;

const marks = (count: number) => Array(count).fill("?").join(", ");

await db().session(async (session) => {
  // Lets the loader write row_start and row_end itself, so a statement
  // carries the time wikipedia made it instead of the moment it was loaded.
  await session.query("SET system_versioning_insert_history = 1");

  // One transaction, so a page that asks while the table is rebuilt still
  // gets the old rows and never an empty answer.
  await session.query("START TRANSACTION");

  // MariaDB refuses TRUNCATE on a versioned table. Deleting the current
  // rows turns them into history, and DELETE HISTORY then removes it all.
  for (const table of ["office_term", "office_unparsed"]) {
    await session.query(`DELETE FROM ${table}`);
    await session.query(`DELETE HISTORY FROM ${table}`);
  }

  await session.batch(
    `INSERT INTO office_term (${termColumns}, row_end) VALUES (${marks(15)})`,
    terms.history,
  );
  await session.batch(
    `INSERT INTO office_term (${termColumns}) VALUES (${marks(14)})`,
    terms.current,
  );
  await session.batch(
    `INSERT INTO office_unparsed (${unreadColumns}, row_end) VALUES (${marks(11)})`,
    unread.history,
  );
  await session.batch(
    `INSERT INTO office_unparsed (${unreadColumns}) VALUES (${marks(10)})`,
    unread.current,
  );

  await session.query("COMMIT");
});

const [table] = await db().query<Record<string, number>>(
  `SELECT (SELECT COUNT(*) FROM office_term FOR SYSTEM_TIME ALL) AS statements,
          (SELECT COUNT(*) FROM office_term) AS stated_now,
          (SELECT COUNT(*) FROM office_unparsed FOR SYSTEM_TIME ALL) AS refused`,
);

console.log({
  ...counts,
  ...table,
  seconds: Math.round((performance.now() - started) / 100) / 10,
});

await db().end();
