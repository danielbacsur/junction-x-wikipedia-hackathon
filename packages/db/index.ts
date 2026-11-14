import mariadb, { type Pool, type PoolConfig } from "mariadb";

/** One statement as it ran, kept so every page can show the SQL behind it. */
export type Statement = {
  sql: string;
  params: unknown[];
  ms: number;
  rows: number;
};

export type Db = {
  /** Runs one statement and returns its rows. */
  query<Row = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<Row[]>;

  /** Runs one statement for many rows over the bulk protocol. */
  batch(sql: string, rows: unknown[][]): Promise<void>;

  /** Holds one connection for a callback, for work that sets session state. */
  session<T>(work: (db: Db) => Promise<T>): Promise<T>;

  /** A view of this database that records every statement it runs. */
  traced(): Db & { statements: Statement[] };

  end(): Promise<void>;
};

type Runner = Pick<Pool, "query" | "batch">;

const config = (): PoolConfig => ({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3310),
  user: process.env.DB_USER ?? "wtt",
  password: process.env.DB_PASSWORD ?? "wtt",
  database: process.env.DB_NAME ?? "wtt",
  connectionLimit: Number(process.env.DB_POOL ?? 8),

  // The default searches too few candidates for 1024 dimensions: MariaDB
  // measured 79% recall at 20 and 100% at 80. A rebuilt article can also
  // be far longer than the megabyte a concatenation is cut at by default.
  initSql: [
    "SET mhnsw_ef_search = 80",
    "SET group_concat_max_len = 1073741824",
  ],

  // Timestamps stay strings: wikipedia's edit times are stored to the
  // microsecond, and a JavaScript date would round two edits into one.
  dateStrings: true,
  bigIntAsNumber: true,
  insertIdAsNumber: true,
  decimalAsNumber: true,
});

/** Vectors travel as the raw little-endian floats MariaDB stores. */
export const toVector = (values: ArrayLike<number>): Buffer => {
  const floats = Float32Array.from(values);
  return Buffer.from(floats.buffer, floats.byteOffset, floats.byteLength);
};

export const fromVector = (bytes: Buffer): Float32Array =>
  new Float32Array(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );

const wrap = (runner: Runner, pool: Pool, statements?: Statement[]): Db => ({
  async query<Row>(sql: string, params: unknown[] = []) {
    const started = performance.now();
    const result = await runner.query(sql, params);
    const rows: Row[] = Array.isArray(result) ? result : [];

    statements?.push({
      sql,
      params,
      ms: performance.now() - started,
      rows: rows.length,
    });

    return rows;
  },

  async batch(sql, rows) {
    if (rows.length > 0) await runner.batch(sql, rows);
  },

  async session(work) {
    const connection = await pool.getConnection();

    try {
      return await work(wrap(connection, pool, statements));
    } finally {
      await connection.release();
    }
  },

  traced() {
    const recorded: Statement[] = [];
    return Object.assign(wrap(runner, pool, recorded), {
      statements: recorded,
    });
  },

  end: () => pool.end(),
});

let shared: Db | undefined;

/** The process-wide pool, opened on first use. */
export const db = (): Db => {
  if (!shared) {
    const pool = mariadb.createPool(config());
    shared = wrap(pool, pool);
  }

  return shared;
};

/** A connection that accepts a whole schema file in one call. */
export const connectForSchema = () =>
  mariadb.createConnection({ ...config(), multipleStatements: true });
