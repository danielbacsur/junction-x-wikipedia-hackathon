import { Suspense } from "react";

import { Ask } from "@/components/ask/ask";

export default function Home() {
  return (
    <Suspense>
      <Ask />
    </Suspense>
  );
}
