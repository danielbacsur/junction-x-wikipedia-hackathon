import { fileURLToPath } from "node:url";

import { DuckDBConnection } from "@duckdb/node-api";

/** Where the downloaded datasets live: data/s, data/m and data/l. */
export const dataDir =
  process.env.DATA_DIR ?? fileURLToPath(new URL("../../data", import.meta.url));

/**
 * Streams the rows of a DuckDB query, one array per row. DuckDB reads the
 * parquet files column by column, so a query only pays for what it selects.
 */
export async function* read<Row extends unknown[]>(
  sql: string,
): AsyncGenerator<Row> {
  const connection = await DuckDBConnection.create();

  try {
    const result = await connection.stream(sql);

    for (;;) {
      const chunk = await result.fetchChunk();
      if (!chunk || chunk.rowCount === 0) break;

      yield* chunk.getRows() as Row[];
    }
  } finally {
    connection.closeSync();
  }
}

/** Groups a stream into batches that stay under a byte budget. */
export async function* batches<Row>(
  rows: AsyncIterable<Row>,
  size: (row: Row) => number,
  budget = 8_000_000,
  limit = 2_000,
): AsyncGenerator<Row[]> {
  let batch: Row[] = [];
  let bytes = 0;

  for await (const row of rows) {
    const next = size(row);

    if (batch.length > 0 && (bytes + next > budget || batch.length >= limit)) {
      yield batch;
      batch = [];
      bytes = 0;
    }

    batch.push(row);
    bytes += next;
  }

  if (batch.length > 0) yield batch;
}

/** Prints a progress line at most once a second. */
export const progress = (label: string) => {
  const started = performance.now();
  let last = 0;

  return (done: number, force = false) => {
    const now = performance.now();
    if (!force && now - last < 1_000) return;
    last = now;

    const seconds = (now - started) / 1_000;
    console.log(
      `${label}: ${done.toLocaleString("en")} in ${seconds.toFixed(0)} s` +
        ` (${Math.round(done / Math.max(seconds, 0.001)).toLocaleString("en")}/s)`,
    );
  };
};
