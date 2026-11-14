# Design

Palimpsest: a page written over many times, with the older writing still
showing through. The interface is paper and ink. This file is the contract
for every page; `app/page.tsx` with `components/ask/*` is the reference
implementation, so read those before building anything.

## Principles

1. **Evidence and interpretation never look the same.** What MariaDB
   returned (a wording, its dates, who saved it) is set in ink. What we
   infer (two wordings being "the same paragraph reworded", a similarity
   score) is always labelled as our reading and shows its score.
2. **Every panel shows its SQL.** Each API response carries `sql`, the
   statements that produced it with timings. Put a `<SqlDrawer sql={...} />`
   under the panel it belongs to. The judges are MariaDB engineers.
3. **Time is red.** `rubric` marks dates, the dial, and time-travel clauses
   in SQL. It is not a general accent and never a background for big areas.
4. **The latest version is 1 October 2026, not "live Wikipedia".** Say
   "latest in the dataset" or "today" only next to that date.
5. **Calm.** No shadows, no gradients, no cards inside cards, no emoji, no
   icons library. One hairline border (`border-rule`) and generous space.

## Tokens (Tailwind classes, light and dark handled by CSS variables)

| Use | Class |
| --- | --- |
| Page, raised panel, sunk strip | `bg-paper`, `bg-paper-raised`, `bg-paper-sunk` |
| Text: main, secondary, tertiary | `text-ink`, `text-ink-soft`, `text-ink-faint` |
| Hairlines | `border-rule` |
| Time, dates, citations | `text-rubric`, `bg-rubric-wash` |
| Added / still standing | `text-added`, `bg-added-wash` |
| Removed / gone | `text-removed`, `bg-removed-wash` |
| Rare highlight (a record, a first) | `text-gold` |

## Type

- `font-serif` (Newsreader): anything from Wikipedia, headlines, big dates
  and numbers. Body passages at `text-[15px] leading-relaxed`, answers at
  `text-[19px]`, page titles `text-4xl sm:text-5xl tracking-tight`.
- `font-sans` (Geist): interface text, labels, buttons. Labels are
  `text-xs tracking-wide text-ink-faint uppercase`.
- `font-mono` (Geist Mono): SQL, hashes, revision ids.
- Numbers that change or line up use `tabular-nums`.

## Layout

- Pages are `<main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-12 pb-24">`.
  Reading columns are `max-w-3xl`.
- Panels: `rounded border border-rule bg-paper-raised p-4`.
- Chips: `rounded-sm px-1.5 py-px text-[10px] tracking-wide uppercase` on a
  wash colour.
- Things that arrive get `className="rise"`; streaming text gets `writing`.

## Building blocks that exist

- `components/time-dial.tsx`: the year dial (null = latest).
- `components/sql-drawer.tsx`: the SQL panel.
- `components/inline.tsx`: renders a block's `nodes` with article links.
- `lib/format.ts`: `day()`, `minute()`, `span()`, `number()`, `readHref()`,
  `jsonLines()`, and the constants `LATEST`, `FIRST_YEAR`, `LAST_YEAR`.
- `components/ask/use-ask.ts` shows the pattern for fetching inside an
  effect without calling setState synchronously (the lint rule
  `react-hooks/set-state-in-effect` is on, and the React Compiler is on).

## Next.js 16 rules that bite

- Read `apps/web/AGENTS.md`: this is not the Next.js in your training data.
  Docs for the installed version are in `node_modules/next/dist/docs/`.
- Cache Components is on. A page is a server component that renders a
  client component inside `<Suspense>`; the client component reads the
  route with `useParams()` / `useSearchParams()` and fetches `/api/*`.
  Do not query the database from a page.
- Route handlers get `context: RouteContext<"/api/...">` and
  `await context.params`.
- Charts are hand-written SVG. Do not add dependencies.

## Checks before you say a page is done

`npm run lint -w @wtt/app-web` and `npm run typecheck -w @wtt/app-web` pass,
`npx prettier --check apps/web` is clean, and you have looked at the page
in both colour schemes at 1280 and 390 pixels wide.
