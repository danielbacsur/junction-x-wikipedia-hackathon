/**
 * Runs a route's work and answers with its result as JSON. A missing
 * result is a 404, and a thrown error is reported with its message: these
 * routes only ever fail on a bad date or a database that is not there.
 */
export const respond = async (work: () => Promise<unknown>) => {
  try {
    const result = await work();

    return result === null || result === undefined
      ? Response.json({ error: "not found" }, { status: 404 })
      : Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const bad = /is not a date|has to be in the past/.test(message);

    return Response.json({ error: message }, { status: bad ? 400 : 500 });
  }
};

/** A query parameter, or undefined when it is missing or empty. */
export const param = (request: Request, name: string) =>
  new URL(request.url).searchParams.get(name)?.trim() || undefined;
