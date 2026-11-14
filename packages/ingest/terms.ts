/**
 * Counts, for every stem, how many wordings contain it, and writes the
 * counts to the term table. Stems seen in fewer than five wordings are
 * left out: a missing stem simply counts as rare.
 *
 *   node terms.ts
 */
import { db } from "@wtt/package-db";

const RAREST_KEPT = 5;

const counts = new Map<string, number>();
const started = performance.now();
let wordings = 0;

// The table is read in 256 slices of its primary key, so no single result
// has to hold all 400 MB of stems.
for (let slice = 0; slice < 256; slice++) {
  const from = Buffer.from([slice, 0, 0, 0, 0, 0, 0, 0]);
  const to = Buffer.from([slice, 255, 255, 255, 255, 255, 255, 255]);

  const rows = await db().query<{ stems: string }>(
    `SELECT stems FROM passage_text
     WHERE hash BETWEEN ? AND ? AND chars > 0`,
    [from, to],
  );

  for (const { stems } of rows) {
    for (const stem of new Set(stems.split(" "))) {
      if (stem.length < 2 || stem.length > 100) continue;
      counts.set(stem, (counts.get(stem) ?? 0) + 1);
    }
  }

  wordings += rows.length;
}

const kept = [...counts].filter(([, df]) => df >= RAREST_KEPT);

await db().query("TRUNCATE TABLE term");

for (let i = 0; i < kept.length; i += 20_000) {
  await db().batch(
    "INSERT INTO term (stem, df) VALUES (?, ?)",
    kept.slice(i, i + 20_000),
  );
}

console.log(
  `${wordings.toLocaleString("en")} wordings, ${counts.size.toLocaleString("en")} stems, ` +
    `${kept.length.toLocaleString("en")} kept, ` +
    `${((performance.now() - started) / 1_000).toFixed(0)} s`,
);

await db().end();
