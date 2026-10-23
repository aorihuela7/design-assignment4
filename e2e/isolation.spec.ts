import { clerk } from "@clerk/testing/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} in .env.local`);
  return value;
}

// Each person gets a browser context of their own (their own cookies), so both can be
// signed in at once.
async function signIn(browser: Browser, emailAddress: string) {
  const page = await (await browser.newContext()).newPage();
  // clerk.signIn needs a page that loads Clerk and isn't protected: the landing page.
  await page.goto("/");
  await clerk.signIn({ page, emailAddress });
  return page;
}

// Makes a list with one item, the way a person would, and returns its address.
async function saveList(page: Page, list: string, item: string) {
  // Through My trips, so New trip opens with the person's lists already loaded.
  await page.goto("/");
  await page.getByRole("link", { name: "New trip" }).click();
  await page.getByLabel("Trip name").fill(list);
  await page.getByRole("button", { name: "Create trip" }).click();
  await page.waitForURL(/\/trips\/[0-9a-f-]{36}$/);
  await page.getByLabel("Item name").fill(item);
  await page.getByRole("button", { name: "Add item" }).click();
  // The row appears only once Supabase has saved the item.
  await expect(page.getByRole("checkbox", { name: item, exact: true })).toBeVisible();
  return page.url();
}

async function deleteList(page: Page, url: string) {
  await page.goto(url);
  await page.getByRole("button", { name: "Delete trip" }).click();
  // The question replaces the button; this one confirms.
  await page.getByRole("button", { name: "Delete trip" }).click();
  await page.waitForURL((address) => address.pathname === "/");
}

test("two people never see each other's lists", async ({ browser }) => {
  // New names on every run, so an earlier run can't decide this one.
  const run = Date.now().toString(36);
  const a = { list: `E2E A ${run}`, item: `Only A ${run}`, page: await signIn(browser, env("E2E_USER_A_EMAIL")) };
  const b = { list: `E2E B ${run}`, item: `Only B ${run}`, page: await signIn(browser, env("E2E_USER_B_EMAIL")) };
  const saved: { page: Page; url: string }[] = [];

  try {
    for (const [name, person] of [["A", a], ["B", b]] as const) {
      await test.step(`${name} saves a list with an item`, async () => {
        saved.push({ page: person.page, url: await saveList(person.page, person.list, person.item) });
      });
    }
    const [urlA, urlB] = saved.map((list) => list.url);

    for (const [name, person, other] of [["A", a, b], ["B", b, a]] as const) {
      await test.step(`${name} sees their own list on My trips, and not the other's`, async () => {
        // A fresh page load, so the lists come from Supabase rather than from memory.
        await person.page.goto("/");
        await expect(person.page.getByRole("link", { name: person.list, exact: true })).toBeVisible();
        await expect(person.page.getByRole("link", { name: other.list, exact: true })).toHaveCount(0);
      });
    }

    for (const [name, person, other, otherUrl] of [["A", a, b, urlB], ["B", b, a, urlA]] as const) {
      await test.step(`${name} can't open the other's list by its address`, async () => {
        await person.page.goto(otherUrl);
        await expect(person.page.getByRole("heading", { level: 1, name: "Trip not found" })).toBeVisible();
        await expect(person.page.getByText(other.item)).toHaveCount(0);
      });
    }
  } finally {
    // Each person deletes their own list, so the test accounts stay as they were,
    // even when a check above fails.
    for (const { page, url } of saved) {
      await deleteList(page, url).catch((error) => console.warn(`Couldn't delete ${url}: ${error}`));
    }
  }
});
