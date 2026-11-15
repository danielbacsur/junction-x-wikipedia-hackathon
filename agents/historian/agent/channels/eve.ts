import { timingSafeEqual } from "node:crypto";
import { localDev, vercelOidc } from "eve/channels/auth";
import { eveChannel, type EveAuthFn } from "eve/channels/eve";

const backendAuth: EveAuthFn = async request => {
  const expected = process.env.BACKEND_TOKEN;
  const supplied = request.headers.get("x-backend-token");
  if (!expected || !supplied || Buffer.byteLength(expected) !== Buffer.byteLength(supplied)) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return null;
  return { attributes: {}, authenticator: "backend-gateway", principalId: "palimpsest-demo", principalType: "service" };
};
export default eveChannel({ auth: [backendAuth, vercelOidc(), localDev()] });
