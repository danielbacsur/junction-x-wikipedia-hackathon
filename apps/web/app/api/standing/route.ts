import { readStanding } from "@wtt/package-engine";

import { param, respond } from "@/lib/respond";

/** Whether passages, given as "page:hash" pairs, also stood on a date. */
export const GET = (request: Request) =>
  respond(async () => {
    const keys = (param(request, "keys") ?? "").split(",").flatMap((key) => {
      const [pageId, hash] = key.split(":");

      return pageId && hash ? [{ pageId: Number(pageId), hash }] : [];
    });

    return readStanding(keys, param(request, "date"));
  });
