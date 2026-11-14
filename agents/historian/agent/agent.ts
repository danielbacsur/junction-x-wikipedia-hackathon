import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { defineAgent } from "eve";

// The agent runs on a Gemma model in Ollama on this machine, so it works
// with no account or key. Pointing LLM_BASE_URL at an OpenAI-compatible
// provider, such as NVIDIA's for Nemotron, switches it to that model.
const remote = process.env.LLM_BASE_URL;

const provider = createOpenAICompatible({
  name: remote ? "remote" : "ollama",
  baseURL: remote ?? `${process.env.OLLAMA_URL ?? "http://127.0.0.1:11434"}/v1`,
  apiKey: process.env.LLM_API_KEY,
  includeUsage: true,
});

export default defineAgent({
  model: provider(process.env.LLM_MODEL ?? "gemma4:e2b"),
  defaultTools: false,

  // Ollama allocates this much for the model, and eve compacts before it.
  modelContextWindowTokens: 32_000,
});
