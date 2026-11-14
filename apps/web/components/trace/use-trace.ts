"use client";

import type { Tracing } from "@wtt/package-engine";
import { useEffect, useState } from "react";

export type Traced =
  | { status: "idle" | "tracing" }
  | { status: "done"; tracing: Tracing }
  | { status: "error"; error: string };

const IDLE: Traced = { status: "idle" };
const TRACING: Traced = { status: "tracing" };

/**
 * Traces one claim through all of history. A new claim abandons the one
 * still on its way, and what arrives is kept under the claim it belongs
 * to, so the trace of the previous claim is never shown under the new one.
 */
export function useTrace(claim: string): Traced {
  const [arrived, setArrived] = useState<{ claim: string; traced: Traced }>({
    claim: "",
    traced: IDLE,
  });

  useEffect(() => {
    if (!claim) return;

    const abort = new AbortController();

    const run = async () => {
      const response = await fetch(
        `/api/trace?claim=${encodeURIComponent(claim)}`,
        { signal: abort.signal },
      );

      const body = (await response.json()) as Tracing | { error: string };

      if ("error" in body) throw new Error(body.error);

      setArrived({ claim, traced: { status: "done", tracing: body } });
    };

    run().catch((error: unknown) => {
      if (abort.signal.aborted) return;

      setArrived({
        claim,
        traced: {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        },
      });
    });

    return () => abort.abort();
  }, [claim]);

  if (!claim) return IDLE;

  return arrived.claim === claim ? arrived.traced : TRACING;
}
