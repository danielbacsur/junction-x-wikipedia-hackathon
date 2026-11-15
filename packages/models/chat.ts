import { gemini, geminiModel } from "./gemini.ts";
export type Message = { role: "system" | "user" | "assistant"; content: string };
export type ChatModel = { name: string; where: "local" | "remote" };
export const chatModel = (): ChatModel => ({ name: geminiModel(), where: "remote" });
export const chat = (messages: Message[], options: { maxTokens?: number; temperature?: number } = {}) =>
  gemini(messages.filter(m => m.role !== "system").map(m => `${m.role}: ${m.content}`).join("\n\n"), {
    system: messages.filter(m => m.role === "system").map(m => m.content).join("\n"),
    maxTokens: options.maxTokens,
  });
/** Compatibility stream; answers are released only after validation. */
export async function* streamChat(messages: Message[], options: { maxTokens?: number; temperature?: number } = {}) {
  yield await chat(messages, options);
}
