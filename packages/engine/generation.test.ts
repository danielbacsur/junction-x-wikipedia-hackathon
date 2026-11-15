import { describe, expect, it, vi } from "vitest";
const model = vi.hoisted(() => vi.fn());
vi.mock("@wtt/package-models", () => ({ gemini: model, chatModel: () => ({ name: "mock", where: "remote" }) }));
import { streamAnswer, checkAnswer } from "./answer.ts";
import { storyInput } from "./story.ts";
import { understandQuestion } from "./understand.ts";
import type { Evidence } from "./evidence.ts";
import type { Biography } from "./claims.ts";
const evidence = { question: "How many?", at: null, language: "English", sources: [{ n: 1, title: "Title 99", text: "There were 3 people.", bornAt: "2003-01-01" }] } as Evidence;
const collect = async (e: Evidence) => { let text = ""; for await (const piece of streamAnswer(e)) text += piece; return text; };
describe("generation boundaries", () => {
  it("never calls the answer model without evidence", async () => {
    model.mockClear(); expect(await collect({ ...evidence, sources: [] })).toBe(""); expect(model).not.toHaveBeenCalled();
  });
  it("withholds unknown citations and numbers, including title-only figures", async () => {
    model.mockResolvedValue(JSON.stringify({ sentences: [
      { text: "There were 3 people.", cites: [1] }, { text: "There were 4 people.", cites: [1] },
      { text: "There were 99 people.", cites: [1] }, { text: "There were 3 people.", cites: [9] },
      { text: "There were 3 people.", cites: [0, 1] },
      { text: "There were 3 people.", cites: [-1, 1] },
    ] }));
    expect(await collect(evidence)).toBe("There were 3 people. [1] ");
  });
  it("checks single and non-Latin decimal digits", () => {
    expect(checkAnswer("There were ٣ people [1].", ["3 people"])[0].supported).toBe(true);
    expect(checkAnswer("There were ٤ people [1].", ["3 people"])[0].supported).toBe(false);
    expect(checkAnswer("There were 4 people [1].", ["3 people"])[0].supported).toBe(false);
  });
  it("keeps more than 200 wordings and refuses instead of cutting", () => {
    const life = { title: "Test", hash: "abc", lifetimes: [], wordings: Array.from({ length: 250 }, (_, n) => ({ hash: String(n), text: `wording ${n}` })) } as unknown as Biography;
    expect(JSON.parse(storyInput(life)).wordings).toHaveLength(250);
    life.wordings[249].text = "x".repeat(500_001);
    expect(() => storyInput(life)).toThrow("no wordings were omitted");
  });
  it("preserves the user's language and a distinct day of office", async () => {
    model.mockResolvedValue(JSON.stringify({ language: "Japanese", query: "Kuka oli Suomen presidentti 1925-03-01?", office: { name: "president", day: "1925-03-01" } }));
    expect(await understandQuestion("question")).toMatchObject({ language: "Japanese", office: { day: "1925-03-01" } });
  });
});

import { summarizeTraces, type Trace } from "./claims.ts";
it("finds earliest evidence beyond the displayed page", () => {
  const traces = Array.from({ length: 30 }, (_, n) => ({ firstSeen: n === 29 ? "2003-01-01" : "2010-01-01", distance: 0.2, saysFigures: true })) as Trace[];
  const result = summarizeTraces(traces, 24, 0.1);
  expect(result.traces).toHaveLength(24);
  expect(result.earliest?.firstSeen).toBe("2003-01-01");
  expect(result.earliestSaying?.firstSeen).toBe("2003-01-01");
});
