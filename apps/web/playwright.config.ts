import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  // Answers use the gateway, and a
  // page under test may also wait for a passage to be embedded.
  timeout: 240_000,
  expect: { timeout: 120_000 },

  // One at a time: every test shares one database and one GPU.
  workers: 1,
  reporter: [["list"]],

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "phone",
      use: { ...devices["Pixel 7"] },
      grep: /@phone/,
    },
  ],

  webServer: process.env.BASE_URL ? undefined : {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
