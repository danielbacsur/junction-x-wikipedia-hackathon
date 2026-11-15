import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { defineAgent } from "eve";
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
export default defineAgent({
  model: google(process.env.GEMINI_MODEL ?? "gemini-4-hydrogen"),
  defaultTools: false,
  reasoning: "provider-default",
  modelContextWindowTokens: 1_000_000,
});
