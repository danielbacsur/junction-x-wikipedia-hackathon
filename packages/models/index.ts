const ollama = () => process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";

/** The model every vector in the database comes from. */
export const EMBEDDING_MODEL = "bge-m3";
export const EMBEDDING_DIMENSIONS = 1024;

/**
 * Embeds texts with bge-m3 through Ollama. Both sizes are set because an
 * embedding has to fit in one batch, and Ollama's default batch of 2,048
 * tokens silently cuts longer texts short.
 */
export const embed = async (texts: string[]): Promise<number[][]> => {
  if (texts.length === 0) return [];

  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${ollama()}/api/embed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        truncate: true,
        keep_alive: "24h",
        options: { num_ctx: 8192, num_batch: 8192 },
      }),
    }).catch((error: unknown) => error as Error);

    if (!(response instanceof Error) && response.ok) {
      const body = (await response.json()) as { embeddings: number[][] };
      return body.embeddings;
    }

    // Ollama answers with an error while it loads or swaps a model, and
    // a long embedding job should outlive that.
    if (attempt === 5) {
      const reason =
        response instanceof Error
          ? response.message
          : `${response.status} ${await response.text()}`;

      throw new Error(`ollama embed failed: ${reason}`);
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
  }
};

const remembered = new Map<string, number[]>();

/**
 * Embeds one question. The same question is asked again for every date a
 * reader moves to, so its vector is kept.
 */
export const embedOne = async (text: string) => {
  const known = remembered.get(text);
  if (known) return known;

  const [vector] = await embed([text]);

  if (remembered.size >= 500) remembered.clear();
  remembered.set(text, vector);

  return vector;
};

/** Texts longer than this say nothing more to the model, only slower. */
const LONGEST_PASSAGE = 6_000;

/**
 * What is embedded for a passage. The article's title goes in front: a
 * paragraph rarely names its own subject, and without it "the war ended in
 * March" means nothing.
 */
export const passageInput = (title: string, text: string) =>
  `${title}\n${text.slice(0, LONGEST_PASSAGE)}`;
