import { Suspense } from "react";
import { Historian } from "@/components/agent/historian";

export default function AgentPage() {
  return (
    <Suspense>
      <Historian />
    </Suspense>
  );
}
