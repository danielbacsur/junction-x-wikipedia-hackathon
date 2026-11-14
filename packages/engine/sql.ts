import type { Statement } from "@wtt/package-db";

/** A statement as a person can read and run it, with how it went. */
export type Shown = { sql: string; ms: number; rows: number };

const literal = (value: unknown): string => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "bigint")
    return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";

  if (Buffer.isBuffer(value)) {
    // A vector is 4,096 bytes of floats, which nobody wants to read.
    if (value.length >= 64) {
      const floats = new Float32Array(
        value.buffer.slice(value.byteOffset, value.byteOffset + 12),
      );
      const start = [...floats].map((float) => float.toFixed(4)).join(", ");

      return `VEC_FromText('[${start}, … ${value.length / 4} numbers]')`;
    }

    return `x'${value.toString("hex")}'`;
  }

  return `'${String(value).replaceAll("'", "''")}'`;
};

const tidy = (sql: string) => {
  const lines = sql
    .replace(/^\s*\n/, "")
    .trimEnd()
    .split("\n");
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => /^ */.exec(line)![0].length),
  );

  return lines.map((line) => line.slice(indent)).join("\n");
};

/** Puts each parameter back where its question mark stands. */
export const show = (statement: Statement): Shown => {
  let next = 0;

  return {
    sql: tidy(statement.sql).replace(/\?/g, () =>
      literal(statement.params[next++]),
    ),
    ms: Math.round(statement.ms * 10) / 10,
    rows: statement.rows,
  };
};
