/** Forward server-side API requests to the backend holding MariaDB and bge-m3. */
export const maxDuration = 300;
async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const origin = process.env.BACKEND_URL;
  const token = process.env.BACKEND_TOKEN;
  if (!origin || !token) return Response.json({ error: 'Backend is not configured' }, { status: 503 });
  const { path } = await context.params;
  if (!['api', 'eve', 'mcp'].includes(path[0])) return new Response(null, { status: 404 });
  const target = new URL('/' + path.map(encodeURIComponent).join('/'), origin);
  target.search = new URL(request.url).search;
  const headers = new Headers();
  for (const name of ['content-type', 'accept', 'mcp-session-id', 'mcp-protocol-version', 'last-event-id']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('x-backend-token', token);
  try {
    const upstream = await fetch(target, {
      method: request.method, headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(280_000)]), cache: 'no-store',
    });
    if (path.join("/") === "eve/historian/v1/info" && upstream.ok) {
      const info = await upstream.json();
      return Response.json({ agent: { model: { id: info.agent?.model?.id, endpoint: { provider: "gateway" } } } });
    }
    const out = new Headers(upstream.headers);
    for (const name of ['content-length', 'content-encoding', 'transfer-encoding', 'connection']) out.delete(name);
    out.set('cache-control', 'no-store');
    return new Response(upstream.body, { status: upstream.status, headers: out });
  } catch (error) {
    console.error('Backend request failed', error instanceof Error ? error.message : error);
    return Response.json({ error: 'The history backend is temporarily unavailable. Please retry.' }, { status: 502 });
  }
}
export { forward as GET, forward as POST, forward as DELETE, forward as OPTIONS };
