"use client";

import { useEffect, useState } from "react";

export type Loaded<Data> = {
  data: Data | null;
  error: string;
  loading: boolean;
};

/**
 * Fetches JSON from one of our routes whenever the address changes, and
 * drops an answer that belongs to an address the page has moved on from.
 * While a new address loads, the previous data stays on screen: a date
 * dial that blanks the page on every step would be unusable.
 */
export function useJson<Data>(url: string | null): Loaded<Data> {
  const [arrived, setArrived] = useState<{
    url: string | null;
    data: Data | null;
    error: string;
  }>({ url: null, data: null, error: "" });

  useEffect(() => {
    if (!url) return;

    const abort = new AbortController();

    fetch(url, { signal: abort.signal })
      .then(async (response) => {
        const body = (await response.json()) as Data & { error?: string };

        setArrived(
          response.ok
            ? { url, data: body, error: "" }
            : {
                url,
                data: null,
                error: body.error ?? `error ${response.status}`,
              },
        );
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;

        setArrived({
          url,
          data: null,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => abort.abort();
  }, [url]);

  if (!url) return { data: null, error: "", loading: false };

  const current = arrived.url === url;

  return {
    data: current || !arrived.error ? arrived.data : null,
    error: current ? arrived.error : "",
    loading: !current,
  };
}
