import { DefaultSandbox, defineSandbox } from "eve/sandbox";

// A development attachment must never silently change workspace dependencies.
export const environment = DefaultSandbox.environment({
  justBash: { autoInstall: false },
});
export default defineSandbox(() => environment.open());
