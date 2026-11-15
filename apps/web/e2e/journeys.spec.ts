import { expect, test } from "@playwright/test";

/**
 * The journeys a visitor takes, from the page to the database and back.
 * They need the loaded database, Ollama with bge-m3 and gemma, and for the
 * last one the historian agent on port 3001. Every number asserted is a
 * fact of the dataset.
 */

const LOSSES = "Kuinka monta suomalaista kaatui talvisodassa?";

test("asking a question on two dates shows how the answer changed", async ({
  page,
}) => {
  await page.goto(`/?q=${encodeURIComponent(LOSSES)}&date=2007`);

  await expect(
    page.getByRole("heading", { name: "31 Dec 2007" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /1 Oct 2026/ })).toBeVisible();

  // What Wikipedia said in 2007, and what the same paragraph says today.
  await expect(
    page.getByText(/26 600 sotatoimissa menehtynyttä/).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/26 662 sotatoimissa kuollutta/).first(),
  ).toBeVisible();

  await expect(page.getByText("Same question, two dates.")).toBeVisible();
  await expect(
    page.getByText("worded differently today").first(),
  ).toBeVisible();

  // Both answers finish, and each says which model wrote it.
  await expect(
    page.getByText(/Written by .* from the \d+ passages/),
  ).toHaveCount(2);

  // A passage says how far it is from the question, as our reading.
  await expect(page.getByText(/^distance 0\.\d\d$/).first()).toBeVisible();

  // The SQL behind the answer is on the page and travels in time.
  await page
    .getByRole("button", { name: /SQL behind these passages/ })
    .first()
    .click();
  await expect(
    page.getByText("FOR SYSTEM_TIME AS OF TIMESTAMP").first(),
  ).toBeVisible();
});

test("a question about nothing in the articles gets no answer", async ({
  page,
}) => {
  await page.goto(`/?q=${encodeURIComponent("How do I reset my router?")}`);

  await expect(
    page.getByText(/No passage that stood in Wikipedia/),
  ).toBeVisible();
  await expect(
    page.getByText(/the nearest passage is at cosine distance/),
  ).toBeVisible();
  await expect(page.getByText(/Written by/)).toHaveCount(0);
});

test("an article can be read as it stood on a day", async ({ page }) => {
  await page.goto("/read/Talvisota?date=2008-12-31");

  await expect(
    page.getByRole("heading", { level: 1, name: "Talvisota" }),
  ).toBeVisible();
  await expect(page.getByText("31 Dec 2008").first()).toBeVisible();
  await expect(page.getByText(/saved by\s+QWerk/)).toBeVisible();
  await expect(page.getByText(/of 2,143, by 742 editors/)).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Edits per month of Talvisota/ }),
  ).toBeVisible();

  // The opening paragraph as it read that day.
  await expect(
    page.getByText(/Talvisota oli 30\. marraskuuta 1939/),
  ).toBeVisible();

  // Stepping one edit forward lands on the very next saved version.
  await expect(page.getByText(/version 981 of 2,143/)).toBeVisible();
  await page.getByRole("button", { name: "Next edit" }).click();
  await expect(page).toHaveURL(/date=2009-01-01T/);
  await expect(page.getByText(/version 982 of 2,143/)).toBeVisible();
  await page.getByRole("button", { name: "Previous edit" }).click();
  await expect(page).toHaveURL(/date=2008-12-28T10%3A25%3A51/);

  // Comparing with five years earlier lists what changed in between.
  await page.getByRole("button", { name: "5 years earlier" }).click();
  await expect(page).toHaveURL(/from=2003-12-28/);
  await expect(page.getByText(/the article\s+was saved/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /SQL behind this comparison/ }),
  ).toBeVisible();

  // And every paragraph has a life that can be opened.
  await page
    .getByRole("button", { name: "life of this paragraph" })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Life of this paragraph" }),
  ).toBeVisible();
  await expect(
    page.getByText(/This exact wording stood in the article for/),
  ).toBeVisible();
});

test("an article that did not exist yet says so", async ({ page }) => {
  await page.goto("/read/Talvisota?date=2003-01-01");

  await expect(page.getByText(/did not exist yet on 1 Jan 2003/)).toBeVisible();
  await expect(page.getByRole("button", { name: "13 Oct 2003" })).toBeVisible();
});

test("searching the library puts the article a name means first", async ({
  page,
}) => {
  await page.goto("/read?q=Kekkonen");

  await expect(
    page.getByRole("listitem").filter({ hasText: "Urho Kekkonen" }).first(),
  ).toBeVisible();
  await expect(page.locator("ol > li").first()).toContainText("Urho Kekkonen");
  await expect(
    page.getByRole("link", { name: /Suomen sisällissota/ }),
  ).toBeVisible();
});

test("a claim is traced back to when it was first said", async ({ page }) => {
  await page.goto(
    `/trace?claim=${encodeURIComponent("Talvisodassa kuoli 26 662 suomalaista sotilasta")}`,
  );

  await expect(
    page.getByRole("heading", { name: /Earliest wording found/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /in Talvisota/ }),
  ).toBeVisible();

  // The paragraph is from 2003, but it said 22 800 then. The number in the
  // claim was first written six years later.
  await expect(
    page.getByText(/26 662 is first written on\s+22 Aug 2009/),
  ).toBeVisible();
  await expect(
    page.getByText(/closest wordings|wordings? in \d+ article/).first(),
  ).toBeVisible();
});

test("the atlas shows what every lab found", async ({ page }) => {
  await page.goto("/atlas");

  for (const id of [
    "names",
    "exposure",
    "survival",
    "journeys",
    "sources",
    "offices",
    "numbers",
    "scale",
    "languages",
    "infobox",
    "search",
  ]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }

  await page.getByRole("link", { name: /Turn both dials yourself/ }).click();
  await expect(page).toHaveURL(/\/atlas\/presidents/);
});

test("the president of a day depends on the wikipedia that is asked", async ({
  page,
}) => {
  await page.goto("/atlas/presidents");

  await expect(
    page.getByRole("heading", { level: 1, name: /Who was president on/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "K. J. Ståhlberg" }),
  ).toBeVisible();

  // The same day, asked of Wikipedia as it stood at the end of 2012.
  await page.getByRole("button", { name: "end of 2012" }).click();
  await expect(
    page.getByRole("heading", { name: "Lauri Kristian Relander" }),
  ).toBeVisible();
  await expect(page.getByText(/FOR SYSTEM_TIME AS OF/).first()).toBeVisible();
});

test("the method page reports every check as passed", async ({ page }) => {
  await page.goto("/method");

  await expect(page.getByText("862,076").first()).toBeVisible();
  await expect(page.getByText("passed", { exact: true })).toHaveCount(8);
  await expect(page.getByText("failed", { exact: true })).toHaveCount(0);
});

test("a bad date and an unknown article are refused, not guessed", async ({
  request,
}) => {
  const badDate = await request.get("/api/article/Talvisota?date=yesterday");
  expect(badDate.status()).toBe(400);

  const unknown = await request.get("/api/article/No_such_article_anywhere");
  expect(unknown.status()).toBe(404);

  // A percent sign in a title is a title, not a broken escape.
  const percent = await request.get("/api/article/100%25");
  expect(percent.status()).toBe(404);
});

test("another agent can ask what wikipedia said through mcp", async ({
  request,
}) => {
  const call = async (method: string, params?: unknown) => {
    const response = await request.post("/mcp", {
      headers: { accept: "application/json, text/event-stream" },
      data: { jsonrpc: "2.0", id: 1, method, params },
    });

    // The reply comes as one server-sent event.
    const event = /^data: (.*)$/m.exec(await response.text());
    return JSON.parse(event![1]).result;
  };

  const { tools } = await call("tools/list");

  expect(tools.map((tool: { name: string }) => tool.name)).toEqual([
    "search_wikipedia_as_of",
    "read_article_as_of",
    "compare_article",
    "trace_claim",
    "paragraph_life",
    "article_timeline",
    "who_held_office",
  ]);

  const found = await call("tools/call", {
    name: "search_wikipedia_as_of",
    arguments: {
      question: "Kuinka monta suomalaista kaatui talvisodassa?",
      date: "2007",
    },
  });

  expect(found.structuredContent.asOf).toBe("2007-12-31 23:59:59");
  expect(JSON.stringify(found.structuredContent.passages)).toContain("26 600");

  const refused = await call("tools/call", {
    name: "compare_article",
    arguments: { article: "Talvisota", from: "yesterday" },
  });

  expect(refused.isError).toBe(true);

  // Two timelines in one call: a day in 1925, asked of two Wikipedias.
  const holder = async (date?: string) => {
    const held = await call("tools/call", {
      name: "who_held_office",
      arguments: { day: "1925-03-01", date },
    });

    return held.structuredContent.holders[0].holder;
  };

  expect(await holder("2012")).toBe("Lauri Kristian Relander");
  expect(await holder()).toBe("K. J. Ståhlberg");
});

test("the historian looks both dates up before it answers", async ({
  page,
}) => {
  await page.goto("/agent");

  await page
    .getByRole("button", {
      name: "What did Wikipedia say about Finnish losses in the Winter War in 2007, and what does it say now?",
    })
    .click();

  await expect(page.getByText("then_and_now").first()).toBeVisible();
  // The evidence is folded away under the tool panel, so these have to be
  // the numbers in the reply the historian wrote.
  const said = (number: RegExp) =>
    page.getByText(number).filter({ visible: true }).first();

  await expect(said(/26[ ,.]?600/)).toBeVisible();
  await expect(said(/26[ ,.]?662/)).toBeVisible();
});

test("the historian asks the office table who was president", async ({
  page,
}) => {
  await page.goto("/agent");

  await page
    .getByRole("button", {
      name: "Who was president of Finland on 1 March 1925, according to Wikipedia at the end of 2012?",
    })
    .click();

  await expect(page.getByText("who_held_office").first()).toBeVisible();

  // Relander is the answer of 2012 and Ståhlberg today's: both are in the
  // reply only if the date reached the tool.
  const said = (name: RegExp) =>
    page.getByText(name).filter({ visible: true }).first();

  await expect(said(/Relander/)).toBeVisible();
  await expect(said(/Ståhlberg/)).toBeVisible();
});

test("no page scrolls sideways on a phone @phone", async ({ page }) => {
  for (const path of [
    "/",
    "/read",
    "/read/Talvisota?date=2008-12-31",
    "/read/Talvisota?date=2007-12-31&claim=0CED976AFA46F845",
    "/trace",
    "/atlas",
    "/atlas/presidents",
    "/agent",
    "/method",
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );

    expect(overflow, `${path} is wider than the screen`).toBeLessThanOrEqual(1);
  }
});

test("an image claim is reviewed before tracing", async ({ page }) => {
  await page.goto("/trace");
  await page.getByLabel("Upload claim image").setInputFiles("e2e/fixtures/claim.png");
  await expect(page.getByLabel("The claim to trace")).toHaveValue(/Finland declared independence in 1917/);
  await expect(page).toHaveURL(/\/trace$/);
  await page.getByRole("button", { name: "Trace", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Earliest wording found/ })).toBeVisible();
});

test("the paragraph story explains the complete linked history", async ({ page }) => {
  await page.goto("/read/Talvisota?date=2007-12-31&claim=0CED976AFA46F845");
  await page.getByRole("button", { name: "Explain how this paragraph changed" }).click();
  await expect(page.getByText("Gemini interpretation of the complete linked wording history.", { exact: false })).toBeVisible();
  await expect(page.locator("aside section p.whitespace-pre-wrap")).not.toBeEmpty();
});
