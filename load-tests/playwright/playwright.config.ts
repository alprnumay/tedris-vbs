import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 120_000,
  fullyParallel: true,
  workers: Number(process.env.LOAD_TEST_BROWSER_USERS || 5),
  reporter: [
    ["list"],
    ["json", { outputFile: `load-tests/results/playwright-browser-summary-${process.env.LOAD_TEST_RUN_ID || "latest"}.json` }],
  ],
  use: {
    baseURL: process.env.FRONTEND_BASE || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
