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

function Links({ pathname }: { pathname: string }) {
  return (
    // On a phone the links take a row of their own and scroll sideways.
    <nav className="-mx-2 flex w-full items-center gap-1 overflow-x-auto pb-2 text-sm sm:mx-0 sm:ml-auto sm:w-auto sm:pb-0">
      {PAGES.map((page) => {
        const here =
          pathname !== "" &&
          (page.href === "/"
            ? pathname === "/"
            : pathname.startsWith(page.href));

        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={here ? "page" : undefined}
            className={`rounded px-2.5 py-1.5 transition-colors ${
              here ? "bg-paper-sunk text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {page.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Current() {
  return <Links pathname={usePathname()} />;
}

/** The page links. Given a pathname it renders at once, without reading the address. */
export function SiteNav({ pathname }: { pathname?: string }) {
  return pathname === undefined ? <Current /> : <Links pathname={pathname} />;
}
