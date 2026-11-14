"use client";

import type { Source, Standing } from "@wtt/package-engine";
import { useEffect, useState } from "react";

/**
 * Asks whether the passages of one answer also stood on the other date.
 * The key is "page:hash", the same form the answer cards look them up by.
 */
export function useStanding(
  sources: Source[] | undefined,
  date: string | null,
) {
  const keys = (sources ?? [])
    .map((source) => `${source.pageId}:${source.hash}`)
    .join(",");

  const request = keys ? `${date ?? "now"}|${keys}` : "";

  const [arrived, setArrived] = useState<{
    request: string;
    standing: Record<string, Standing>;
  }>({ request: "", standing: {} });

  useEffect(() => {
    if (!request) return;

    const abort = new AbortController();

    fetch(
      `/api/standing?keys=${encodeURIComponent(keys)}${
        date ? `&date=${encodeURIComponent(date)}` : ""
      }`,
      { signal: abort.signal },
    )
      .then((response) => response.json())
      .then((body: { standing: Record<string, Standing> }) =>
        setArrived({ request, standing: body.standing ?? {} }),
      )
      .catch(() => {});

    return () => abort.abort();
  }, [request, keys, date]);

  return arrived.request === request && request ? arrived.standing : null;
}
