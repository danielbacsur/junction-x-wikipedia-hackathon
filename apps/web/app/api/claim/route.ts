import { extractClaim } from "@wtt/package-models";
export const POST = async (request: Request) => {
  const max = 8 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > max + 65536) return Response.json({ error: "Image is too large (8 MB maximum)." }, { status: 413 });
  try {
    // Bound actual bytes as well: content-length can be absent or forged.
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "Missing image" }, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max + 65536) { await reader.cancel(); return Response.json({ error: "Image is too large (8 MB maximum)." }, { status: 413 }); }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks);
    const form = await new Response(body, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("image");
    if (!(file instanceof File)) return Response.json({ error: "Missing image" }, { status: 400 });
    if (file.size > max) return Response.json({ error: "Image is too large" }, { status: 413 });
    const claim = await extractClaim(new Uint8Array(await file.arrayBuffer()), file.type);
    return Response.json({ claim, requiresConfirmation: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Image extraction failed" }, { status: 422 });
  }
};
