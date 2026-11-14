import { expect, test } from "@playwright/test";

/**
 * The journeys a visitor takes, from the page to the database and back.
 * They need the loaded database, Ollama with bge-m3 and gemma, and for the
 * last one the historian agent on port 3001. Every number asserted is a
 * fact of the dataset.
 */

const LOSSES = "How many Finnish soldiers died in the Winter War?";

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

  // The SQL behind the answer is on the page and travels in time.
  await page
    .getByRole("button", { name: /SQL behind these passages/ })
    .first()
    .click();
  await expect(
    page.getByText("FOR SYSTEM_TIME AS OF TIMESTAMP").first(),
  ).toBeVisible();
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
    `/trace?claim=${encodeURIComponent("Talvisodassa kaatui noin 25 000 suomalaista sotilasta")}`,
  );

  await expect(
    page.getByRole("heading", { name: /First said on/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /in Talvisota/ }),
  ).toBeVisible();
  await expect(
    page.getByText(/closest wordings|wordings? in \d+ article/).first(),
  ).toBeVisible();
});

test("the method page reports every check as passed", async ({ page }) => {
  await page.goto("/method");

  await expect(page.getByText("862,076").first()).toBeVisible();
  await expect(page.getByText("passed", { exact: true })).toHaveCount(7);
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

test("no page scrolls sideways on a phone @phone", async ({ page }) => {
  for (const path of [
    "/",
    "/read",
    "/read/Talvisota?date=2008-12-31",
    "/trace",
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
