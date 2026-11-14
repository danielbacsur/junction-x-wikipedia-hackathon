export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatModel = {
  /** What a person should call it, shown next to every answer. */
  name: string;

  /** Where it runs: on this machine, or at a provider. */
  where: "local" | "remote";
};

const ollama = () => process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";

/**
 * The model that writes answers. A Gemma model in Ollama on this machine
 * unless LLM_BASE_URL points at an OpenAI-compatible provider, such as
 * NVIDIA's for Nemotron, with its LLM_API_KEY and LLM_MODEL.
 */
export const chatModel = (): ChatModel =>
  process.env.LLM_BASE_URL
    ? { name: process.env.LLM_MODEL ?? "", where: "remote" }
    : { name: process.env.LLM_MODEL ?? "gemma4:e2b", where: "local" };

/** Reads a stream of text lines, whole lines only. */
async function* lines(response: Response): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let rest = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    rest += decoder.decode(value, { stream: true });

    for (let end = rest.indexOf("\n"); end !== -1; end = rest.indexOf("\n")) {
      const line = rest.slice(0, end).trim();
      rest = rest.slice(end + 1);
      if (line) yield line;
    }
  }

  if (rest.trim()) yield rest.trim();
}

async function* local(
  messages: Message[],
  options: { maxTokens: number; temperature: number },
): AsyncGenerator<string> {
  const response = await fetch(`${ollama()}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: chatModel().name,
      messages,
      stream: true,
      keep_alive: "24h",

      // Thinking doubles the wait and the answer only restates sources.
      think: false,
      options: {
        temperature: options.temperature,
        num_predict: options.maxTokens,
        num_ctx: 16_384,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ollama chat: ${response.status} ${await response.text()}`);
  }

  for await (const line of lines(response)) {
    const part = JSON.parse(line) as { message?: { content?: string } };
    if (part.message?.content) yield part.message.content;
  }
}

async function* remote(
  messages: Message[],
  options: { maxTokens: number; temperature: number },
): AsyncGenerator<string> {
  const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.LLM_API_KEY ?? ""}`,
    },
    body: JSON.stringify({
      model: chatModel().name,
      messages,
      stream: true,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`chat: ${response.status} ${await response.text()}`);
  }

  for await (const line of lines(response)) {
    if (!line.startsWith("data:")) continue;

    const data = line.slice(5).trim();
    if (data === "[DONE]") return;

    const part = JSON.parse(data) as {
      choices?: { delta?: { content?: string } }[];
    };

    const text = part.choices?.[0]?.delta?.content;
    if (text) yield text;
  }
}

/** Streams a model's reply piece by piece. */
export const streamChat = (
  messages: Message[],
  options: { maxTokens?: number; temperature?: number } = {},
): AsyncGenerator<string> => {
  const settings = {
    maxTokens: options.maxTokens ?? 500,
    temperature: options.temperature ?? 0.2,
  };

  return process.env.LLM_BASE_URL
    ? remote(messages, settings)
    : local(messages, settings);
};

/** A model's whole reply. */
export const chat = async (
  messages: Message[],
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<string> => {
  let reply = "";
  for await (const piece of streamChat(messages, options)) reply += piece;

  return reply;
};
