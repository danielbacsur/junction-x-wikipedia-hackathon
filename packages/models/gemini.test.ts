import { afterEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ generate: vi.fn(), stream: vi.fn(), model: vi.fn(id => ({ modelId: id })) }));
vi.mock("@ai-sdk/gateway", () => ({ createGateway: () => state.model }));
vi.mock("ai", async importOriginal => ({ ...await importOriginal<typeof import("ai")>(), generateText: state.generate, streamText: state.stream }));
import { gemini, geminiModel } from "./gemini.ts";
import { extractClaim } from "./image-claim.ts";
afterEach(() => { vi.unstubAllEnvs(); state.generate.mockReset(); state.stream.mockReset(); state.model.mockClear(); });
describe("Gateway generation", () => {
  it("uses provider-qualified IDs without a direct Gemini key", async () => {
    vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("GEMINI_MODEL", "gemini-4-hydrogen");
    state.generate.mockResolvedValue({ finishReason: "stop", text: "hello" });
    expect(await gemini("hello")).toBe("hello");
    expect(state.model).toHaveBeenCalledWith("google/gemini-4-hydrogen");
    vi.stubEnv("GEMINI_MODEL", "google/gemini-4-argon");
    expect(geminiModel()).toBe("google/gemini-4-argon");
  });
  it("passes structured output and system instructions through the AI SDK", async () => {
    state.generate.mockResolvedValue({ finishReason: "stop", output: { claim: "test" } });
    expect(await gemini("hello", { schema: { type: "object" }, system: "rules" })).toBe('{"claim":"test"}');
    expect(state.generate).toHaveBeenCalledWith(expect.objectContaining({ system: "rules", output: expect.any(Object), messages: [{ role: "user", content: "hello" }] }));
  });
  it("rejects incomplete streaming and nonstreaming responses", async () => {
    state.stream.mockReturnValue({ textStream: (async function* () { yield "hello"; })(), finishReason: Promise.resolve("stop") });
    expect(await gemini("hello", { stream: true })).toBe("hello");
    state.stream.mockReturnValue({ textStream: (async function* () { yield "partial"; })(), finishReason: Promise.resolve("length") });
    await expect(gemini("hello", { stream: true })).rejects.toThrow("without a complete answer");
    state.generate.mockResolvedValue({ finishReason: "length", text: "partial" });
    await expect(gemini("hello")).rejects.toThrow("ended: length");
  });
  it("rejects oversized, unsupported and unreadable images and maps image bytes", async () => {
    await expect(extractClaim(new Uint8Array(8 * 1024 * 1024 + 1), "image/png")).rejects.toThrow("8 MB");
    await expect(extractClaim(new Uint8Array(1), "text/plain")).rejects.toThrow("PNG");
    state.generate.mockResolvedValue({ finishReason: "stop", output: { claim: null } });
    await expect(extractClaim(new Uint8Array([1, 2]), "image/png")).rejects.toThrow("No readable claim");
    state.generate.mockResolvedValue({ finishReason: "stop", output: { claim: "A claim" } });
    expect(await extractClaim(new Uint8Array([1, 2]), "image/png")).toBe("A claim");
    expect(state.generate).toHaveBeenLastCalledWith(expect.objectContaining({ messages: [{ role: "user", content: [expect.objectContaining({ type: "text" }), { type: "image", image: Buffer.from([1, 2]), mediaType: "image/png" }] }] }));
  });
});
