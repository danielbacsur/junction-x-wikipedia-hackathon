/** The first and last moment the dataset knows about, in UTC. */
export const FIRST_EDIT = "2003-02-21 13:15:35";
export const LAST_EDIT = "2026-10-01 10:59:12";

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Reads a date the way a person writes it and returns the last moment it
 * covers, as MariaDB reads a timestamp. "2008" is the end of 2008 and
 * "2008-06" the end of June. Nothing, "now" or a date past the dataset
 * returns null, which means the latest version we hold. That is 1 October
 * 2026, not live wikipedia.
 */
export const moment = (input?: string | null): string | null => {
  const text = input?.trim();
  if (!text || text === "now") return null;

  const parts =
    /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?(?:[T ](\d{1,2}):(\d{2})(?::(\d{2})(\.\d{1,6})?)?)?Z?$/.exec(
      text,
    );

  if (!parts) throw new Error(`"${input}" is not a date`);

  const year = Number(parts[1]);
  const month = parts[2] ? Number(parts[2]) : 12;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = parts[3] ? Number(parts[3]) : lastDay;

  // MariaDB's TIMESTAMP starts in 1970, and nothing here is older than 2003.
  const real =
    year >= 1970 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= lastDay &&
    Number(parts[4] ?? 0) <= 23 &&
    Number(parts[5] ?? 0) <= 59 &&
    Number(parts[6] ?? 0) <= 59;

  if (!real) throw new Error(`"${input}" is not a date`);

  const time = parts[4]
    ? `${pad(Number(parts[4]))}:${parts[5]}:${parts[6] ?? "00"}${parts[7] ?? ""}`
    : "23:59:59";

  const at = `${year}-${pad(month)}-${pad(day)} ${time}`;

  return at >= LAST_EDIT ? null : at;
};

/** The clause that pins a versioned table to a moment, or nothing for now. */
export const asOf = (at: string | null) =>
  at ? "FOR SYSTEM_TIME AS OF TIMESTAMP ?" : "";

/** The parameter that goes with asOf, when there is one. */
export const when = (at: string | null) => (at ? [at] : []);
