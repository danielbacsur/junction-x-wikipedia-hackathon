import { db } from "@wtt/package-db";
import { afterAll, describe, expect, it } from "vitest";

import {
  compareArticle,
  gatherEvidence,
  listTerms,
  listVersions,
  readArticle,
  readBiography,
  readStanding,
  readTimeline,
  searchArticles,
  termChanges,
  termConflicts,
  termHistory,
  traceClaim,
  whoHeld,
} from "./index.ts";

// The engine is only worth testing against the real data: every claim
// below is a fact about the loaded dataset, which never changes.
const reachable = await db()
  .query("SELECT 1 FROM passage LIMIT 1")
  .then(() => true)
  .catch(() => false);

afterAll(() => db().end());

describe.runIf(reachable)("against the loaded database", () => {
  it("refuses an unrelated question using the calibrated original-language vector", async () => {
    const evidence = await gatherEvidence("How do I reset my router?");
    expect(evidence.sources).toEqual([]);
    expect(evidence.nearest).toBeGreaterThan(evidence.tooFar);
  });

  it("reads an article as it stood at the end of 2008", async () => {
    const article = await readArticle("Talvisota", "2008");

    expect(article).toMatchObject({
      title: "Talvisota",
      exists: true,
      revId: 6022332,
      savedBy: "QWerk",
      url: "https://fi.wikipedia.org/?oldid=6022332",
    });

    // Nothing on the page may have been written after the date in view.
    expect(article!.blocks.length).toBeGreaterThan(100);
    expect(
      article!.blocks.every((block) => block.bornAt <= "2008-12-31 23:59:59"),
    ).toBe(true);
  });

  it("says an article did not exist before its first edit", async () => {
    const article = await readArticle("Talvisota", "2003-01");

    expect(article).toMatchObject({ exists: false, blocks: [] });
    expect(article!.firstEdit.startsWith("2003-10-13")).toBe(true);
  });

  it("finds an article by page id and returns nothing for an unknown one", async () => {
    expect((await readArticle(1256))?.title).toBe("Talvisota");
    expect(await readArticle("No such article anywhere")).toBeNull();
  });

  it("counts an article's whole life", async () => {
    const life = await readTimeline("Talvisota");

    expect(life).toMatchObject({ edits: 2143, editors: 742, reverts: 328 });
    expect(life!.months.reduce((sum, month) => sum + month.edits, 0)).toBe(
      2143,
    );
  });

  it("lists versions before a date, newest first", async () => {
    const listed = await listVersions("Talvisota", {
      before: "2010",
      limit: 3,
    });

    expect(listed!.versions.map((version) => version.revId)).toEqual([
      9591170, 9587074, 9538173,
    ]);

    // A limit that is not a count of rows never reaches the statement.
    const one = await listVersions("Talvisota", { before: "2010", limit: -1 });
    expect(one!.versions).toHaveLength(1);
  });

  it("tells apart two versions saved within the same second", async () => {
    const first = await readArticle(710, "2005-09-26 10:02:23.000000");
    const second = await readArticle(710, "2005-09-26 10:02:23.000001");

    expect(first!.revId).toBe(443880);
    expect(second!.revId).toBe(443881);
  });

  it("compares two dates and never pairs unlike paragraphs", async () => {
    const comparison = await compareArticle("Talvisota", "2007", "2012");

    expect(comparison).toMatchObject({
      edits: 594,
      exists: { from: true, to: true },
    });

    const reworded = comparison!.changes.filter(
      (change) => change.change === "reworded",
    );
    expect(reworded.length).toBeGreaterThan(10);
    expect(reworded.every((change) => change.similarity! >= 0.5)).toBe(true);

    await expect(compareArticle("Talvisota", "now")).rejects.toThrow(
      "has to be in the past",
    );
    await expect(compareArticle("Talvisota", "2010", "2008")).rejects.toThrow(
      "has to be before the later one",
    );
  });

  it("puts the article a name means first", async () => {
    const found = await searchArticles("Kekkonen", { mode: "keyword" });

    expect(found.hits[0].title).toBe("Urho Kekkonen");
  });

  it("gathers only passages that stood on the date, with their versions", async () => {
    const evidence = await gatherEvidence(
      "Kuinka monta suomalaista kaatui talvisodassa?",
      "2007",
    );

    expect(evidence.at).toBe("2007-12-31 23:59:59");
    expect(evidence.sources.length).toBeGreaterThan(0);
    expect(
      evidence.sources.every((source) => source.bornAt <= evidence.at!),
    ).toBe(true);

    // The loss figure Wikipedia gave at the end of 2007.
    const losses = evidence.sources.find((source) =>
      source.text.includes("26 600"),
    );
    expect(losses?.title).toBe("Talvisota");
    expect(losses?.url).toBe(
      `https://fi.wikipedia.org/?oldid=${losses?.revId}`,
    );

    // The same paragraph says 26 662 in the latest version.
    const { standing } = await readStanding(
      [{ pageId: losses!.pageId, hash: losses!.hash }],
      null,
    );
    const now = standing[`${losses!.pageId}:${losses!.hash}`];

    expect(now.state).toBe("reworded");
    expect(now.text).toContain("26 662");
  });

  it("traces a claim to wordings with real lifetimes", async () => {
    const tracing = await traceClaim(
      "Talvisodassa kaatui noin 25 000 suomalaista sotilasta",
    );

    expect(tracing.traces.length).toBeGreaterThan(3);
    expect(
      tracing.traces.every((trace) => trace.distance! <= tracing.farthest),
    ).toBe(true);
    expect(tracing.earliest!.firstSeen < "2008").toBe(true);

    for (const trace of tracing.traces) {
      expect(trace.lifetimes.length).toBe(trace.stays);
      expect(trace.lifetimes[0].from).toBe(trace.firstSeen);
      expect(trace.lifetimes.at(-1)!.to).toBe(trace.lastSeen);
    }

    const life = await readBiography(
      tracing.traces[0].pageId,
      tracing.traces[0].hash,
    );

    expect(life!.lifetimes.length).toBe(tracing.traces[0].stays);
    expect(life!.alive).toBe(tracing.traces[0].alive);
  });

  it("tells the earliest wording apart from the first with the claim's number", async () => {
    const tracing = await traceClaim(
      "Talvisodassa kuoli 26 662 suomalaista sotilasta",
    );

    expect(tracing.figures).toEqual(["26 662"]);

    // The paragraph is older than the number: it said 22 800 at first.
    expect(tracing.earliest!.saysFigures).toBe(false);
    expect(tracing.earliestSaying!.text).toMatch(/26 ?662/);
    expect(tracing.earliestSaying!.firstSeen.slice(0, 10)).toBe("2009-08-22");
    expect(
      tracing.earliest!.firstSeen < tracing.earliestSaying!.firstSeen,
    ).toBe(true);

    // No article lists the same words twice.
    const listed = tracing.traces.map(
      (trace) => `${trace.pageId} ${trace.text}`,
    );
    expect(new Set(listed).size).toBe(listed.length);
  });

  it("counts the days of a wording once when it stands twice in an article", async () => {
    // "(lisää)" stood in Talvisota in up to five places at once. Its 26
    // history rows cover 721.9 days, not the 2,887.6 they add up to.
    const repeated = await readBiography(1256, "97EF267A72FEB4CA");

    expect(repeated!.lifetimes).toHaveLength(5);
    expect(repeated!.daysAlive).toBeCloseTo(721.91, 2);

    // No wording can have stood longer than the article has existed.
    const always = await readBiography(1256, "8DBB16B2E5B596F4");

    expect(always!.lifetimes).toHaveLength(1);
    expect(always!.daysAlive).toBeCloseTo(6686.12, 2);
  });
});

// The table of stated terms is loaded by packages/ingest/offices.ts. Every
// claim below is what the infoboxes said, with the version that said it.
const loaded = await db()
  .query("SELECT 1 FROM office_term LIMIT 1")
  .then((rows) => rows.length > 0)
  .catch(() => false);

describe.runIf(loaded)("terms of office on two timelines", () => {
  const holder = async (day: string, date?: string) => {
    const held = await whoHeld("president", day, date);

    return held!.holders.map((term) => [term.person, term.from, term.to]);
  };

  it("gives a different president for 1 March 1925 depending on the Wikipedia asked", async () => {
    expect(await holder("1925-03-01", "2006")).toEqual([
      ["Lauri Kristian Relander", "1925-03-01", "1931-03-01"],
    ]);
    expect(await holder("1925-03-01", "2008")).toEqual([
      ["K. J. Ståhlberg", "1919-07-26", "1925-03-02"],
    ]);
    expect(await holder("1925-03-01", "2012")).toEqual([
      ["Lauri Kristian Relander", "1925-03-01", "1931-03-01"],
    ]);
    expect(await holder("1925-03-01")).toEqual([
      ["K. J. Ståhlberg", "1919-07-25", "1925-03-02"],
    ]);
  });

  it("cites the version that said Kekkonen was president on 1 May 1960", async () => {
    const held = await whoHeld(
      "Suomen tasavallan presidentti",
      "1960-05-01",
      "2006",
    );

    expect(held).toMatchObject({
      office: "Suomen tasavallan presidentti",
      day: "1960-05-01",
      at: "2006-12-31 23:59:59",
    });
    expect(held!.holders).toHaveLength(1);
    expect(held!.holders[0]).toMatchObject({
      person: "Urho Kekkonen",
      acting: false,
      from: "1956-03-01",
      to: "1982-01-27",
      revId: 752136,
      url: "https://fi.wikipedia.org/?oldid=752136",
      editor: "Waldemar",
      saidSince: "2006-01-30 15:01:04.000000",
      saidUntil: "2007-01-19 19:02:59.000000",
    });

    // One statement, with both times in it.
    expect(held!.sql).toHaveLength(1);
    expect(held!.sql[0].sql).toContain(
      "FOR SYSTEM_TIME AS OF TIMESTAMP '2006-12-31 23:59:59'",
    );
    expect(held!.sql[0].sql).toContain("valid_from <= DATE '1960-05-01'");
  });

  it("names nobody for 2 August 1944 since the edits of 9 August 2011", async () => {
    expect(await holder("1944-08-02", "2011-08-08")).toEqual([
      ["Risto Ryti", "1940-12-19", "1944-08-04"],
    ]);
    expect(await holder("1944-08-02", "2011-08-09")).toEqual([]);
    expect(await holder("1944-08-02")).toEqual([]);
  });

  it("gives the handover day to the successor and marks an acting holder", async () => {
    expect(await holder("1982-01-27")).toEqual([
      ["Mauno Koivisto", "1982-01-27", "1994-03-01"],
    ]);

    const sickLeave = await whoHeld("president", "1981-12-01");

    expect(
      sickLeave!.holders.map((term) => [term.person, term.acting]),
    ).toEqual([
      ["Urho Kekkonen", false],
      ["Mauno Koivisto", true],
    ]);
  });

  it("refuses a day that is not one and an office it does not hold", async () => {
    await expect(whoHeld("president", "1925")).rejects.toThrow("is not a date");
    await expect(whoHeld("president", "1925-02-30")).rejects.toThrow(
      "is not a date",
    );
    expect(await whoHeld("pope", "1925-03-01")).toBeNull();
  });

  it("lists the presidents as Wikipedia stated them on a date", async () => {
    const then = await listTerms("president", "2006");
    const now = await listTerms("president");

    expect(then!.terms).toHaveLength(11);
    expect(then!.terms.at(-1)).toMatchObject({
      person: "Tarja Halonen",
      from: "2000-03-01",
      to: null,
    });

    // Thirteen presidents, and Koivisto standing in for Kekkonen in 1981.
    expect(now!.terms.filter((term) => !term.acting)).toHaveLength(13);
    expect(now!.terms.filter((term) => term.acting)).toHaveLength(1);
    expect(now!.terms.at(-1)).toMatchObject({
      person: "Alexander Stubb",
      from: "2024-03-01",
      to: null,
      saidUntil: null,
    });
  });

  it("holds every statement ever made, one row per lifetime", async () => {
    const all = await termHistory("president");

    expect(all!.terms).toHaveLength(59);
    expect(all!.terms.filter((term) => term.saidUntil === null)).toHaveLength(
      14,
    );
  });

  it("finds the 45 times a stated date was changed", async () => {
    const { changes } = (await termChanges())!;

    expect(changes).toHaveLength(45);
    expect(
      changes.filter((change) => change.verdict === "to today's value"),
    ).toHaveLength(25);
    expect(
      changes.filter((change) => change.verdict === "away from today's value"),
    ).toHaveLength(4);
    expect(changes.filter((change) => change.editorKind === "ip")).toHaveLength(
      13,
    );

    // The handover of 1925 moved to 2 March for the second time.
    expect(changes.find((change) => change.revId === 13641376)).toMatchObject({
      at: "2013-11-05 19:36:27.000000",
      person: "K. J. Ståhlberg",
      what: "end",
      before: { from: "1919-07-25", to: "1925-03-01" },
      after: { from: "1919-07-25", to: "1925-03-02" },
      editor: "KLS",
      comment: "kyllä tämä pitää paikkansa.",
      stoodDays: null,
    });

    expect((await termChanges("president"))!.changes).toHaveLength(35);
  });

  it("finds the days nobody claims and the moments two articles claimed", async () => {
    const { gaps, overlaps } = (await termConflicts("president"))!;

    expect(
      gaps.map((gap) => [gap.outgoing, gap.days, gap.firstYear, gap.lastYear]),
    ).toEqual([
      ["P. E. Svinhufvud", 1, 2008, 2009],
      ["Risto Ryti", 3, 2011, 2026],
      ["Carl Gustaf Emil Mannerheim", 7, 2011, 2026],
    ]);
    expect(gaps[1].firstSaid.slice(0, 10)).toBe("2011-08-09");

    expect(overlaps).toHaveLength(10);
    expect(Math.max(...overlaps.map((overlap) => overlap.seconds))).toBe(
      349_488,
    );
  });
});
