import type { Block } from "@wtt/package-engine";
import Link from "next/link";

import { readHref } from "@/lib/format";

/** A block's text with its links to other articles, kept on the date in view. */
export function Inline({
  nodes,
  date,
}: {
  nodes: Block["nodes"];
  date?: string | null;
}) {
  return (
    <>
      {nodes.map((node, index) =>
        typeof node === "string" ? (
          node
        ) : (
          <Link
            key={index}
            href={readHref(node.link, date)}
            className="underline decoration-rule decoration-1 hover:decoration-rubric"
          >
            {node.text}
          </Link>
        ),
      )}
    </>
  );
}
