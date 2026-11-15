import { tellStory } from "@wtt/package-engine";
import { decoded, respond } from "@/lib/respond";
export const POST = (_request: Request, context: { params: Promise<{ ref: string; hash: string }> }) =>
  respond(async () => {
    const { ref, hash } = await context.params;
    return tellStory(decoded(ref), hash);
  });
