import { traceClaim } from "@wtt/package-engine";

import { param, respond } from "@/lib/respond";

export const GET = (request: Request) =>
  respond(async () => {
    const claim = param(request, "claim");

    return claim ? traceClaim(claim) : { traces: [], earliest: null, sql: [] };
  });
