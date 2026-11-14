import { Suspense } from "react";

import { Library } from "@/components/read/library";

export const metadata = { title: "Read" };

export default function Read() {
  return (
    <Suspense>
      <Library />
    </Suspense>
  );
}
