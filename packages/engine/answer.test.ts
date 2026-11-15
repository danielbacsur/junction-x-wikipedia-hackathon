import { describe, expect, it } from "vitest";
import { LAST_EDIT, moment } from "./time.ts";
import { checkAnswer } from "./answer.ts";
describe("moment", () => {
  it("reads a year, a month or a day as the last moment it covers", () => {
    expect(moment("2008")).toBe("2008-12-31 23:59:59");
    expect(moment("2008-02")).toBe("2008-02-29 23:59:59");
    expect(moment("2008-06-01")).toBe("2008-06-01 23:59:59");
    expect(moment("2008-06-01 12:30")).toBe("2008-06-01 12:30:00");
  });

  it("treats nothing, now and dates past the dataset as the latest version", () => {
    expect(moment()).toBeNull();
    expect(moment("now")).toBeNull();
    expect(moment("2030")).toBeNull();
    expect(moment(LAST_EDIT)).toBeNull();
  });

  it("refuses what is not a date", () => {
    expect(() => moment("yesterday")).toThrow("is not a date");
    expect(() => moment("2008-13")).toThrow("is not a date");
    expect(() => moment("2008-02-30")).toThrow("is not a date");
    expect(() => moment("2008-01-01 99:99:99")).toThrow("is not a date");
    expect(() => moment("0001")).toThrow("is not a date");
  });

  it("keeps a moment to the microsecond", () => {
    expect(moment("2005-09-26T10:02:23.000001")).toBe(
      "2005-09-26 10:02:23.000001",
    );
  });
});

describe("checkAnswer", () => {
  const sources = [
    "Urho Kekkonen oli presidentti 1956–1982.",
    "Suomalaisten tappiot olivat 26 662 sotatoimissa kuollutta.",
    "Hän erosi 27. tammikuuta 1982 sairauden vuoksi.",
  ];

  it("keeps the citations of each sentence and marks the ones without", () => {
    const checked = checkAnswer(
      "Kekkonen oli presidentti 1956–1982. [1] Hän erosi sairauden vuoksi [1, 3]. " +
        "Tätä ei sanota missään. Väite viittaa olemattomaan. [9]",
      sources,
    );

    expect(checked.map((sentence) => sentence.cites)).toEqual([
      [1],
      [1, 3],
      [],
      [9],
    ]);
    expect(checked.map((sentence) => sentence.supported)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(checked[0].text).toBe("Kekkonen oli presidentti 1956–1982.");
  });

  it("does not end a sentence at the stop of a Finnish date", () => {
    const checked = checkAnswer(
      "Hän erosi 27. tammikuuta 1982 sairauden vuoksi [3].",
      sources,
    );

    expect(checked).toHaveLength(1);
    expect(checked[0].supported).toBe(true);
  });

  it("does not end a sentence at an initial", () => {
    const checked = checkAnswer(
      "K. J. Ståhlberg oli ensimmäinen presidentti [1].",
      sources,
    );

    expect(checked.map((sentence) => sentence.text)).toEqual([
      "K. J. Ståhlberg oli ensimmäinen presidentti.",
    ]);
  });

  it("accepts a number however it is grouped, and catches one that is not there", () => {
    const [right, wrong] = checkAnswer(
      "Finnish losses were 26,662 killed [2]. Another source says 95,348 [2].",
      sources,
    );

    expect(right).toMatchObject({ supported: true, missing: [] });
    expect(wrong).toMatchObject({ supported: false, missing: ["95,348"] });
  });

  it("does not find a number in digits that only stand next to each other", () => {
    const supported = (answer: string, passage: string) =>
      checkAnswer(answer, [passage])[0].supported;

    // The digits of "1956–1982" run together hold 5619, and "26 662" holds 26.
    expect(supported("There were 5619 deaths [1].", sources[0])).toBe(false);
    expect(supported("There were 26 killed [1].", sources[1])).toBe(false);

    // Two numbers in a list are each looked up, in any order.
    expect(
      supported("The figures are 27, 1982 [1].", "In 1982 there were 27."),
    ).toBe(true);
  });

  it("reads a decimal and a date the way each language writes them", () => {
    const supported = (answer: string, passage: string) =>
      checkAnswer(answer, [passage])[0].supported;

    expect(supported("About 2.5 million [1].", "noin 2,5 miljoonaa")).toBe(
      true,
    );
    expect(supported("About 25 million [1].", "noin 2,5 miljoonaa")).toBe(
      false,
    );
    expect(supported("It ended on 13 March 1940 [1].", "13.3.1940")).toBe(true);
    expect(supported("It ended on 14 March 1940 [1].", "13.3.1940")).toBe(
      false,
    );
  });
});
