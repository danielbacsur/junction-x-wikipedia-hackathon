import { listFeatured } from "@wtt/package-engine";
import { connection } from "next/server";

import { respond } from "@/lib/respond";

export const GET = () =>
  respond(async () => {
    // Nothing in the request marks this as live data, so say so.
    await connection();

    return listFeatured();
  });
