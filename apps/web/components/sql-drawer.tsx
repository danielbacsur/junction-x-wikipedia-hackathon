"use client";

import type { Shown } from "@wtt/package-engine";
import { useState } from "react";

const KEYWORDS =
  /\b(WITH|SELECT|FROM|JOIN|LEFT JOIN|USING|ON|WHERE|AND|OR|GROUP BY|ORDER BY|HAVING|LIMIT|AS|UNION ALL|UNION|IN|IS NOT NULL|IS NULL|NOT|OVER|DESC|ASC|INSERT IGNORE INTO|VALUES|FOR SYSTEM_TIME AS OF TIMESTAMP|FOR SYSTEM_TIME ALL|IN BOOLEAN MODE|AGAINST|MATCH|COALESCE|ROW_NUMBER|VEC_DISTANCE_COSINE|VEC_FromText|COUNT|SUM|MIN|MAX|HEX|DISTINCT|EXISTS)\b/g;

/** Marks the words MariaDB reads as commands, and the time travel in red. */
function Sql({ text }: { text: string }) {
  const parts = text.split(KEYWORDS);

  return (
    <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed whitespace-pre text-ink-soft">
      {parts.map((part, index) =>
        index % 2 === 0 ? (
          part
        ) : part.startsWith("FOR SYSTEM_TIME") || part.startsWith("VEC_") ? (
          <b key={index} className="font-medium text-rubric">
            {part}
          </b>
        ) : (
          <b key={index} className="font-medium text-ink">
            {part}
          </b>
        ),
      )}
    </pre>
  );
}

/**
 * The SQL behind whatever is on the page. Every panel has one, because the
 * point of the product is what the database does, and a reader should be
 * able to copy a statement and run it.
 */
export function SqlDrawer({
  sql,
  title = "SQL",
}: {
  sql: Shown[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  if (sql.length === 0) return null;

  const ms = sql.reduce((sum, statement) => sum + statement.ms, 0);

  return (
    <section className="rounded border border-rule bg-paper-raised">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm"
      >
        <span className="font-mono text-xs text-rubric">
          {open ? "▾" : "▸"}
        </span>
        <span className="font-medium">{title}</span>
        <span className="text-ink-faint">
          {sql.length} {sql.length === 1 ? "statement" : "statements"} ·{" "}
          {ms.toFixed(ms < 10 ? 1 : 0)} ms in MariaDB
        </span>
        <span className="ml-auto text-xs text-ink-faint">
          {open ? "hide" : "show the queries"}
        </span>
      </button>

      {open && (
        <ol className="divide-y divide-rule border-t border-rule">
          {sql.map((statement, index) => (
            <li key={index} className="px-4 py-3">
              <div className="mb-1.5 flex gap-3 text-[11px] text-ink-faint tabular-nums">
                <span>{index + 1}</span>
                <span>{statement.ms} ms</span>
                <span>
                  {statement.rows} {statement.rows === 1 ? "row" : "rows"}
                </span>
              </div>
              <Sql text={statement.sql} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
