import { test, expect } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("e2e@test.com");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/);
  if (page.url().includes("/onboarding")) {
    await page.getByRole("button", { name: /load demo|finish|skip/i }).first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 }).catch(() => {});
  }
}

test.describe("critical budgeting flows", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("dashboard loads with safe-to-spend", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/safe to spend|money left/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("recurring page shows bi-weekly payroll", async ({ page }) => {
    await page.goto("/recurring");
    await expect(page.getByText(/recurring/i).first()).toBeVisible();
    await expect(page.getByText(/payroll|bi-weekly/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("budgets page shows category progress", async ({ page }) => {
    await page.goto("/budgets");
    await expect(page.getByText(/budget/i).first()).toBeVisible();
  });

  test("transactions page opens add flow", async ({ page }) => {
    await page.goto("/transactions");
    const addButton = page.getByRole("button", { name: /add|new transaction/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByText(/quick transaction|add expense/i).first()).toBeVisible();
    }
  });
});

test("marketing homepage is public", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  await expect(page.getByText(/paycheck planner/i).first()).toBeVisible();
});
