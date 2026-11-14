/**
 * Derives the edit table from the revision table: one row per saved
 * version with its place in the article's history and what it reverted.
 * Three SQL statements do the counting, so MariaDB does nearly all of it,
 * and one pass here decides which reverts stood.
 *
 *   node edits.ts               everything, from the revision table
 *   node edits.ts --reverted    only work out again which versions were reverted
 */
import { db } from "@wtt/package-db";

const timed = async (label: string, work: Promise<unknown>) => {
  const started = performance.now();
  await work;
  const seconds = ((performance.now() - started) / 1_000).toFixed(1);

  console.log(`${label}: ${seconds} s`);
};

/** A revert that brings back less text than this restored a blank page. */
const BLANK_BYTES = 100;

/** A version that stood longer than this was what wikipedia said. */
const REVERT_DAYS = 30;

const deriveEdits = async () => {
  await db().query("TRUNCATE TABLE edit");

  // LAG over the same text finds the last time this exact text was live. If
  // that was not the version just before, somebody put an old text back.
  await timed(
    "edits from history",
    db().query(
      `INSERT INTO edit (page_id, seq, rev_id, saved_at, ended_at, user, editor,
         minor, bytes, delta, sha1, comment, restores)
       SELECT page_id, seq, rev_id, row_start,
              IF(row_end > NOW(), NULL, row_end),
              user,
              CASE WHEN user IS NULL THEN 'hidden'
                   WHEN user LIKE '~2%' THEN 'temp'
                   WHEN anonymous THEN 'ip'
                   ELSE 'named' END,
              minor, bytes,
              CAST(bytes AS SIGNED) - CAST(COALESCE(previous_bytes, 0) AS SIGNED),
              sha1, comment,
              IF(same_text_seq < seq - 1, same_text_seq, NULL)
       FROM (
         SELECT v.*,
                LAG(bytes) OVER (PARTITION BY page_id ORDER BY seq) AS previous_bytes,
                LAG(seq) OVER (PARTITION BY page_id, sha1 ORDER BY seq) AS same_text_seq
         FROM (
           SELECT page_id, rev_id, row_start, row_end, user, anonymous, minor, bytes,
                  sha1, comment,
                  ROW_NUMBER() OVER (PARTITION BY page_id ORDER BY row_start) AS seq
           FROM revision FOR SYSTEM_TIME ALL
         ) AS v
       ) AS numbered`,
    ),
  );

  // Every version between a revert and the text it restored was undone by
  // it. MariaDB's sequence engine lists those versions as plain numbers, so
  // each one is a primary key lookup. Joining on a range instead read every
  // edit of the page for every revert and ran for ten minutes.
  await timed(
    "undone versions",
    db().query(
      `UPDATE edit AS e
       JOIN (
         SELECT r.page_id, r.restores + s.seq AS seq, MIN(r.seq) AS revert_seq
         FROM edit AS r
         JOIN seq_1_to_5000 AS s ON s.seq < r.seq - r.restores
         WHERE r.restores IS NOT NULL
         GROUP BY r.page_id, r.restores + s.seq
       ) AS undone USING (page_id, seq)
       SET e.undone_by = undone.revert_seq`,
    ),
  );
};

const time = (at: string) => Date.parse(`${at.replace(" ", "T")}Z`);

/**
 * Marks the versions a standing revert removed within thirty days.
 *
 * Which reverts stood is decided from the newest backwards: a revert stands
 * unless a later standing revert reaches back past it within thirty days. A
 * vandal who puts the same text back five times makes five "reverts" to
 * their own earlier vandalism, and each is itself undone by the editor who
 * cleans up, so none of them stands and nothing good between them is marked.
 *
 * The thirty days count for the reverts as they do for the versions. A
 * clean-up that stood for two months is what wikipedia said, and somebody
 * restoring an older text after that does not make it never have happened.
 */
const markReverted = async () => {
  const reverts = await db().query<{
    page_id: number;
    seq: number;
    restores: number;
    saved_at: string;
  }>(
    `SELECT r.page_id, r.seq, r.restores, r.saved_at
     FROM edit AS r
     JOIN edit AS restored
       ON restored.page_id = r.page_id AND restored.seq = r.restores
     WHERE r.restores IS NOT NULL AND restored.bytes >= ${BLANK_BYTES}
     ORDER BY r.page_id, r.seq DESC`,
  );

  const standing: unknown[][] = [];
  const window = REVERT_DAYS * 86_400_000;
  let page = 0;
  let later: { restores: number; at: number }[] = [];

  for (const revert of reverts) {
    if (revert.page_id !== page) {
      page = revert.page_id;
      later = [];
    }

    const at = time(revert.saved_at);

    // A later standing revert soon restored a text older than this one.
    if (
      later.some(
        (other) => other.restores < revert.seq && other.at - at <= window,
      )
    ) {
      continue;
    }

    later.push({ restores: revert.restores, at });
    standing.push([
      revert.seq,
      revert.page_id,
      revert.restores,
      revert.seq,
      revert.saved_at,
    ]);
  }

  await db().query(
    "UPDATE edit SET reverted_by = NULL WHERE reverted_by IS NOT NULL",
  );

  for (let i = 0; i < standing.length; i += 2_000) {
    await db().batch(
      `UPDATE edit SET reverted_by = ?
       WHERE page_id = ? AND seq > ? AND seq < ?
         AND saved_at >= ? - INTERVAL ${REVERT_DAYS} DAY`,
      standing.slice(i, i + 2_000),
    );
  }

  console.log(
    `${standing.length.toLocaleString("en")} of ${reverts.length.toLocaleString("en")} reverts stood`,
  );
};

const countPages = async () => {
  await db().query("TRUNCATE TABLE page_stats");

  await db().query(
    `INSERT INTO page_stats (page_id, edits, editors, reverts, first_edit, last_edit)
     SELECT page_id, COUNT(*), COUNT(DISTINCT user), SUM(restores IS NOT NULL),
            MIN(saved_at), MAX(saved_at)
     FROM edit
     GROUP BY page_id`,
  );
};

if (!process.argv.includes("--reverted")) await deriveEdits();

await timed("reverted versions", markReverted());

if (!process.argv.includes("--reverted")) {
  await timed("page statistics", countPages());
}

const [counts] = await db().query<Record<string, number>>(
  `SELECT COUNT(*) AS edits, COUNT(restores) AS reverts, COUNT(undone_by) AS undone,
          COUNT(reverted_by) AS reverted
   FROM edit`,
);

console.log(counts);

await db().end();
