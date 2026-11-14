import { readArticle } from "@wtt/package-engine";

import { decoded, param, respond } from "@/lib/respond";

export const GET = (
  request: Request,
  context: RouteContext<"/api/article/[ref]">,
) =>
  respond(async () => {
    const { ref } = await context.params;

    return readArticle(decoded(ref), param(request, "date"));
  });
