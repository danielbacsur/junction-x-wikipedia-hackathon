/**
 * Checks the whole database against its sources and against itself, and
 * reprints every number the product quotes. Nothing here trusts the code
 * that loaded the data: counts come from the parquet files, time travel is
 * compared with an independent lookup, and rebuilt articles are hashed
 * against the sha1 wikipedia published.
 *
 *   node validate.ts                 a quick pass, about a minute
 *   node validate.ts --deep          ten times the samples
 *   node validate.ts --out file.json also write the report as json
 */
import { writeFile } from "node:fs/promises";

import { db } from "@wtt/package-db";
import { LAST_EDIT, gatherEvidence, passageSearch } from "@wtt/package-engine";

import { dataDir, read } from "./parquet.ts";
import { verify, wikipediaSha1 } from "./verify.ts";

const deep = process.argv.includes("--deep");
const scale = deep ? 10 : 1;

type Check = {
  name: string;
  ok: boolean;
  detail: string;
  numbers: Record<string, number | string>;
  seconds: number;
};

const checks: Check[] = [];

const check = async (
  name: string,
  work: () => Promise<Omit<Check, "name" | "seconds">>,
) => {
  const started = performance.now();

  try {
    const result = await work();
    const seconds = (performance.now() - started) / 1_000;

    checks.push({ name, ...result, seconds });
    console.log(
      `${result.ok ? "ok  " : "FAIL"} ${name}: ${result.detail} (${seconds.toFixed(1)} s)`,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    checks.push({ name, ok: false, detail, numbers: {}, seconds: 0 });
    console.log(`FAIL ${name}: ${detail}`);
  }
};

const one = async <Row>(sql: string, params: unknown[] = []) =>
  (await db().query<Row>(sql, params))[0];

const counted = async (sql: string) => {
  for await (const [count] of read<[bigint | number]>(sql))
    return Number(count);
  return 0;
};

await check("every row of the datasets is in the database", async () => {
  const source = {
    articlesFi: await counted(
      `SELECT COUNT(*) FROM '${dataDir}/s/articles-fi.parquet'`,
    ),
    articlesSv: await counted(
      `SELECT COUNT(*) FROM '${dataDir}/s/articles-sv.parquet'`,
    ),
    articlesEn: await counted(
      `SELECT COUNT(*) FROM '${dataDir}/s/articles-en.parquet'`,
    ),
    vectors: await counted(
      `SELECT COUNT(*) FROM '${dataDir}/s/vectors-bge-m3-*.parquet'`,
    ),
    versions: await counted(
      `SELECT COUNT(*) FROM '${dataDir}/m/versions-*.parquet'`,
    ),
    versionedArticles: await counted(
      `SELECT COUNT(DISTINCT page_id) FROM '${dataDir}/m/versions-*.parquet'`,
    ),
    allFinnish: await counted(
      `SELECT COUNT(*) FROM '${dataDir}/l/articles-fi.parquet'`,
    ),
  };

  const loaded = await one<Record<keyof typeof source, number>>(
    `SELECT
       (SELECT COUNT(*) FROM article WHERE history = 1 AND lang = 'fi') AS articlesFi,
       (SELECT COUNT(*) FROM article WHERE history = 1 AND lang = 'sv') AS articlesSv,
       (SELECT COUNT(*) FROM article WHERE history = 1 AND lang = 'en') AS articlesEn,
       (SELECT COUNT(*) FROM article_vector) AS vectors,
       (SELECT COUNT(*) FROM revision FOR SYSTEM_TIME ALL) AS versions,
       (SELECT COUNT(*) FROM revision) AS versionedArticles,
       (SELECT COUNT(*) FROM article WHERE lang = 'fi') AS allFinnish`,
  );

  const wrong = (Object.keys(source) as (keyof typeof source)[]).filter(
    (key) => source[key] !== Number(loaded[key]),
  );

  return {
    ok: wrong.length === 0,
    detail:
      wrong.length === 0
        ? `${source.versions.toLocaleString("en")} versions of ` +
          `${source.versionedArticles.toLocaleString("en")} articles, ` +
          `${source.allFinnish.toLocaleString("en")} current articles, ` +
          `${source.vectors.toLocaleString("en")} article vectors`
        : `counts differ for ${wrong.join(", ")}`,
    numbers: source,
  };
});

await check("stored versions carry the text Wikipedia hashed", async () => {
  const sample = await db().query<{
    page_id: number;
    saved_at: string;
    sha1: string;
  }>(
    `SELECT page_id, saved_at, sha1 FROM edit
     WHERE sha1 IS NOT NULL ORDER BY RAND(7) LIMIT ${300 * scale}`,
  );

  let match = 0;
  let legacy = 0;
  let wrong = 0;

  for (const version of sample) {
    const stored = await one<{ hex: string }>(
      `SELECT SHA1(text) AS hex FROM revision FOR SYSTEM_TIME AS OF TIMESTAMP ?
       WHERE page_id = ?`,
      [version.saved_at, version.page_id],
    );

    if (wikipediaSha1(stored.hex) === version.sha1) match++;
    // Wikipedia hashed its oldest versions before converting them to UTF-8.
    else if (version.saved_at < "2006") legacy++;
    else wrong++;
  }

  return {
    ok: wrong === 0,
    detail: `${match} of ${sample.length} match Wikipedia's sha1, ${legacy} ${legacy === 1 ? "is a pre-2006 version" : "are pre-2006 versions"} hashed before UTF-8, ${wrong} ${wrong === 1 ? "is" : "are"} wrong`,
    numbers: { sampled: sample.length, match, legacy, wrong },
  };
});

await check(
  "asking for a date returns the version live at that moment",
  async () => {
    // A random moment in a random article's life, and what an independent
    // lookup in the edit table says was live then.
    const moments = await db().query<{
      page_id: number;
      at: string;
      expected: number;
    }>(
      `SELECT m.page_id, m.at,
            (SELECT rev_id FROM edit AS e
             WHERE e.page_id = m.page_id AND e.saved_at <= m.at
             ORDER BY e.saved_at DESC LIMIT 1) AS expected
     FROM (SELECT page_id,
                  TIMESTAMPADD(SECOND,
                    FLOOR(RAND(11) * TIMESTAMPDIFF(SECOND, MIN(saved_at), ?)),
                    MIN(saved_at)) AS at
           FROM edit GROUP BY page_id ORDER BY RAND(13) LIMIT ${500 * scale}) AS m`,
      [LAST_EDIT],
    );

    let wrong = 0;

    for (const moment of moments) {
      const live = await one<{ rev_id: number } | undefined>(
        `SELECT rev_id FROM revision FOR SYSTEM_TIME AS OF TIMESTAMP ?
       WHERE page_id = ?`,
        [moment.at, moment.page_id],
      );

      if (live?.rev_id !== moment.expected) wrong++;
    }

    const early = await one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM revision
     FOR SYSTEM_TIME AS OF TIMESTAMP '2003-01-01 00:00:00'`,
    );

    return {
      ok: wrong === 0 && early.n === 0,
      detail: `${moments.length - wrong} of ${moments.length} random moments return the right version, and nothing exists before the first edit`,
      numbers: { moments: moments.length, wrong, beforeFirstEdit: early.n },
    };
  },
);

await check("two edits in one second stay two versions", async () => {
  const pairs = await one<{ same: number; moved: number }>(
    `SELECT
       (SELECT COUNT(*) FROM (SELECT 1 FROM edit GROUP BY page_id, saved_at
                              HAVING COUNT(*) > 1) AS d) AS same,
       (SELECT COUNT(*) FROM edit WHERE MICROSECOND(saved_at) <> 0) AS moved`,
  );

  return {
    ok: pairs.same === 0,
    detail: `${pairs.moved} versions were moved by microseconds to keep their order, and no two share a timestamp`,
    numbers: pairs,
  };
});

await check("every version rebuilds from its passages", async () => {
  const result = await verify(
    db(),
    `rev_id IN (SELECT rev_id FROM (
       SELECT rev_id FROM edit ORDER BY RAND(42) LIMIT ?) AS picked)`,
    [300 * scale],
  );

  return {
    ok: result.different.length === 0,
    detail:
      `${result.checked - result.different.length} of ${result.checked} versions rebuilt byte for byte ` +
      `inside MariaDB, ${result.matchWikipedia} match Wikipedia's own sha1, ` +
      `${result.legacy} were hashed before UTF-8`,
    numbers: {
      checked: result.checked,
      different: result.different.length,
      matchWikipedia: result.matchWikipedia,
      legacy: result.legacy,
    },
  };
});

await check(
  "search pinned to a date never returns text from another time",
  async () => {
    // Wordings that stood exactly once and are gone, each searched for with
    // its own vector: inside its lifetime it must come first, and a day
    // before or after it must not come at all.
    const wordings = await db().query<{
      hash: Buffer;
      page_id: number;
      embedding: Buffer;
      born: string;
      died: string;
    }>(
      `SELECT p.hash, MIN(p.page_id) AS page_id, v.embedding,
            MIN(p.row_start) AS born, MAX(p.row_end) AS died
     FROM passage FOR SYSTEM_TIME ALL AS p
     JOIN passage_vector AS v USING (hash)
     JOIN edit AS b ON b.rev_id = p.born_rev
     WHERE b.reverted_by IS NULL
     GROUP BY p.hash
     HAVING COUNT(DISTINCT p.page_id) = 1 AND COUNT(DISTINCT p.born_rev) = 1
        AND died < NOW() AND TIMESTAMPDIFF(DAY, born, died) > 30
     ORDER BY RAND(5) LIMIT ${40 * scale}`,
    );

    const shift = (at: string, days: number) =>
      new Date(
        Date.parse(`${at.slice(0, 19).replace(" ", "T")}Z`) + days * 86_400_000,
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    let inside = 0;
    let leaked = 0;

    for (const wording of wordings) {
      const hex = wording.hash.toString("hex").toUpperCase();

      const found = async (at: string) =>
        (
          await passageSearch(db(), {
            vector: wording.embedding,
            match: "",
            at,
            limit: 10,
          })
        ).some((hit) => hit.hash === hex && hit.pageId === wording.page_id);

      if (await found(shift(wording.born, 15))) inside++;
      if (await found(shift(wording.born, -1))) leaked++;
      if (await found(shift(wording.died, 1))) leaked++;
    }

    return {
      ok: leaked === 0 && inside === wordings.length && wordings.length > 0,
      detail: `${inside} of ${wordings.length} removed wordings are found inside their lifetime, ${leaked} leaked outside it`,
      numbers: { wordings: wordings.length, inside, leaked },
    };
  },
);

await check("every cited passage stood in the cited version", async () => {
  const asked: [string, string | null][] = [
    ["How many Finnish soldiers died in the Winter War?", "2007"],
    ["How many Finnish soldiers died in the Winter War?", null],
    ["Kuka oli Suomen presidentti vuosina 1956–1982?", "2012"],
    ["Mistä Suomen sisällissota johtui?", "2006"],
    ["Milloin Suomi liittyi Euroopan unioniin?", "2018"],
  ];

  let sources = 0;
  let wrong = 0;

  for (const [question, date] of asked) {
    const evidence = await gatherEvidence(question, date);
    const at = evidence.at ?? LAST_EDIT;

    for (const source of evidence.sources) {
      sources++;

      const standing = await one<{ stood: number; rev_id: number }>(
        `SELECT
           (SELECT COUNT(*) FROM passage FOR SYSTEM_TIME AS OF TIMESTAMP ?
            WHERE page_id = ? AND hash = ?) AS stood,
           (SELECT rev_id FROM revision FOR SYSTEM_TIME AS OF TIMESTAMP ?
            WHERE page_id = ?) AS rev_id`,
        [at, source.pageId, Buffer.from(source.hash, "hex"), at, source.pageId],
      );

      if (standing.stood === 0 || standing.rev_id !== source.revId) wrong++;
    }
  }

  return {
    ok: wrong === 0 && sources > 0,
    detail: `${sources - wrong} of ${sources} sources across ${asked.length} questions stood in the version they link to`,
    numbers: { questions: asked.length, sources, wrong },
  };
});

await check(
  "every stated term of office is in the version cited for it",
  async () => {
    // The office table is read from infoboxes by a parser. Each row names the
    // version that first stated the term, so that version has to hold the
    // field as written, be saved at the moment the row starts, and not be one
    // a revert took back.
    const terms = await one<Record<string, number>>(
      `SELECT COUNT(*) AS terms,
            SUM(INSTR(r.text, o.source_text) > 0) AS written,
            SUM(e.saved_at = o.row_start) AS timed,
            SUM(e.reverted_by IS NULL) AS accepted
     FROM office_term FOR SYSTEM_TIME ALL AS o
     JOIN edit AS e ON e.rev_id = o.rev_id
     JOIN revision FOR SYSTEM_TIME ALL AS r ON r.rev_id = o.rev_id`,
    );

    const all = Number(terms.terms);
    const right = (count: number) => Number(count) === all;

    return {
      ok:
        all > 0 &&
        right(terms.written) &&
        right(terms.timed) &&
        right(terms.accepted),
      detail: `${terms.written} of ${all} stated terms are written in the version cited, ${terms.timed} start at the moment it was saved`,
      numbers: {
        terms: all,
        written: Number(terms.written),
        timed: Number(terms.timed),
        accepted: Number(terms.accepted),
      },
    };
  },
);

const sizes = await db().query<{ name: string; rows: number; mb: number }>(
  `SELECT table_name AS name, table_rows AS \`rows\`,
          ROUND((data_length + index_length) / 1e6) AS mb
   FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name <> 'schema_migration'
   ORDER BY mb DESC`,
);

const corpus = await one<Record<string, number>>(
  `SELECT
     (SELECT COUNT(*) FROM passage) AS liveBlocks,
     (SELECT COUNT(*) FROM passage FOR SYSTEM_TIME ALL) AS lifetimes,
     (SELECT COUNT(*) FROM passage_text) AS wordings,
     (SELECT COUNT(*) FROM passage_text WHERE kind IN ('prose', 'list')
        AND chars >= 40) AS searchableWordings,
     (SELECT COUNT(*) FROM passage_vector) AS embeddedWordings,
     (SELECT ROUND(SUM(LENGTH(wikitext)) / 1e6) FROM passage_text) AS wordingMb,
     (SELECT ROUND(SUM(bytes) / 1e6) FROM edit) AS wholeCopyMb,
     (SELECT COUNT(*) FROM edit WHERE restores IS NOT NULL) AS reverts,
     (SELECT COUNT(*) FROM edit WHERE undone_by IS NOT NULL) AS undone,
     (SELECT COUNT(*) FROM edit WHERE reverted_by IS NOT NULL) AS reverted,
     (SELECT COUNT(DISTINCT user) FROM edit) AS editors`,
);

const failed = checks.filter((result) => !result.ok);

console.log(
  failed.length === 0
    ? `\nall ${checks.length} checks passed`
    : `\n${failed.length} of ${checks.length} checks FAILED`,
);

const at = process.argv.indexOf("--out");

if (at !== -1 && process.argv[at + 1]) {
  await writeFile(
    process.argv[at + 1],
    `${JSON.stringify(
      {
        validatedAt: new Date().toISOString(),
        deep,
        passed: failed.length === 0,
        checks,
        corpus,
        tables: sizes,
      },
      null,
      2,
    )}\n`,
  );
}

await db().end();
process.exitCode = failed.length === 0 ? 0 : 1;
