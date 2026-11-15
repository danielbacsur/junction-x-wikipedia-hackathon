import { gatewayModel } from "@wtt/package-models";
import { defineAgent } from "eve";
export default defineAgent({
  model: gatewayModel(),
  defaultTools: false,
  reasoning: "provider-default",
  modelContextWindowTokens: 1_000_000,
});
