/** A share as "85.2 %", with a space that does not break. */
export const percent = (share: number, digits = 0) =>
  `${(share * 100).toFixed(digits)} %`;

/** "1925-03-01" as "1 March 1925", for a date that a headline is about. */
export const fullDay = (date: string) =>
  new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/** Seconds as the unit a reader would use for them. */
export const duration = (seconds: number) => {
  if (seconds < 120) return `${Math.round(seconds)} seconds`;
  if (seconds < 7_200) return `${(seconds / 60).toFixed(1)} minutes`;

  return `${(seconds / 3_600).toFixed(1)} hours`;
};

/** A position across a plot whose width is not known: a percentage of it. */
export const across = (share: number) => `${(share * 100).toFixed(3)}%`;
