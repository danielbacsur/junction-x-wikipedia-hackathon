import { Suspense } from "react";

import { Article } from "@/components/read/article";

export default function ReadArticle() {
  return (
    <Suspense>
      <Article />
    </Suspense>
  );
}
