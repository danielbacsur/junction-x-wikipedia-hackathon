/** Words that went and words that came, as a reader of a manuscript marks them. */
export function Words({
  words,
}: {
  words: { text: string; added?: boolean; removed?: boolean }[];
}) {
  return (
    <>
      {words.map((word, index) =>
        word.added ? (
          <ins key={index} className="bg-added-wash text-added no-underline">
            {word.text}
          </ins>
        ) : word.removed ? (
          <del key={index} className="bg-removed-wash text-removed">
            {word.text}
          </del>
        ) : (
          word.text
        ),
      )}
    </>
  );
}
