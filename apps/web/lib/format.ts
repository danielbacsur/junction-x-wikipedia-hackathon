/** The last moment the dataset knows about. It is not live wikipedia. */
export const LATEST = "2026-10-01 10:59:12";
export const FIRST_YEAR = 2003;
export const LAST_YEAR = 2026;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2008-12-31 23:59:59" as "31 Dec 2008". Times in the data are UTC. */
export const day = (at: string | null | undefined) => {
  const moment = at ?? LATEST;
  const [year, month, date] = moment.slice(0, 10).split("-").map(Number);

  return `${date} ${MONTHS[month - 1]} ${year}`;
};

/** The same with hours and minutes, for a single edit. */
export const minute = (at: string) => `${day(at)}, ${at.slice(11, 16)} UTC`;

/** A span of days as a person would say it. */
export const span = (days: number) => {
  if (days < 1 / 24) return `${Math.max(1, Math.round(days * 1_440))} min`;
  if (days < 1) return `${Math.round(days * 24)} h`;
  if (days < 60) return `${Math.round(days)} days`;
  if (days < 730) return `${Math.round(days / 30.44)} months`;

  return `${(days / 365.25).toFixed(1)} years`;
};

export const number = (value: number) => value.toLocaleString("en");

/**
 * The page of an article here, as it stood at a moment. The moment is kept
 * to the microsecond: two edits can share a second, and a link that only
 * named the day would open whatever the article said by that evening.
 */
export const readHref = (title: string, at?: string | null) => {
  const date = at?.endsWith(" 23:59:59") ? at.slice(0, 10) : at;

  return `/read/${encodeURIComponent(title.replaceAll(" ", "_"))}${
    date ? `?date=${encodeURIComponent(date.replace(" ", "T"))}` : ""
  }`;
};

/** Reads a stream of JSON lines as they arrive. */
export async function* jsonLines<Event>(
  response: Response,
): AsyncGenerator<Event> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let rest = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    rest += decoder.decode(value, { stream: true });

    for (let end = rest.indexOf("\n"); end !== -1; end = rest.indexOf("\n")) {
      const line = rest.slice(0, end);
      rest = rest.slice(end + 1);
      if (line.trim()) yield JSON.parse(line) as Event;
    }
  }
}
