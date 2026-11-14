import { createMcpHandler } from "mcp-handler";

import packageJson from "@/package.json";

import { registerTools } from "./_tools";

export const mcpHandler = createMcpHandler(registerTools, {
  serverInfo: { name: "palimpsest", version: packageJson.version },
});
