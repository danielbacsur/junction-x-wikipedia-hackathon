import { Sql } from "@/components/sql";
import evaluation from "@/content/evaluation.json";
import validation from "@/content/validation.json";
import { number } from "@/lib/format";

export const metadata = { title: "Method" };

const PASSAGE_TABLE = `CREATE TABLE passage (
  page_id   INT UNSIGNED NOT NULL,
  hash      BINARY(8)    NOT NULL,     -- the wording, stored once in passage_text
  dup       SMALLINT UNSIGNED NOT NULL, -- nth copy within the article
  ord       VARBINARY(255) NOT NULL,   -- sorts the article's blocks
  gap       INT UNSIGNED NOT NULL,     -- empty lines right before it
  born_rev  INT UNSIGNED NOT NULL,     -- the version that wrote the wording
  slot      INT UNSIGNED NOT NULL,     -- our reading: which paragraph it is
  row_start TIMESTAMP(6) GENERATED ALWAYS AS ROW START INVISIBLE,
  row_end   TIMESTAMP(6) GENERATED ALWAYS AS ROW END INVISIBLE,
  PERIOD FOR SYSTEM_TIME (row_start, row_end),
  PRIMARY KEY (page_id, hash, dup)
) WITH SYSTEM VERSIONING;`;

const REBUILD = `SELECT GROUP_CONCAT(CONCAT(REPEAT('\\n', p.gap), t.wikitext)
                    ORDER BY p.ord SEPARATOR '\\n')
FROM passage FOR SYSTEM_TIME AS OF TIMESTAMP '2008-12-31 23:59:59' AS p
JOIN passage_text AS t USING (hash)
WHERE p.page_id = 1256;`;

const SEARCH = `WITH v AS (
  SELECT hash, distance, ROW_NUMBER() OVER (ORDER BY distance) AS place
  FROM (SELECT hash, VEC_DISTANCE_COSINE(embedding, @question) AS distance
        FROM passage_vector ORDER BY distance LIMIT 300) AS nearest),
k AS (
  SELECT hash, ROW_NUMBER() OVER (ORDER BY relevance DESC) AS place
  FROM (SELECT hash, MATCH(stems) AGAINST ('+talvisod kaatu' IN BOOLEAN MODE) AS relevance
        FROM passage_text
        WHERE MATCH(stems) AGAINST ('+talvisod kaatu' IN BOOLEAN MODE)
        ORDER BY relevance DESC LIMIT 300) AS matched)
SELECT r.title, t.text, b.saved_at AS written, b.user AS written_by,
       COALESCE(1 / (60 + v.place), 0) + COALESCE(0.4 / (60 + k.place), 0) AS score
FROM (SELECT hash FROM v UNION SELECT hash FROM k) AS found
LEFT JOIN v USING (hash)
LEFT JOIN k USING (hash)
JOIN passage  FOR SYSTEM_TIME AS OF TIMESTAMP '2007-12-31 23:59:59' AS p USING (hash)
JOIN revision FOR SYSTEM_TIME AS OF TIMESTAMP '2007-12-31 23:59:59' AS r ON r.page_id = p.page_id
JOIN passage_text AS t USING (hash)
JOIN edit AS b ON b.rev_id = p.born_rev
WHERE b.reverted_by IS NULL
ORDER BY score DESC LIMIT 8;`;

const LIFE = `SELECT row_start, row_end, born_rev
FROM passage FOR SYSTEM_TIME ALL
WHERE page_id = 1256 AND hash = x'af55da97074908b8'
ORDER BY row_start;`;

const FINDINGS = [
  {
    title:
      "A versioned table can carry a vector index, and you should not search it as of a date.",
    body: "FOR SYSTEM_TIME AS OF with ORDER BY VEC_DISTANCE_COSINE … LIMIT runs and uses the index. On 272,661 vectors with real edit lifetimes it found 13% of the true ten nearest at ef_search 80, and 23% at 1,000: the time filter is applied to what the index returns, and the index returns mostly dead rows. A plain vector table joined to lifetimes did no better (46% with 1,000 candidates, and 76.8% of its answers were a full page with a true neighbour missing). So the product finds the articles first and then compares every passage that stood in them that day, exactly: 100% recall in 20 ms.",
    source: "labs/temporal-ann",
  },
  {
    title: "Full-text search skips history rows.",
    body: "MATCH … AGAINST with FOR SYSTEM_TIME ALL returns current rows only, whether history was written by UPDATE or loaded with system_versioning_insert_history. LIKE does see them. That decided the design: every wording is stored once in a plain table with a full-text index, and the versioned table only says when it stood.",
    source: "packages/db/schema/005-passages.sql",
  },
  {
    title: "One common word turns a 50 ms full-text search into 25 seconds.",
    body: "Natural-language mode ranks every row that holds any word of the question, and “oli” or “suomen” are in most of 1.2 million wordings. A small table counts how many wordings each stem is in, so search sends only the rare stems and requires the rarest one.",
    source: "packages/engine/keywords.ts",
  },
  {
    title: "MariaDB has no Finnish stemmer, so the stems are a column.",
    body: "Mannerheim, Mannerheimin and Mannerheimille are three words to full-text search. Passages store their Snowball stems next to the text, and the question is stemmed the same way.",
    source: "packages/wikitext/stems.ts",
  },
  {
    title:
      "Storing paragraphs with lifetimes is sixteen times smaller than storing versions.",
    body: "862,076 whole copies are 12.2 GB of wikitext, 5.9 GB in a COMPRESSED column. The 1.63 million distinct wordings they are made of are 0.75 GB, and every version still rebuilds byte for byte.",
    source: "packages/ingest/verify.ts",
  },
  {
    title:
      "All 862,076 versions load in 103 seconds with their real timestamps.",
    body: "system_versioning_insert_history lets the loader write row_start and row_end, four files at a time, about 8,000 versions a second. MariaDB’s own demo loaded 50 articles; this is all 19,742.",
    source: "packages/ingest/revisions.ts",
  },
  {
    title:
      "A range join took ten minutes; the sequence engine took five seconds.",
    body: "Marking every version undone by a revert joined edits on seq BETWEEN two columns, and the optimizer read every edit of the page for every revert. Joining seq_1_to_5000 turns each undone version into a primary key lookup.",
    source: "packages/ingest/edits.ts",
  },
  {
    title: "Wikipedia’s oldest sha1 values do not fit its own text.",
    body: "A handful of versions from 2003 to 2005 were hashed before the text was converted to UTF-8, so their published sha1 matches no text in the dump. Everything later matches exactly.",
    source: "packages/ingest/validate.ts",
  },
];

const LIMITS = [
  "The latest version is 1 October 2026 for histories and August 2025 for current article text. Neither is live Wikipedia.",
  "Only Finnish articles on the history of Finland have their history loaded (19,742 of 568,416).",
  "Vectors are computed on this laptop at about 40 paragraphs a second, most edited articles first, so not every wording has one yet. Passages a question needs are embedded on the spot.",
  "Which article a question is about is decided with today’s article vectors, which know things the past did not. What gets cited is decided from passages that stood on the date.",
  "Which wording replaced which is our reading of the edits, shown with a similarity score. Lifetimes and authors are not.",
  "The answer is written by a 5 billion parameter model running locally. It translates loosely, which is why every sentence must cite a passage and uncited ones are marked.",
];

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-paper-raised p-5">
      <div className="font-serif text-3xl tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-ink-faint">{label}</div>
    </div>
  );
}

function Statement({
  title,
  about,
  sql,
}: {
  title: string;
  about: string;
  sql: string;
}) {
  return (
    <div className="rounded border border-rule bg-paper-raised">
      <div className="border-b border-rule px-4 py-3">
        <h3 className="font-serif text-xl">{title}</h3>
        <p className="mt-1 text-sm text-ink-soft">{about}</p>
      </div>
      <div className="px-4 py-3">
        <Sql text={sql} />
      </div>
    </div>
  );
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

export default function Method() {
  const { corpus, checks, tables } = validation;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-12 pb-24">
      <section className="max-w-3xl">
        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          A paragraph is a row that lives{" "}
          <em className="text-rubric">as long as its wording stands</em>.
        </h1>
        <p className="mt-4 text-ink-soft">
          Everything here is one MariaDB 12.3 database on a laptop. Every saved
          version of every article is cut into blocks, and each block is a row
          in a system-versioned table: inserted by the edit that wrote its
          wording, ended by the edit that changed, moved or removed it. Its
          history rows, joined where they touch, are its lifetimes. Vectors and
          full-text search find the wordings, and the versioned table says when
          each one was true.
        </p>
      </section>

      <section className="mt-10 grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
        <Figure
          value="862,076"
          label="saved versions, 2003 to 1 Oct 2026, with Wikipedia’s real edit times"
        />
        <Figure value="19,742" label="articles with their whole history" />
        <Figure
          value={number(corpus.wordings)}
          label="distinct wordings those versions are made of"
        />
        <Figure
          value={number(corpus.embeddedWordings)}
          label="wordings with a vector so far, growing in the background"
        />
        <Figure
          value="568,416"
          label="current Finnish articles searchable by title"
        />
        <Figure
          value={`${Math.round(corpus.wholeCopyMb / corpus.wordingMb)}×`}
          label={`smaller as wordings (${(corpus.wordingMb / 1000).toFixed(2)} GB) than as whole copies (${(corpus.wholeCopyMb / 1000).toFixed(1)} GB of wikitext)`}
        />
      </section>

      <section className="mt-16 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <h2 className="font-serif text-3xl">The table</h2>
          <p className="mt-3 text-ink-soft">
            The key is the hash of the wording, because only that is evidence:
            the same text is the same row whenever it returns. A revert
            re-inserts the key, so a paragraph that vandals removed and editors
            restored has two history rows with a gap between them.
          </p>
          <p className="mt-3 text-ink-soft">
            Blocks sort by a growing order key, so an edit rewrites only the
            blocks it touched.{" "}
            <code className="font-mono text-[13px]">slot</code> is the one
            column that is our opinion: which earlier wording this one most
            likely replaced. Every page keeps it apart from the rest.
          </p>
          <p className="mt-3 text-ink-soft">
            The words themselves sit in{" "}
            <code className="font-mono text-[13px]">passage_text</code>, once
            per wording, with their Finnish stems and a full-text index, and the
            vectors in{" "}
            <code className="font-mono text-[13px]">passage_vector</code>.
            Neither is versioned. Time always comes from joining this table.
          </p>
        </div>
        <div className="rounded border border-rule bg-paper-raised px-4 py-3">
          <Sql text={PASSAGE_TABLE} />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Three statements</h2>
        <div className="mt-5 flex flex-col gap-4">
          <Statement
            title="An article as it stood on a day"
            about="MariaDB rebuilds the exact wikitext of Talvisota at the end of 2008 from its blocks. Hashing the result gives the sha1 Wikipedia published for that version."
            sql={REBUILD}
          />
          <Statement
            title="What Wikipedia said about a question on a day"
            about="The vector index and the full-text index each name candidates from all of history. The join with the versioned table keeps the ones that stood that day, and drops anything that arrived through an edit that was reverted within thirty days by a revert that itself stood."
            sql={SEARCH}
          />
          <Statement
            title="The life of one paragraph"
            about="Every row one paragraph of Talvisota about Estonia has had: it was written in 2006 and came back four times before 2009. A row also ends when a paragraph only moves, so rows that touch are read as one stay."
            sql={LIFE}
          />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">What we found</h2>
        <p className="mt-2 max-w-3xl text-ink-soft">
          Things we measured about MariaDB while building this, including the
          ones that went against what we hoped.
        </p>
        <ol className="mt-6 grid gap-px overflow-hidden rounded border border-rule bg-rule lg:grid-cols-2">
          {FINDINGS.map((finding, index) => (
            <li key={finding.title} className="bg-paper-raised p-5">
              <div className="mb-1 font-mono text-[11px] text-rubric">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="font-serif text-xl leading-snug">
                {finding.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {finding.body}
              </p>
              <p className="mt-3 font-mono text-[11px] text-ink-faint">
                {finding.source}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Checked, not assumed</h2>
        <p className="mt-2 max-w-3xl text-ink-soft">
          <code className="font-mono text-[13px]">npm run validate</code>{" "}
          compares the database with the Parquet files it came from and with
          itself. Last run {validation.validatedAt.slice(0, 10)}:{" "}
          {validation.passed ? "every check passed" : "some checks failed"}.
        </p>
        <ol className="mt-5 divide-y divide-rule rounded border border-rule bg-paper-raised">
          {checks.map((check) => (
            <li key={check.name} className="flex gap-4 px-4 py-3">
              <span
                className={`mt-0.5 h-fit rounded-sm px-1.5 py-px text-[10px] tracking-wide uppercase ${
                  check.ok
                    ? "bg-added-wash text-added"
                    : "bg-removed-wash text-removed"
                }`}
              >
                {check.ok ? "passed" : "failed"}
              </span>
              <div>
                <p className="font-serif text-lg">{check.name}</p>
                <p className="text-sm text-ink-soft">{check.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Finding the right article</h2>
        <p className="mt-2 max-w-3xl text-ink-soft">
          MariaDB wrote {evaluation.questions} test questions for its own demo,
          in English, Swedish and Finnish, each with the article that answers
          it. The first row repeats their setup on our database. A hit is the
          right topic in any language.
        </p>
        <div className="mt-5 overflow-x-auto rounded border border-rule bg-paper-raised">
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-wide text-ink-faint uppercase">
              <tr className="border-b border-rule">
                <th className="px-4 py-2 font-normal">Search</th>
                <th className="px-4 py-2 text-right font-normal">First</th>
                <th className="px-4 py-2 text-right font-normal">Top 5</th>
                <th className="px-4 py-2 text-right font-normal">Top 10</th>
                <th className="px-4 py-2 text-right font-normal">
                  About presidents, top 5
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule tabular-nums">
              {evaluation.modes.map((mode) => (
                <tr key={mode.mode}>
                  <td className="px-4 py-2.5">
                    <span className="font-serif text-lg">{mode.mode}</span>
                    <span className="block text-xs text-ink-faint">
                      {mode.about}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {percent(mode.groups.all.hit1)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {percent(mode.groups.all.hit5)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {percent(mode.groups.all.hit10)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {percent(mode.groups["about presidents"].hit5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          37 questions is a small set: one question is about three points. The
          last row counts the articles of the passages an answer would cite,
          which is a harder test than naming the article.
        </p>
      </section>

      <section className="mt-16 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl">What is in the database</h2>
          <table className="mt-4 w-full text-sm tabular-nums">
            <tbody className="divide-y divide-rule">
              {tables.map((table) => (
                <tr key={table.name}>
                  <td className="py-1.5 font-mono text-[13px]">{table.name}</td>
                  <td className="py-1.5 text-right text-ink-soft">
                    {number(table.mb)} MB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="font-serif text-3xl">What this is not</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-ink-soft">
            {LIMITS.map((limit) => (
              <li key={limit} className="border-l-2 border-rule pl-3">
                {limit}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
