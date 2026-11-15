import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: process.env.RUN_INTEGRATION ? ["**/node_modules/**"] : ["**/node_modules/**", "**/*.integration.test.ts"],
    // Integration tests opt in with RUN_INTEGRATION=1 and need the loaded dataset.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    reporters: ["tree"],
  },
});
