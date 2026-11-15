/**
 * Proves the passage table. For a sample of versions it rebuilds the
 * article from its blocks as of the moment that version was saved, inside
 * MariaDB, and checks the result twice: against the whole copy in the
 * revision table, and against the sha1 wikipedia published for it.
 *
 *   node verify.ts                    2,000 random versions
 *   node verify.ts --sample 20000     more of them
 *   node verify.ts --page 1256        every version of one article
 */
import { type Db, db } from "@wtt/package-db";

/** Wikipedia writes a version's sha1 in base 36, padded to 31 characters. */
export const wikipediaSha1 = (hex: string) =>
  BigInt(`0x${hex}`).toString(36).padStart(31, "0");

/** One article rebuilt from its blocks as of a moment, as wikitext. */
export const REBUILD = `
  SELECT GROUP_CONCAT(CONCAT(REPEAT('\\n', p.gap), t.wikitext)
                      ORDER BY p.ord SEPARATOR '\\n')
  FROM passage FOR SYSTEM_TIME AS OF TIMESTAMP ? AS p FORCE INDEX (stood)
  JOIN passage_text AS t USING (hash)
  WHERE p.page_id = ?`;

const COMPARE = `
  SELECT SHA1(COALESCE((${REBUILD}), '')) AS rebuilt,
         (SELECT SHA1(text) FROM revision FOR SYSTEM_TIME AS OF TIMESTAMP ?
          WHERE page_id = ?) AS stored`;

export type Checked = {
  checked: number;

  /** Rebuilt text differs from the stored whole copy: must stay empty. */
  different: number[];

  /** Rebuilt text hashes to the sha1 wikipedia published. */
  matchWikipedia: number;

  /**
   * Wikipedia's sha1 does not fit its own text. These are versions from
   * 2003 and 2004, hashed before the text was converted to UTF-8.
   */
  legacy: number;

  seconds: number;
};

/** Rebuilds each given version from its blocks and checks it. */
export const verify = async (
  database: Db,
  where: string,
  params: unknown[],
): Promise<Checked> => {
  const started = performance.now();

  const versions = await database.query<{
    page_id: number;
    rev_id: number;
    saved_at: string;
    sha1: string | null;
  }>(`SELECT page_id, rev_id, saved_at, sha1 FROM edit WHERE ${where}`, params);

  const result: Checked = {
    checked: versions.length,
    different: [],
    matchWikipedia: 0,
    legacy: 0,
    seconds: 0,
  };

  await database.session(async (session) => {
    // The default cuts a concatenation off at one megabyte.
    await session.query("SET group_concat_max_len = 1073741824");

    for (const version of versions) {
      const at = [version.saved_at, version.page_id];
      const [hashes] = await session.query<{ rebuilt: string; stored: string }>(
        COMPARE,
        [...at, ...at],
      );

      if (hashes.rebuilt !== hashes.stored) {
        result.different.push(version.rev_id);
      } else if (wikipediaSha1(hashes.rebuilt) === version.sha1) {
        result.matchWikipedia++;
      } else {
        result.legacy++;
      }
    }
  });

  result.seconds = (performance.now() - started) / 1_000;
  return result;
};

export const report = (result: Checked) =>
  `${result.checked - result.different.length} of ${result.checked} versions ` +
  `rebuilt byte for byte from their blocks, ${result.matchWikipedia} match ` +
  `wikipedia's own sha1, ${result.legacy} have a sha1 from before utf-8 ` +
  `(${result.seconds.toFixed(1)} s)`;

if (import.meta.main) {
  const argument = (name: string) => {
    const at = process.argv.indexOf(name);
    return at === -1 ? undefined : process.argv[at + 1];
  };

  const page = argument("--page");
  const sample = Number(argument("--sample") ?? 2_000);

  const result = page
    ? await verify(db(), "page_id = ?", [Number(page)])
    : await verify(
        db(),
        `rev_id IN (SELECT rev_id FROM (
           SELECT rev_id FROM edit
           WHERE page_id IN (SELECT page_id FROM passage)
           ORDER BY RAND(42) LIMIT ?) AS picked)`,
        [sample],
      );

  console.log(report(result));

  if (result.different.length > 0) {
    console.log("different rev ids:", result.different.slice(0, 20));
    process.exitCode = 1;
  }

  await db().end();
}
