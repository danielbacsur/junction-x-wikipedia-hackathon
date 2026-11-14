import { searchArticles } from "@wtt/package-engine";

import { param, respond } from "@/lib/respond";

export const GET = (request: Request) =>
  respond(async () => {
    const question = param(request, "q");
    if (!question) return { hits: [], sql: [] };

    const mode = param(request, "mode");

    return searchArticles(question, {
      mode: mode === "vector" || mode === "keyword" ? mode : "hybrid",
      lang: param(request, "lang"),
      everything: param(request, "everything") === "1",
      limit: 12,
    });
  });
