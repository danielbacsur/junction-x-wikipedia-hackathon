import { describe, expect, it } from "vitest";

import {
  OPEN_END,
  PRESIDENT,
  PRIME_MINISTER,
  REGENT,
  collapse,
  normalize,
  officeBox,
  officeOf,
  parseBox,
  parseTerms,
} from "./infobox.ts";

// Every field below is one an editor really wrote in a president's infobox.
describe("parseTerms", () => {
  it("reads a term in each of the four ways it was written", () => {
    const kekkonen = [
      { from: "1956-03-01", to: "1982-01-27", openEnded: false, remark: null },
    ];

    expect(
      parseTerms(
        "[[1. maaliskuuta|1.3.]] [[1956]]–[[27. tammikuuta|27.1.]] [[1982]]",
      ).terms,
    ).toEqual(kekkonen);
    expect(
      parseTerms("[[1. maaliskuuta]] [[1956]] – [[27. tammikuuta]] [[1982]]")
        .terms,
    ).toEqual(kekkonen);
    expect(parseTerms("1.3.1956 – 27.1.1982").terms).toEqual(kekkonen);
    expect(
      parseTerms("1. maaliskuuta 1956 – 27. tammikuuta 1982").terms,
    ).toEqual(kekkonen);
  });

  it("reads a holder still in office as open ended", () => {
    const sitting = [
      { from: "2012-03-01", to: OPEN_END, openEnded: true, remark: null },
    ];

    expect(parseTerms("1.3.2012 –").terms).toEqual(sitting);
    expect(parseTerms("[[1. maaliskuuta|1.3.]] [[2012]] alkaen").terms).toEqual(
      sitting,
    );
  });

  it("reads the label of a link, because that is what the reader saw", () => {
    // The link points at 27 May and the label says 27 April.
    expect(
      parseTerms(
        "[[27. marraskuuta|27.11.]][[1917]]-[[27. toukokuuta|27.4.]][[1918]]",
      ).terms,
    ).toEqual([
      { from: "1917-11-27", to: "1918-04-27", openEnded: false, remark: null },
    ]);
  });

  it("ignores references, entities and markup around the dates", () => {
    expect(
      parseTerms(
        "25.7.1919&nbsp;–&nbsp;2.3.1925&thinsp;<ref>{{Kirjaviite | Tekijä = Esko Hakkila " +
          "| Vuosi = 1939 | Luettu = 7.11.2013 }}</ref><ref group=H>1.3.1925 sattui sunnuntaiksi.</ref>",
      ),
    ).toEqual({
      terms: [
        {
          from: "1919-07-25",
          to: "1925-03-02",
          openEnded: false,
          remark: null,
        },
      ],
      refused: [],
    });
  });

  it("lets the start borrow the year of the end", () => {
    expect(parseTerms("27.5. – 12.12.1918").terms).toEqual([
      { from: "1918-05-27", to: "1918-12-12", openEnded: false, remark: null },
    ]);
  });

  it("takes what a range is from the words in front of it", () => {
    const { terms, refused } = parseTerms(
      "<small>(Suomen valtionhoitajana<br>[[27. toukokuuta|27.5.]][[1918]] - " +
        "[[12. joulukuuta|12.12.]][[1918]])</small><br><hr>Tasavallan presidenttinä<br>" +
        "[[1. maaliskuuta|1.3.]][[1931]] – [[1. maaliskuuta|1.3.]][[1937]]",
    );

    expect(refused).toEqual([]);
    expect(terms).toEqual([
      {
        from: "1918-05-27",
        to: "1918-12-12",
        openEnded: false,
        remark: "regent",
      },
      { from: "1931-03-01", to: "1937-03-01", openEnded: false, remark: null },
    ]);

    expect(parseTerms("vt. 11.9.1981 – 27.1.1982").terms[0].remark).toBe(
      "acting",
    );
  });

  it("refuses a range inside a remark that does not say what it is", () => {
    expect(
      parseTerms("1.3.1994 – 1.3.2000 (valittu 6.2.1994 – 1.3.1994)"),
    ).toEqual({
      terms: [
        {
          from: "1994-03-01",
          to: "2000-03-01",
          openEnded: false,
          remark: null,
        },
      ],
      refused: [
        {
          text: "(valittu 6.2.1994 – 1.3.1994)",
          reason: "range inside a remark",
        },
      ],
    });
  });

  it("refuses what it cannot read and says why", () => {
    const reason = (field: string) =>
      parseTerms(field).refused.map((refusal) => refusal.reason);

    expect(reason("[[1919]]–[[1925]]")).toEqual(["years only, no day"]);
    expect(reason("1.3.1994 –1. tuokokuuta 2000")).toEqual([
      "end date not understood",
    ]);
    expect(reason("17.5.-26.3. 1946")).toEqual(["end not after start"]);
    expect(reason("78.3.1856 – 1.3.2012")).toEqual(["not a calendar date"]);
    expect(reason("4.8.1337 – 11.3.1946")).toEqual(["year out of range"]);
    expect(reason("29.2.1957 – 1.3.1962")).toEqual(["not a calendar date"]);
    expect(reason("vuodesta 1956")).toEqual(["no date range found"]);
    expect(parseTerms("")).toEqual({ terms: [], refused: [] });
  });

  it("writes every date as day, month and year before reading it", () => {
    expect(
      normalize("[[4. elokuuta]] [[1944]] – [[11. maaliskuuta]] [[1946]]"),
    ).toBe("4.8.1944 – 11.3.1946");
  });
});

describe("officeOf", () => {
  it("names the three offices that are loaded", () => {
    expect(
      officeOf(
        "[[Suomen tasavallan presidentti|Suomen tasavallan 8. presidentti]]",
      ),
    ).toBe(PRESIDENT);
    expect(officeOf("[[Suomen presidentti]]")).toBe(PRESIDENT);
    expect(
      officeOf("[[Suomen tasavallan presidentti|Tasavallan presidentti]] (2.)"),
    ).toBe(PRESIDENT);
    expect(officeOf("[[Suomen pääministeri]]<ref>lähde</ref>")).toBe(
      PRIME_MINISTER,
    );
    expect(officeOf("Suomen valtionhoitaja")).toBe(REGENT);
  });

  it("reads a regent who became president as the presidency", () => {
    expect(
      officeOf(
        "[[Suomen valtionhoitaja]]<br>[[Suomen presidentti|Suomen 3. presidentti]]",
      ),
    ).toBe(PRESIDENT);
  });

  it("leaves every other title alone", () => {
    expect(officeOf("[[Eduskunnan puhemies]]")).toBeNull();
    expect(officeOf("Viipurin läänin maaherra")).toBeNull();
    expect(officeOf("[[Korkein oikeus|Korkeimman oikeuden presidentti]]")).toBe(
      null,
    );
    expect(officeOf("Suomen varapääministeri")).toBeNull();

    // A word boundary that stops at ä would call this the presidency.
    expect(officeOf("Suomen presidenttiä avustava virkamies")).toBeNull();
  });
});

describe("officeBox", () => {
  const article = [
    "{{Tämä artikkeli|kertoo presidentistä.}}",
    "{{Valtionjohto",
    "| nimi = Urho Kekkonen",
    "| arvo = [[Suomen tasavallan presidentti|Suomen tasavallan 8. presidentti]]",
    "| virassa = 1.3.1956–27.1.1982<ref>{{Verkkoviite | Osoite = http://example.fi | Nimeke = a|b }}</ref>",
    "| edeltäjä = [[Juho Kusti Paasikivi|J. K. Paasikivi]]",
    "| arvo2 = [[Suomen pääministeri]]",
    "| virassa2 = [[Kekkosen I hallitus]]<br>17.3.1950–17.1.1951",
    "}}",
    "'''Urho Kekkonen''' oli {{Valtionjohto | arvo = [[Eduskunnan puhemies]] | virassa = 1948–1950 }}.",
  ].join("\n");

  it("keeps the office and term fields of the first template that has them", () => {
    expect([...officeBox(article)!]).toEqual([
      [
        "arvo",
        "[[Suomen tasavallan presidentti|Suomen tasavallan 8. presidentti]]",
      ],
      [
        "virassa",
        "1.3.1956–27.1.1982<ref>{{Verkkoviite | Osoite = http://example.fi | Nimeke = a|b }}</ref>",
      ],
      ["arvo2", "[[Suomen pääministeri]]"],
      ["virassa2", "[[Kekkosen I hallitus]]<br>17.3.1950–17.1.1951"],
    ]);
  });

  it("returns nothing for a version without an office infobox", () => {
    expect(officeBox("'''Urho Kekkonen''' oli Suomen presidentti.")).toBeNull();
    expect(officeBox("{{Henkilö | nimi = Urho Kekkonen }} virassa")).toBeNull();
  });

  it("states one claim for every term of every loaded office", () => {
    const { claims, refused } = parseBox(officeBox(article)!);

    expect(refused.size).toBe(0);
    expect(
      [...claims.values()].map((claim) => [claim.office, claim.from, claim.to]),
    ).toEqual([
      [PRESIDENT, "1956-03-01", "1982-01-27"],
      [PRIME_MINISTER, "1950-03-17", "1951-01-17"],
    ]);
  });

  it("files an acting term and a regency under their own office", () => {
    const { claims } = parseBox(
      new Map([
        ["arvo", "[[Suomen tasavallan presidentti]]"],
        [
          "virassa",
          "27.1.1982–1.3.1994<br><small>(vt. presidentti 11.9.1981–27.1.1982)</small>",
        ],
      ]),
    );

    expect([...claims.values()].map((claim) => claim.office)).toEqual([
      PRESIDENT,
      `${PRESIDENT} (vt.)`,
    ]);
  });

  it("records an empty term field as a refusal", () => {
    const { claims, refused } = parseBox(
      new Map([
        ["arvo", "[[Suomen presidentti]]"],
        ["virassa", ""],
      ]),
    );

    expect(claims.size).toBe(0);
    expect([...refused.values()]).toEqual([
      { office: PRESIDENT, text: "", reason: "term field empty" },
    ]);
  });
});

describe("collapse", () => {
  const states = (...versions: string[][]) =>
    versions.map((claims, index) => ({
      version: index + 1,
      statements: new Map(claims.map((claim) => [claim, claim])),
    }));

  it("makes one lifetime of versions that repeat a statement", () => {
    expect(collapse(states(["a"], ["a"], ["a"]))).toEqual([
      { statement: "a", first: 1, versions: 3, endedBy: null },
    ]);
  });

  it("ends a statement at the version that replaces it", () => {
    expect(collapse(states(["a"], ["a"], ["b"], ["b"]))).toEqual([
      { statement: "a", first: 1, versions: 2, endedBy: 3 },
      { statement: "b", first: 3, versions: 2, endedBy: null },
    ]);
  });

  it("starts a new lifetime when a statement comes back", () => {
    expect(collapse(states(["a", "c"], ["c"], ["a", "c"]))).toEqual([
      { statement: "a", first: 1, versions: 1, endedBy: 2 },
      { statement: "c", first: 1, versions: 3, endedBy: null },
      { statement: "a", first: 3, versions: 1, endedBy: null },
    ]);
  });
});
