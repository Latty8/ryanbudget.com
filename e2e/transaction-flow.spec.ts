import { test, expect } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("e2e@test.com");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 });
  if (page.url().includes("/onboarding")) {
    await page.getByRole("button", { name: /load demo|finish|skip|start setup/i }).first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 }).catch(() => {});
  }
}

test.describe("transaction flow", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("adds a transaction from quick add modal", async ({ page }) => {
    await page.goto("/transactions");
    const add = page.getByRole("button", { name: /add transaction|quick add/i }).first();
    await add.click({ timeout: 10_000 });

    await expect(page.getByText(/quick transaction|add expense/i).first()).toBeVisible();

    const amountInput = page.getByLabel(/transaction amount/i);
    if (await amountInput.isVisible()) {
      await amountInput.fill("25");
    }

    const desc = page.getByPlaceholder(/coffee|uber|rent/i).first();
    if (await desc.isVisible()) {
      await desc.fill("E2E test coffee");
    }

    await page.getByRole("button", { name: /save transaction/i }).click();
    await expect(page.getByText(/e2e test coffee/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
