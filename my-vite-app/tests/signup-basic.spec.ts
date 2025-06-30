import { test, expect } from "@playwright/test";

test.describe("Signup Form Basic Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/create-account");
    await page.waitForLoadState("networkidle");
  });

  test("should load signup page", async ({ page }) => {
    // Check if the signup form title is visible
    await expect(page.locator('h1:has-text("إنشاء حساب جديد")')).toBeVisible();
  });

  test("should have form elements", async ({ page }) => {
    // Check for form presence
    await expect(page.locator("form")).toBeVisible();

    // Check for submit button
    await expect(page.locator('button:has-text("إنشاء الحساب")')).toBeVisible();
  });

  test("should show validation on empty submit", async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("إنشاء الحساب")');

    // Wait a moment for validation
    await page.waitForTimeout(1000);

    // Should see validation errors (any validation error indicates form validation is working)
    const errorElements = await page
      .locator(".ant-form-item-explain-error")
      .count();
    expect(errorElements).toBeGreaterThan(0);
  });

  test("should fill form fields", async ({ page }) => {
    // Try to fill each field type to ensure they're accessible

    // Text inputs - using a more generic approach
    const textInputs = page.locator('input[type="text"], input:not([type])');
    const inputCount = await textInputs.count();

    // Should have at least some text inputs
    expect(inputCount).toBeGreaterThan(0);

    // Try to fill the first few inputs
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      await textInputs.nth(i).fill("test");
      await textInputs.nth(i).clear();
    }

    // Check for password inputs
    const passwordInputs = page.locator('input[type="password"]');
    const passwordCount = await passwordInputs.count();
    expect(passwordCount).toBeGreaterThanOrEqual(2); // Should have password and confirm password

    // Check for date picker
    await expect(page.locator(".ant-picker")).toBeVisible();

    // Check for select (gender)
    await expect(page.locator(".ant-select")).toBeVisible();
  });

  test("should have working date picker", async ({ page }) => {
    await page.click(".ant-picker-input input");
    await expect(page.locator(".ant-picker-dropdown")).toBeVisible();

    // Close the picker
    await page.keyboard.press("Escape");
  });

  test("should have working gender select", async ({ page }) => {
    await page.click(".ant-select-selector");
    await expect(page.locator(".ant-select-dropdown")).toBeVisible();

    // Should have gender options
    await expect(page.locator(".ant-select-item-option")).toHaveCount(2);

    // Close the dropdown
    await page.keyboard.press("Escape");
  });
});
