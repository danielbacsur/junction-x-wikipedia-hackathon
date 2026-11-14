import { readArticle } from "@wtt/package-engine";

import { param, respond } from "@/lib/respond";

export const GET = (
  request: Request,
  context: RouteContext<"/api/article/[ref]">,
) =>
  respond(async () => {
    const { ref } = await context.params;

    return readArticle(decodeURIComponent(ref), param(request, "date"));
  });
