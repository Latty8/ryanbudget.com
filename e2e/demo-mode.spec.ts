import { test, expect } from "@playwright/test";

test.describe("demo mode", () => {
  test("homepage launches demo without sign-in", async ({ page }) => {
    await page.goto("/");
    const demoButton = page.getByRole("button", { name: /try demo/i }).first();
    await expect(demoButton).toBeVisible();
    await demoButton.click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByText(/safe to spend|money left/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
