const KEYWORDS =
  /\b(WITH SYSTEM VERSIONING|WITH|SELECT|FROM|JOIN|LEFT JOIN|USING|ON|WHERE|AND|OR|GROUP BY|ORDER BY|HAVING|LIMIT|AS|UNION ALL|UNION|IN|IS NOT NULL|IS NULL|NOT NULL|NOT|OVER|DESC|ASC|INSERT IGNORE INTO|INSERT INTO|VALUES|FOR SYSTEM_TIME AS OF TIMESTAMP|FOR SYSTEM_TIME ALL|PERIOD FOR SYSTEM_TIME|IN BOOLEAN MODE|AGAINST|MATCH|COALESCE|ROW_NUMBER|GROUP_CONCAT|SEPARATOR|REPEAT|CONCAT|VEC_DISTANCE_COSINE|VEC_FromText|VECTOR INDEX|VECTOR|FULLTEXT|PRIMARY KEY|KEY|CREATE TABLE|SET|COUNT|SUM|MIN|MAX|HEX|DISTINCT|EXISTS|LAG|PARTITION BY)\b/g;

const TIME = /^(FOR SYSTEM_TIME|WITH SYSTEM VERSIONING|PERIOD FOR|VEC_|VECTOR)/;

/** SQL with the words MariaDB reads as commands in ink, and time travel in red. */
export function Sql({ text }: { text: string }) {
  const parts = text.split(KEYWORDS);

  return (
    <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed whitespace-pre text-ink-soft">
      {parts.map((part, index) =>
        index % 2 === 0 ? (
          part
        ) : (
          <b
            key={index}
            className={`font-medium ${TIME.test(part) ? "text-rubric" : "text-ink"}`}
          >
            {part}
          </b>
        ),
      )}
    </pre>
  );
}
