/**
 * Derives the edit table from the revision table: one row per saved
 * version with its place in the article's history and what it reverted.
 * The work is two SQL statements, so MariaDB does all of it.
 *
 *   node edits.ts
 */
import { db } from "@wtt/package-db";

const timed = async (label: string, sql: string) => {
  const started = performance.now();
  await db().query(sql);
  const seconds = ((performance.now() - started) / 1_000).toFixed(1);

  console.log(`${label}: ${seconds} s`);
};

await db().query("TRUNCATE TABLE edit");

// LAG over the same text finds the last time this exact text was live. If
// that was not the version just before, somebody put an old text back.
await timed(
  "edits from history",
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
);

// Every version between a revert and the text it restored was undone by
// it. MariaDB's sequence engine lists those versions as plain numbers, so
// each one is a primary key lookup. Joining on a range instead read every
// edit of the page for every revert and ran for ten minutes.
await timed(
  "undone versions",
  `UPDATE edit AS e
   JOIN (
     SELECT r.page_id, r.restores + s.seq AS seq, MIN(r.seq) AS revert_seq
     FROM edit AS r
     JOIN seq_1_to_5000 AS s ON s.seq < r.seq - r.restores
     WHERE r.restores IS NOT NULL
     GROUP BY r.page_id, r.restores + s.seq
   ) AS undone USING (page_id, seq)
   SET e.undone_by = undone.revert_seq`,
);

const [counts] = await db().query<Record<string, number>>(
  `SELECT COUNT(*) AS edits, COUNT(restores) AS reverts, COUNT(undone_by) AS undone
   FROM edit`,
);

console.log(counts);

await db().end();
