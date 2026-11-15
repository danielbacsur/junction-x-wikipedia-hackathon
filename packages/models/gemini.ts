import { GoogleGenAI } from "@google/genai";

export const geminiModel = () => process.env.GEMINI_MODEL ?? "gemini-4-hydrogen";
export const geminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("Set GEMINI_API_KEY to enable Gemini generation.");
  return new GoogleGenAI({ apiKey });
};

/** Stateless requests: source material is data, never a system instruction. */
export const gemini = async (
  input: string | { type: "text"; text: string }[] | ({ type: "text"; text: string } | { type: "image"; data: string; mime_type: "image/png" | "image/jpeg" | "image/webp" })[],
  options: { system?: string; schema?: Record<string, unknown>; model?: string; maxTokens?: number; stream?: boolean } = {},
): Promise<string> => {
  const client = geminiClient();
  const params = {
    model: options.model ?? geminiModel(),
    input,
    store: false as const,
    system_instruction: options.system,
    generation_config: { max_output_tokens: options.maxTokens ?? 2048 },
    ...(options.schema ? { response_format: { type: "text" as const, mime_type: "application/json", schema: options.schema } } : {}),
  };
  if (options.stream) {
    const events = await client.interactions.create({ ...params, stream: true });
    let text = ""; let complete = false;
    for await (const event of events) {
      if (event.event_type === "error") throw new Error("Gemini stream failed");
      if (event.event_type === "step.delta" && event.delta.type === "text") text += event.delta.text;
      if (event.event_type === "interaction.completed") complete = event.interaction.status === "completed";
    }
    if (!complete || !text) throw new Error("Gemini stream ended without a complete answer");
    return text;
  }
  const result = await client.interactions.create(params);
  if (result.status !== "completed") throw new Error(`Gemini interaction ${result.status}`);
  if (!result.output_text) throw new Error("Gemini returned no text.");
  return result.output_text;
};
