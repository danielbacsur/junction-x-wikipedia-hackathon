/** Small, text-only Markdown renderer: source text is never interpreted as HTML. */
function Inline({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((piece, i) =>
    piece.startsWith("**") && piece.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {piece.slice(2, -2)}
      </strong>
    ) : (
      piece
    ),
  );
}

export function Reply({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  return (
    <div
      className={`space-y-3 break-words font-serif text-[19px] leading-relaxed ${streaming ? "writing" : ""}`}
    >
      {text.split(/\n\s*\n/).map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={i} className="list-disc space-y-2 pl-5">
              {lines.map((line, j) => (
                <li key={j}>
                  <Inline text={line.replace(/^\s*[-*]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            <Inline text={block.replace(/^#{1,6}\s+/, "")} />
          </p>
        );
      })}
    </div>
  );
}
