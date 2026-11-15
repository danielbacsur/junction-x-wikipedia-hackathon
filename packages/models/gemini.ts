import { createGateway } from "@ai-sdk/gateway";
import { generateText, jsonSchema, Output, streamText, type UserContent } from "ai";

/** Gateway resolves AI_GATEWAY_API_KEY, or Vercel OIDC on a deployment. */
const gateway = createGateway();
export const gatewayModelId = (model: string) => model.includes("/") ? model : `google/${model}`;
export const geminiModel = () => gatewayModelId(process.env.GEMINI_MODEL ?? "gemini-4-hydrogen");
export const gatewayModel = (model = geminiModel()) => gateway(gatewayModelId(model));

type Input = string | (
  | { type: "text"; text: string }
  | { type: "image"; data: string; mime_type: "image/png" | "image/jpeg" | "image/webp" }
)[];

/** Generate through Vercel AI Gateway; release only a completed response. */
export const gemini = async (
  input: Input,
  options: { system?: string; schema?: Record<string, unknown>; model?: string; maxTokens?: number; stream?: boolean } = {},
): Promise<string> => {
  const content: UserContent = typeof input === "string" ? input : input.map(part =>
    part.type === "text" ? part : { type: "image", image: Buffer.from(part.data, "base64"), mediaType: part.mime_type },
  );
  const params = {
    model: gatewayModel(options.model),
    system: options.system,
    messages: [{ role: "user" as const, content }],
    maxOutputTokens: options.maxTokens ?? 2048,
    abortSignal: AbortSignal.timeout(120_000),
    ...(options.schema ? { output: Output.object({ schema: jsonSchema(options.schema) }) } : {}),
  };
  if (options.stream) {
    const result = streamText(params);
    let text = "";
    for await (const part of result.textStream) text += part;
    if (await result.finishReason !== "stop" || !text) throw new Error("Gateway stream ended without a complete answer");
    if (options.schema) return JSON.stringify(await result.output);
    return text;
  }
  const result = await generateText(params);
  if (result.finishReason !== "stop") throw new Error(`Gateway generation ended: ${result.finishReason}`);
  if (options.schema) return JSON.stringify(result.output);
  if (!result.text) throw new Error("Gateway returned no text.");
  return result.text;
};
