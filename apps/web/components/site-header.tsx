import Link from "next/link";
import { Suspense } from "react";

import { SiteNav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center gap-x-8 px-5">
        <Link href="/" className="group flex h-14 items-baseline gap-2 pt-4">
          {/* The mark is the name written twice, the older copy showing through. */}
          <span className="relative font-serif text-xl font-medium tracking-tight">
            <span
              aria-hidden
              className="absolute -top-px left-0.5 text-rubric opacity-30 blur-[0.4px]"
            >
              Palimpsest
            </span>
            <span className="relative">Palimpsest</span>
          </span>
          <span className="hidden text-xs text-ink-faint sm:inline">
            Wikipedia, through time
          </span>
        </Link>

        {/* Which page is current is only known per request, so the links
            come without a mark first and gain it when the address is read. */}
        <Suspense fallback={<SiteNav pathname="" />}>
          <SiteNav />
        </Suspense>
      </div>
    </header>
  );
}
