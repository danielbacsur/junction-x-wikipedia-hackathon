"use client";

import type { Shown } from "@wtt/package-engine";
import { useState } from "react";

import { Sql } from "./sql";

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
