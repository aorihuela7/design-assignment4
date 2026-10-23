import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

// Clerk's setup for tests: a Testing Token from the Backend API (with CLERK_SECRET_KEY),
// so Clerk's bot protection lets the test's browsers through. The tests depend on it.
setup.describe.configure({ mode: "serial" });

setup("Clerk testing token", async () => {
  const missing = ["E2E_USER_A_EMAIL", "E2E_USER_B_EMAIL"].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Set ${missing.join(" and ")} in .env.local (and save it): the emails of two test users in your Clerk development instance.`);
  }
  // playwright.config.ts has already loaded .env.local.
  await clerkSetup({ dotenv: false });
});
