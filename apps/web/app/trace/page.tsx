import type { Metadata } from "next";
import { Suspense } from "react";

import { TraceClaim } from "@/components/trace/trace";

export const metadata: Metadata = {
  title: "Trace",
  description:
    "Paste a claim and see every wording in the edit history that means the same: " +
    "when it first appeared, how long it stood and who wrote it.",
};

export default function TracePage() {
  return (
    <Suspense>
      <TraceClaim />
    </Suspense>
  );
}
