import { searchPassages } from "@wtt/package-engine";

import { param, respond } from "@/lib/respond";

export const GET = (request: Request) =>
  respond(async () => {
    const question = param(request, "q");
    if (!question) return { hits: [], sql: [] };

    const mode = param(request, "mode");

    return searchPassages(question, {
      date: param(request, "date"),
      mode: mode === "vector" || mode === "keyword" ? mode : "hybrid",
      limit: 12,
    });
  });
