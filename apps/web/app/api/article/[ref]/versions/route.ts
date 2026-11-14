import { listVersions } from "@wtt/package-engine";

import { decoded, param, respond } from "@/lib/respond";

export const GET = (
  request: Request,
  context: RouteContext<"/api/article/[ref]/versions">,
) =>
  respond(async () => {
    const { ref } = await context.params;

    return listVersions(decoded(ref), {
      before: param(request, "before"),
      limit: Number(param(request, "limit") ?? 30),
    });
  });
