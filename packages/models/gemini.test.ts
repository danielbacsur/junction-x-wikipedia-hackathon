import { afterEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@google/genai", () => ({ GoogleGenAI: class { interactions = { create: state.create }; } }));
import { gemini } from "./gemini.ts";
import { extractClaim } from "./image-claim.ts";
afterEach(() => { vi.unstubAllEnvs(); state.create.mockReset(); });
describe("Gemini contract", () => {
  it("requires an explicit key", async () => {
    vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    await expect(gemini("hello")).rejects.toThrow("GEMINI_API_KEY");
    expect(state.create).not.toHaveBeenCalled();
  });
  it("uses stateless Interactions and structured output fields", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test");
    state.create.mockResolvedValue({ status: "completed", output_text: "{}" });
    await gemini("hello", { schema: { type: "object" }, system: "rules" });
    expect(state.create).toHaveBeenCalledWith(expect.objectContaining({ store: false, input: "hello", system_instruction: "rules", response_format: { type: "text", mime_type: "application/json", schema: { type: "object" } } }));
  });
  it("collects streaming text and rejects an interrupted response", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test");
    state.create.mockImplementation(async function* () {
      yield { event_type: "step.delta", delta: { type: "text", text: "hello" } };
      yield { event_type: "interaction.completed", interaction: { status: "completed" } };
    });
    expect(await gemini("hello", { stream: true })).toBe("hello");
    state.create.mockImplementation(async function* () { yield { event_type: "step.delta", delta: { type: "text", text: "partial" } }; });
    await expect(gemini("hello", { stream: true })).rejects.toThrow("without a complete answer");
  });
  it("rejects oversized, unsupported and unreadable images", async () => {
    await expect(extractClaim(new Uint8Array(8 * 1024 * 1024 + 1), "image/png")).rejects.toThrow("8 MB");
    await expect(extractClaim(new Uint8Array(1), "text/plain")).rejects.toThrow("PNG");
    vi.stubEnv("GEMINI_API_KEY", "test");
    state.create.mockResolvedValue({ status: "completed", output_text: '{"claim":null}' });
    await expect(extractClaim(new Uint8Array(1), "image/png")).rejects.toThrow("No readable claim");
    state.create.mockResolvedValue({ status: "completed", output_text: '{"claim":"A claim"}' });
    expect(await extractClaim(new Uint8Array(1), "image/png")).toBe("A claim");
  });
});
