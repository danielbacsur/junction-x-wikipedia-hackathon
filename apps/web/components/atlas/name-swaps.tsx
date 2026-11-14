import { swaps } from "./data";
import { Figure } from "./chart";
import { percent } from "./format";

const ACROSS = 25;
const PITCH = 12;

type Attempts = typeof swaps.toWhite;

/** One dot for every edit that tried the swap, the undone ones first. */
function Dots({ attempts }: { attempts: Attempts }) {
  const rows = Math.ceil(attempts.edits.length / ACROSS);

  return (
    <svg
      viewBox={`0 0 ${ACROSS * PITCH} ${rows * PITCH}`}
      role="img"
      aria-label={`${attempts.freshUndone} of ${attempts.fresh} edits replacing ${attempts.from} with ${attempts.to} were undone`}
      className="block w-full max-w-md"
    >
      {attempts.edits.map((edit, index) => (
        <circle
          key={edit.revId}
          cx={(index % ACROSS) * PITCH + PITCH / 2}
          cy={Math.floor(index / ACROSS) * PITCH + PITCH / 2}
          r={edit.onMainArticle ? 3.6 : 4.2}
          strokeWidth={edit.onMainArticle ? 1.6 : 0}
          className={`stroke-ink ${edit.undone ? "fill-removed" : "fill-added"}`}
        >
          <title>
            {`Revision ${edit.revId}, ${edit.savedAt} UTC: ${
              edit.undone
                ? `undone after ${edit.undoneAfterSeconds} seconds`
                : "not undone"
            }`}
          </title>
        </circle>
      ))}
    </svg>
  );
}

function Direction({ attempts }: { attempts: Attempts }) {
  return (
    <div>
      <p className="font-serif text-lg">
        {attempts.from} <span className="text-ink-faint">→</span> {attempts.to}
      </p>
      <p className="mt-1 flex items-baseline gap-3">
        <span className="font-serif text-5xl tabular-nums">
          {percent(attempts.freshUndone / attempts.fresh)}
        </span>
        <span className="text-sm text-ink-soft tabular-nums">
          {attempts.freshUndone} of {attempts.fresh} undone
        </span>
      </p>
      <div className="mt-3">
        <Dots attempts={attempts} />
      </div>
    </div>
  );
}

function Key({
  className,
  ring = false,
  children,
}: {
  className: string;
  ring?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="whitespace-nowrap">
      <svg
        width="12"
        height="12"
        aria-hidden
        className="mr-1.5 inline-block align-[-1px]"
      >
        <circle
          cx="6"
          cy="6"
          r={ring ? 4.2 : 5}
          strokeWidth={ring ? 1.6 : 0}
          className={`stroke-ink ${className}`}
        />
      </svg>
      {children}
    </span>
  );
}

/** The same edit in both directions, and what happened to it next. */
export function NameSwaps() {
  return (
    <Figure
      title="Edits that replaced one name with the other · every edit that was not itself a revert"
      read={
        <>
          One dot is one edit after which the first name occurs fewer times and
          the second more times than in the version before. The undone ones are
          drawn first, so the filled-in share of each block is the share undone.
        </>
      }
    >
      <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        <Direction attempts={swaps.toWhite} />
        <Direction attempts={swaps.toCivil} />
      </div>
      <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-faint">
        <Key className="fill-removed">later undone</Key>
        <Key className="fill-added">not undone by 1 October 2026</Key>
        <Key className="fill-paper-raised" ring>
          ringed: on the article Suomen sisällissota itself
        </Key>
      </p>
    </Figure>
  );
}
