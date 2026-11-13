import { readFile, readdir } from "node:fs/promises";

import { connectForSchema } from "./index.ts";

const folder = new URL("./schema/", import.meta.url);

const connection = await connectForSchema();

await connection.query(
  `CREATE TABLE IF NOT EXISTS schema_migration (
     name       VARCHAR(100) NOT NULL PRIMARY KEY,
     applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
);

const applied = new Set(
  (await connection.query("SELECT name FROM schema_migration")).map(
    (row: { name: string }) => row.name,
  ),
);

const files = (await readdir(folder)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;

  // DDL commits on its own in MariaDB, so a file that fails halfway stays
  // half applied: keep each file to statements that are safe to retry.
  await connection.query(await readFile(new URL(file, folder), "utf8"));
  await connection.query("INSERT INTO schema_migration (name) VALUES (?)", [
    file,
  ]);

  console.log(`applied ${file}`);
}

await connection.end();
