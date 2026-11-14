import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Most tests ask the real database, and some embed a question first.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    reporters: ["tree"],
  },
});
