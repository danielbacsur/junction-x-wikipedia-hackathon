/**
 * Loads the current text of every article: the history of finland set in
 * three languages with its vectors and categories, then the rest of Finnish
 * Wikipedia. Safe to run again: rows already loaded are skipped.
 *
 *   node articles.ts            everything
 *   node articles.ts --no-l     only the history of finland set
 */
import { readFile } from "node:fs/promises";

import { type DuckDBListValue } from "@duckdb/node-api";
import { db, toVector } from "@wtt/package-db";

import { batches, dataDir, progress, read } from "./parquet.ts";

type Article = [
  lang: string,
  pageId: number,
  revId: number,
  wikidataId: string | null,
  title: string,
  url: string,
  dateModified: string | null,
  text: string,
];

const columns = `lang, page_id::UINTEGER, rev_id::UINTEGER, wikidata_id, title, url,
  strftime(try_cast(date_modified AS TIMESTAMP), '%Y-%m-%d %H:%M:%S'), text`;

const loadArticles = async (file: string, history: boolean) => {
  const tick = progress(file);
  let done = 0;

  const rows = read<Article>(`SELECT ${columns} FROM '${dataDir}/${file}'`);

  for await (const batch of batches(rows, (row) => row[7].length * 2)) {
    await db().batch(
      `INSERT IGNORE INTO article
         (lang, page_id, rev_id, wikidata_id, title, url, date_modified, text, history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${history ? 1 : 0})`,
      batch,
    );

    tick((done += batch.length));
  }

  tick(done, true);
};

const loadVectors = async (lang: string) => {
  const file = `s/vectors-bge-m3-${lang}.parquet`;
  const tick = progress(file);
  let done = 0;

  const loaded = new Set(
    (
      await db().query<{ page_id: number }>(
        "SELECT page_id FROM article_vector WHERE lang = ?",
        [lang],
      )
    ).map((row) => row.page_id),
  );

  const rows = read<[string, number, string, boolean, DuckDBListValue]>(
    `SELECT lang, page_id, model, truncated, embedding FROM '${dataDir}/${file}'`,
  );

  for await (const batch of batches(rows, () => 4_096, 2_000_000, 500)) {
    const fresh = batch
      .filter((row) => !loaded.has(row[1]))
      .map(([l, pageId, model, truncated, embedding]) => [
        l,
        pageId,
        model,
        truncated,
        toVector(embedding.items as number[]),
      ]);

    await db().batch(
      `INSERT INTO article_vector (lang, page_id, model, truncated, embedding)
       VALUES (?, ?, ?, ?, ?)`,
      fresh,
    );

    tick((done += batch.length));
  }

  tick(done, true);
};

const loadTsv = async (file: string, sql: string) => {
  const lines = (await readFile(`${dataDir}/${file}`, "utf8"))
    .split("\n")
    .slice(1)
    .filter(Boolean)
    .map((line) => line.split("\t"));

  for (let i = 0; i < lines.length; i += 5_000) {
    await db().batch(sql, lines.slice(i, i + 5_000));
  }

  console.log(`${file}: ${lines.length.toLocaleString("en")} rows`);
};

for (const lang of ["fi", "sv", "en"]) {
  await loadArticles(`s/articles-${lang}.parquet`, true);
}

await loadTsv(
  "s/category-links-fi.tsv",
  "INSERT IGNORE INTO category_link (parent, child) VALUES (?, ?)",
);

await loadTsv(
  "s/article-categories-fi.tsv",
  "INSERT IGNORE INTO article_category (page_id, category) VALUES (?, ?)",
);

for (const lang of ["fi", "sv", "en"]) await loadVectors(lang);

if (!process.argv.includes("--no-l")) {
  await loadArticles("l/articles-fi.parquet", false);
}

await db().end();
