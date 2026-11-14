"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES = [
  { href: "/", label: "Ask" },
  { href: "/read", label: "Read" },
  { href: "/trace", label: "Trace" },
  { href: "/atlas", label: "Atlas" },
  { href: "/agent", label: "Agent" },
  { href: "/method", label: "Method" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-5">
        <Link href="/" className="group flex items-baseline gap-2">
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

        <nav className="ml-auto flex items-center gap-1 text-sm">
          {PAGES.map((page) => {
            const here =
              page.href === "/"
                ? pathname === "/"
                : pathname.startsWith(page.href);

            return (
              <Link
                key={page.href}
                href={page.href}
                aria-current={here ? "page" : undefined}
                className={`rounded px-2.5 py-1.5 transition-colors ${
                  here
                    ? "bg-paper-sunk text-ink"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {page.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
