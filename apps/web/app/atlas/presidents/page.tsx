import type { Metadata } from "next";
import { Suspense } from "react";

import { Presidents } from "@/components/offices/presidents";

export const metadata: Metadata = {
  title: "Two timelines",
  description:
    "Who was president of Finland on a day, according to Wikipedia as it stood on " +
    "another: one bitemporal MariaDB table built from the edit history.",
};

export default function PresidentsPage() {
  return (
    <Suspense>
      <Presidents />
    </Suspense>
  );
}
