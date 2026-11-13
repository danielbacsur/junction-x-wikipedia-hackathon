/**
 * Loads every saved version of the history of finland articles into the
 * system-versioned revision table, each with the time it was saved on
 * wikipedia. Safe to run again: articles already loaded are skipped.
 *
 *   node revisions.ts                 all 16 files, four at a time
 *   node revisions.ts 01 02           only those files
 */
import { readdir } from "node:fs/promises";

import { db } from "@wtt/package-db";

import { dataDir, progress, read } from "./parquet.ts";

type Version = [
  pageId: number,
  title: string,
  revId: number,
  parentId: number | null,
  savedAt: bigint | number, // microseconds since 1970, UTC
  user: string | null,
  anonymous: boolean,
  comment: string | null,
  minor: boolean,
  sha1: string | null,
  bytes: number,
  text: string,
];

const FILES_AT_ONCE = 4;
const FLUSH_BYTES = 16_000_000;

/** Microseconds since 1970 as the timestamp text MariaDB reads. */
export const sqlTime = (micros: number) => {
  const iso = new Date(Math.floor(micros / 1_000)).toISOString();
  const fraction = String(micros % 1_000_000).padStart(6, "0");

  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}.${fraction}`;
};

const loaded = new Set(
  (await db().query<{ page_id: number }>("SELECT page_id FROM revision")).map(
    (row) => row.page_id,
  ),
);

const tick = progress("versions");
let versionsDone = 0;

const loadFile = async (file: string) => {
  const rows = read<Version>(
    `SELECT page_id, title, rev_id, parent_id, epoch_us(timestamp), "user",
            anonymous, comment, minor, sha1, bytes, text
     FROM '${dataDir}/m/${file}'`,
  );

  await db().session(async (session) => {
    // Lets the loader write row_start and row_end itself, so a version
    // carries wikipedia's time instead of the moment it was loaded.
    await session.query("SET system_versioning_insert_history = 1");

    let history: unknown[][] = [];
    let current: unknown[][] = [];
    let pending = 0;

    const flush = async () => {
      await session.query("START TRANSACTION");

      // Every earlier version ends when the next one starts.
      await session.batch(
        `INSERT INTO revision (page_id, title, rev_id, parent_id, user, anonymous,
           comment, minor, sha1, bytes, text, row_start, row_end)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        history,
      );

      // The current version gets only a start, so it stays current.
      await session.batch(
        `INSERT INTO revision (page_id, title, rev_id, parent_id, user, anonymous,
           comment, minor, sha1, bytes, text, row_start)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        current,
      );

      await session.query("COMMIT");

      tick((versionsDone += history.length + current.length));
      history = [];
      current = [];
      pending = 0;
    };

    const save = async (versions: Version[]) => {
      const times = versions.map((version) => Number(version[4]));

      // Two edits in the same second would make a version end where it
      // starts, so the later one moves a microsecond on and keeps the order.
      for (let i = 1; i < times.length; i++) {
        if (times[i] <= times[i - 1]) times[i] = times[i - 1] + 1;
      }

      versions.forEach((version, i) => {
        const row = [
          ...version.slice(0, 4),
          ...version.slice(5, 12),
          sqlTime(times[i]),
        ];

        if (i < versions.length - 1) {
          history.push([...row, sqlTime(times[i + 1])]);
        } else {
          current.push(row);
        }

        pending += version[11].length * 2;
      });

      if (pending > FLUSH_BYTES) await flush();
    };

    let page: Version[] = [];

    for await (const version of rows) {
      if (page.length > 0 && page[0][0] !== version[0]) {
        if (!loaded.has(page[0][0])) await save(page);
        page = [];
      }

      page.push(version);
    }

    if (page.length > 0 && !loaded.has(page[0][0])) await save(page);
    if (history.length + current.length > 0) await flush();
  });

  console.log(`${file}: done`);
};

const wanted = process.argv.slice(2);

const files = (await readdir(`${dataDir}/m`))
  .filter((file) => file.endsWith(".parquet"))
  .filter((file) => wanted.length === 0 || wanted.some((w) => file.includes(w)))
  .sort();

const queue = [...files];

await Promise.all(
  Array.from({ length: FILES_AT_ONCE }, async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      await loadFile(file);
    }
  }),
);

tick(versionsDone, true);

const [counts] = await db().query<{ articles: number; versions: number }>(
  `SELECT COUNT(DISTINCT page_id) AS articles, COUNT(*) AS versions
   FROM revision FOR SYSTEM_TIME ALL`,
);

console.log(
  `in the table: ${counts.articles.toLocaleString("en")} articles, ` +
    `${counts.versions.toLocaleString("en")} versions`,
);

await db().end();
