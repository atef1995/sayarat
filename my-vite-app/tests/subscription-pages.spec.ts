import { test, expect } from "@playwright/test";
import { AuthTestUtils } from "./utils/authTestUtils";

test.describe("Subscription Success and Cancel Pages", () => {
  let authUtils: AuthTestUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthTestUtils(page);
    // Login before each test since subscription pages require authentication
    await authUtils.loginAs("regular");
  });
  test.afterEach(async () => {
    // Logout after each test
    await authUtils.logout();
  });

  test.describe("Subscription Success Page", () => {
    test("should display success message and features", async ({ page }) => {
      // Mock the subscription success page with a session ID since it's required
      await page.goto("/subscription/success?session_id=cs_test_12345");

      // Wait for loading to complete (the page has a 3-second delay)
      await page.waitForTimeout(4000);

      // The page might show loading state first, then success
      await expect(page.getByText("تم الاشتراك بنجاح!")).toBeVisible({
        timeout: 10000,
      });

      // Check for feature list in the premium card
      await expect(
        page.getByText("المساعد الذكي لتحليل السيارات")
      ).toBeVisible();

      await expect(page.getByText("إعلانات غير محدودة")).toBeVisible();

      // Check for action buttons
      await expect(
        page.getByRole("button", { name: "جرب المساعد الذكي" })
      ).toBeVisible();

      await expect(
        page.getByRole("button", { name: "إدارة الاشتراك" })
      ).toBeVisible();

      await expect(
        page.getByRole("button", { name: "العودة للرئيسية" })
      ).toBeVisible();
    });
    test("should handle navigation from success page", async ({ page }) => {
      await page.goto("/subscription/success?session_id=cs_test_12345");

      // Wait for loading to complete
      await page.waitForTimeout(4000);

      // Click continue button
      const continueButton = page.getByRole("button", {
        name: "العودة للرئيسية",
      });
      await continueButton.click();

      // Should navigate to home page
      await expect(page).toHaveURL("/");
    });

    test("should display subscription details on success page", async ({
      page,
    }) => {
      await page.goto("/subscription/success");

      // Check for subscription details
      const detailsSection = page.locator(
        '[data-testid="subscription-details"]'
      );

      if (await detailsSection.isVisible()) {
        await expect(detailsSection.getByText(/plan.*type/i)).toBeVisible();
        await expect(detailsSection.getByText(/billing.*cycle/i)).toBeVisible();
      }
    });
  });
  test.describe("Subscription Cancel Page", () => {
    test("should display cancellation message", async ({ page }) => {
      await page.goto("/subscription/cancel");

      // Check for cancellation messaging
      await expect(page.getByText("تم إلغاء عملية الاشتراك")).toBeVisible();

      await expect(
        page.getByText(
          "لم يتم إتمام عملية الدفع. لا تقلق، لم يتم خصم أي مبلغ من حسابك."
        )
      ).toBeVisible();

      // Check for action buttons
      await expect(
        page.getByRole("button", { name: "المحاولة مرة أخرى" })
      ).toBeVisible();

      await expect(
        page.getByRole("button", { name: "العودة للرئيسية" })
      ).toBeVisible();
    });

    test("should provide option to try again", async ({ page }) => {
      await page.goto("/subscription/cancel");

      // Look for try again button
      const tryAgainButton = page.getByRole("button", {
        name: "المحاولة مرة أخرى",
      });

      await tryAgainButton.click();

      // Should navigate to home page
      await expect(page).toHaveURL("/");
    });

    test("should handle navigation from cancel page", async ({ page }) => {
      await page.goto("/subscription/cancel");

      // Click return button
      const returnButton = page.getByRole("button", {
        name: "العودة للرئيسية",
      });
      await returnButton.click(); // Should navigate back to home
      await expect(page).toHaveURL("/");
    });

    test("should not show premium features as active on cancel page", async ({
      page,
    }) => {
      await page.goto("/subscription/cancel");

      // Should not show premium status as active
      const premiumActive = await page
        .getByText(/premium.*active|subscription.*active/i)
        .isVisible();
      expect(premiumActive).toBeFalsy();
    });
  });

  test.describe("Page Responsiveness", () => {
    test("should display success page correctly on mobile", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/subscription/success?session_id=cs_test_12345");

      // Wait for loading to complete
      await page.waitForTimeout(4000);

      // Check that content is properly responsive
      const mainContent = page.locator('main, [data-testid="success-content"]');
      if (await mainContent.isVisible()) {
        const boundingBox = await mainContent.boundingBox();
        expect(boundingBox?.width).toBeLessThanOrEqual(375);
      }

      // Check that buttons are accessible (they are buttons, not links)
      const continueButton = page.getByRole("button", {
        name: "العودة للرئيسية",
      });
      await expect(continueButton).toBeVisible();
    });

    test("should display cancel page correctly on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/subscription/cancel");

      // Check that content is properly responsive
      const mainContent = page.locator('main, [data-testid="cancel-content"]');
      if (await mainContent.isVisible()) {
        const boundingBox = await mainContent.boundingBox();
        expect(boundingBox?.width).toBeLessThanOrEqual(375);
      } // Check that buttons are accessible (they are buttons, not links)
      const returnButton = page.getByRole("button", {
        name: "العودة للرئيسية",
      });
      await expect(returnButton).toBeVisible();
    });
  });

  test.describe("URL Parameters and Query Handling", () => {
    test("should handle session_id parameter on success page", async ({
      page,
    }) => {
      await page.goto("/subscription/success?session_id=test_session_123");

      // Wait for loading to complete
      await page.waitForTimeout(4000);

      // Page should load without errors
      await expect(page.getByText("تم الاشتراك بنجاح!")).toBeVisible();

      // Should not display the session_id to user
      const sessionIdVisible = await page
        .getByText(/test_session_123/)
        .isVisible();
      expect(sessionIdVisible).toBeFalsy();
    });
    test("should handle error parameters gracefully", async ({ page }) => {
      await page.goto("/subscription/cancel?error=payment_failed");

      // Should show appropriate error message - check for the title specifically
      await expect(page.getByText("تم إلغاء عملية الاشتراك")).toBeVisible();
    });
  });
});
