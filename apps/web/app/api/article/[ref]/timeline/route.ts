import { readTimeline } from "@wtt/package-engine";

import { decoded, respond } from "@/lib/respond";

export const GET = (
  _request: Request,
  context: RouteContext<"/api/article/[ref]/timeline">,
) =>
  respond(async () => {
    const { ref } = await context.params;

    return readTimeline(decoded(ref));
  });
