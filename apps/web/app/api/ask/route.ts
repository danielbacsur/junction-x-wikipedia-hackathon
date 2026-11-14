import {
  answerModel,
  checkAnswer,
  gatherEvidence,
  streamAnswer,
} from "@wtt/package-engine";

import { param } from "@/lib/respond";

/**
 * Answers a question as of a date, as a stream of JSON lines: first the
 * evidence, which arrives in a fraction of a second, then the answer as
 * the model writes it, then the same answer split into sentences with
 * every citation checked.
 */
export const GET = async (request: Request) => {
  const question = param(request, "q");
  const date = param(request, "date");

  if (!question) {
    return Response.json({ error: "no question" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        const started = performance.now();
        const evidence = await gatherEvidence(question, date);
        const found = performance.now();

        send({ type: "evidence", evidence, ms: Math.round(found - started) });

        let answer = "";

        if (evidence.sources.length > 0) {
          for await (const text of streamAnswer(evidence)) {
            answer += text;
            send({ type: "text", text });
          }
        }

        send({
          type: "done",
          answer,
          sentences: checkAnswer(
            answer,
            evidence.sources.map((source) => source.text),
          ),
          model: answerModel(),
          ms: Math.round(performance.now() - found),
        });
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }

      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
