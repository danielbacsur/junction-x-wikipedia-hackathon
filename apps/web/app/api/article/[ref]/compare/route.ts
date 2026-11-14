import { compareArticle } from "@wtt/package-engine";

import { decoded, param, respond } from "@/lib/respond";

export const GET = (
  request: Request,
  context: RouteContext<"/api/article/[ref]/compare">,
) =>
  respond(async () => {
    const { ref } = await context.params;
    const from = param(request, "from");

    if (!from) throw new Error('"" is not a date');

    return compareArticle(decoded(ref), from, param(request, "to"));
  });
