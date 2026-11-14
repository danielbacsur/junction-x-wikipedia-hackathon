import { corpus } from "@/components/atlas/data";
import { HEADLINES, SECTIONS } from "@/components/atlas/sections";
import { number } from "@/lib/format";

export const metadata = { title: "Atlas" };

export default function Atlas() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-12 pb-24">
      <section className="max-w-3xl">
        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          What {number(corpus.edits)} edits say about how Finland’s history{" "}
          <em className="text-rubric">gets written</em>.
        </h1>
        <p className="mt-4 text-ink-soft">
          Every saved version of {number(corpus.articles)} Finnish Wikipedia
          articles on the history of Finland, from 2003 to 1 October 2026, is in
          one MariaDB database with its real edit times. These are the
          experiments we ran on it beyond the product: each has one number, a
          chart, what was counted and what it does not show, and the SQL that
          produced it.
        </p>
      </section>

      <nav
        aria-label="Findings"
        className="mt-10 grid gap-px overflow-hidden rounded border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5"
      >
        {HEADLINES.map((headline) => (
          <a
            key={headline.href}
            href={headline.href}
            className="group bg-paper-raised p-5 transition-colors hover:bg-paper-sunk"
          >
            <div className="font-serif text-3xl whitespace-nowrap tabular-nums">
              {headline.value}
            </div>
            <div className="mt-1 text-xs leading-relaxed text-ink-faint">
              {headline.label}
            </div>
            <div
              aria-hidden
              className="mt-2 font-mono text-xs text-rubric opacity-60 transition-opacity group-hover:opacity-100"
            >
              ↓
            </div>
          </a>
        ))}
      </nav>

      <div className="mt-16 flex flex-col gap-20">
        {SECTIONS.map(({ id, Finding }) => (
          <Finding key={id} />
        ))}
      </div>
    </main>
  );
}
