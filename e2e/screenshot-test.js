import { test, expect } from "@playwright/test";

/**
 * Simple test to verify Playwright setup and take a screenshot
 */

test("should take a screenshot of the application", async ({ page }) => {
  // Navigate to the app
  await page.goto("/");

  // Wait for the app to be ready
  await expect(page.locator("#main-content")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshot-app.png", fullPage: true });

  // Verify basic elements are present
  await expect(page.locator("text=Dashboard")).toBeVisible();
  await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
});
