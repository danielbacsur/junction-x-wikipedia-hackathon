import { db } from "@wtt/package-db";
import { afterAll, describe, expect, it } from "vitest";

import {
  LAST_EDIT,
  checkAnswer,
  compareArticle,
  gatherEvidence,
  listVersions,
  moment,
  readArticle,
  readBiography,
  readStanding,
  readTimeline,
  searchArticles,
  traceClaim,
} from "./index.ts";

// The engine is only worth testing against the real data: every claim
// below is a fact about the loaded dataset, which never changes.
const reachable = await db()
  .query("SELECT 1 FROM passage LIMIT 1")
  .then(() => true)
  .catch(() => false);

afterAll(() => db().end());

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
  });
});

describe("checkAnswer", () => {
  it("keeps the citations of each sentence and marks the ones without", () => {
    const sentences = checkAnswer(
      "Kekkonen oli presidentti 1956–1982. [1] Hän erosi sairauden vuoksi [2][3]. " +
        "Tätä ei sanota missään. Väite viittaa olemattomaan. [9]",
      3,
    );

    expect(sentences.map((sentence) => sentence.cites)).toEqual([
      [1],
      [2, 3],
      [],
      [9],
    ]);
    expect(sentences.map((sentence) => sentence.supported)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(sentences[0].text).toBe("Kekkonen oli presidentti 1956–1982.");
  });
});

describe.runIf(reachable)("against the loaded database", () => {
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
});
