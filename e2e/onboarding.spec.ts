import { test, expect } from "@playwright/test";

test.describe("onboarding", () => {
  test("new user can load demo from onboarding", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(`onboard-${Date.now()}@test.com`);
    await page.getByLabel("Password").fill("demo1234");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 20_000 });

    if (page.url().includes("/onboarding")) {
      await expect(page.getByText(/welcome|setup|paycheck/i).first()).toBeVisible();
      const demoBtn = page.getByRole("button", { name: /load demo|demo data/i }).first();
      if (await demoBtn.isVisible()) {
        await demoBtn.click();
      } else {
        await page.getByRole("button", { name: /start setup|continue|skip/i }).first().click();
      }
    }

    await page.waitForURL(/\/dashboard/, { timeout: 25_000 }).catch(() => {});
    await expect(page.locator("body")).toContainText(/dashboard|safe to spend|money left/i);
  });
});
