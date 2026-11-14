import { Sql } from "@/components/sql";

export type Fact = { value: string; label: React.ReactNode };

export type Query = { about: string; text: string };

/** A number in the red of the page's headlines. */
export function N({ children }: { children: React.ReactNode }) {
  return <span className="text-rubric tabular-nums">{children}</span>;
}

/**
 * One finding: which lab it is from, the finding as a sentence, the chart,
 * what was measured and what it does not show, and the SQL that produced it.
 */
export function Section({
  id,
  lab,
  title,
  figure,
  facts,
  queries,
  source,
  children,
}: {
  id: string;
  lab: string;
  title: React.ReactNode;
  figure: React.ReactNode;
  facts?: Fact[];
  queries: Query[];

  /** The lab's folder, where the scripts and result files are. */
  source: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-rule pt-8">
      <p className="text-xs tracking-wide text-ink-faint uppercase">{lab}</p>
      <h2 className="mt-2 max-w-4xl font-serif text-3xl leading-[1.15] tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>

      <div className="mt-7 flex flex-col gap-4">{figure}</div>

      <div className="mt-6 grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex max-w-3xl flex-col gap-3 leading-relaxed text-ink-soft">
          {children}
        </div>

        {facts && (
          <dl className="h-fit divide-y divide-rule border-y border-rule">
            {facts.map((fact) => (
              <div key={fact.value} className="py-2.5">
                <dt className="font-serif text-xl tabular-nums">
                  {fact.value}
                </dt>
                <dd className="text-xs leading-relaxed text-ink-faint">
                  {fact.label}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <details className="group mt-6 rounded border border-rule bg-paper-raised">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 text-sm [&::-webkit-details-marker]:hidden">
          <span className="font-mono text-xs text-rubric group-open:hidden">
            ▸
          </span>
          <span className="hidden font-mono text-xs text-rubric group-open:inline">
            ▾
          </span>
          <span className="font-medium">SQL</span>
          <span className="text-ink-faint">
            {queries.length} {queries.length === 1 ? "statement" : "statements"}
          </span>
          <span className="ml-auto truncate font-mono text-[11px] text-ink-faint">
            {source}
          </span>
        </summary>

        <ol className="divide-y divide-rule border-t border-rule">
          {queries.map((query) => (
            <li key={query.about} className="px-4 py-3">
              <p className="mb-1.5 text-[11px] text-ink-faint">{query.about}</p>
              <Sql text={query.text} />
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
