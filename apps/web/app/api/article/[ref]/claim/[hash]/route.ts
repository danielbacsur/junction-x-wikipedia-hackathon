import { readBiography } from "@wtt/package-engine";

import { respond } from "@/lib/respond";

export const GET = (
  _request: Request,
  context: RouteContext<"/api/article/[ref]/claim/[hash]">,
) =>
  respond(async () => {
    const { ref, hash } = await context.params;

    return readBiography(decodeURIComponent(ref), hash);
  });
