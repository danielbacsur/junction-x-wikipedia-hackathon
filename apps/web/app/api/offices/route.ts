import {
  listTerms,
  termChanges,
  termConflicts,
  termHistory,
  whoHeld,
} from "@wtt/package-engine";

import { param, respond } from "@/lib/respond";

/**
 * Terms of office on two timelines. With a day it answers who held the
 * office that day according to Wikipedia on a date. The other forms hand
 * over the list on a date, every statement ever made, every change of a
 * stated date, and where the articles disagree with each other.
 */
export const GET = (request: Request) =>
  respond(async () => {
    const office = param(request, "office");
    const date = param(request, "date");
    const day = param(request, "day");

    if (param(request, "changes")) return termChanges(office);
    if (param(request, "conflicts")) {
      return termConflicts(office ?? "president");
    }
    if (param(request, "history")) return termHistory(office ?? "president");
    if (param(request, "list")) return listTerms(office ?? "president", date);

    if (!day) throw new Error('"" is not a date: a day is written 1925-03-01');

    return whoHeld(office ?? "president", day, date);
  });
