import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@playwright/test";

// The same env files `next dev` reads (.env.local holds the Clerk keys and the test
// users' emails), loaded into the test runner too. Nothing here prints a value.
loadEnvConfig(process.cwd());

// The test starts a dev server of its own, on a port of its own, and stops it when
// done; it never reuses or stops one you're running. Next allows one `next dev` per
// project at a time, so either stop yours first, or point the test at it with
// E2E_BASE_URL=http://localhost:3000. E2E_PORT picks another port.
const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "e2e",
  // One test with two people in it: nothing to run in parallel.
  workers: 1,
  // The dev server compiles each page on its first visit, which takes a few seconds.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL,
    // The Google Chrome already installed, so Playwright needn't download a browser.
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    // Clerk's recommended setup: clerkSetup() in a setup project the tests depend on.
    { name: "setup", testMatch: /global\.setup\.ts/ },
    { name: "isolation", testMatch: /.*\.spec\.ts/, dependencies: ["setup"] },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx next dev --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
