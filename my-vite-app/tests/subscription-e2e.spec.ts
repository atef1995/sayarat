import { test, expect } from "@playwright/test";
import { SubscriptionTestUtils } from "./utils/subscriptionTestUtils";

test.describe("Subscription End-to-End Flow", () => {
  let subscriptionUtils: SubscriptionTestUtils;

  test.beforeEach(async ({ page }) => {
    subscriptionUtils = new SubscriptionTestUtils(page);
    await page.goto("/");
  });

  test("complete subscription flow - from AI trigger to success", async ({
    page,
  }) => {
    // Navigate to test subscription page
    await subscriptionUtils.navigateToSubscriptionPage("test");

    // Wait for subscription status to load
    await subscriptionUtils.waitForSubscriptionLoad();

    // Open subscription modal
    const modalOpened = await subscriptionUtils.openSubscriptionModal();
    if (modalOpened) {
      // Verify modal structure
      await subscriptionUtils.verifySubscriptionModal();

      // Select monthly plan
      await subscriptionUtils.selectPlan("monthly");
      // Should start checkout process
      await expect(
        page.getByText(
          /جاري إنشاء جلسة الدفع|جاري الاشتراك|processing|redirecting|loading/i
        )
      ).toBeVisible({ timeout: 10000 });
    }
  });
  test("AI feature gating prevents non-premium access", async ({ page }) => {
    // Navigate to listing creation
    await page.goto("/create-listing");

    // Try to access AI features
    const isGated = await subscriptionUtils.verifyAIFeatureGating();

    // Should show premium requirement
    expect(isGated).toBeTruthy();
  });

  test("subscription modal accessibility and keyboard navigation", async ({
    page,
  }) => {
    await subscriptionUtils.navigateToSubscriptionPage("test");

    const modalOpened = await subscriptionUtils.openSubscriptionModal();
    if (modalOpened) {
      // Test keyboard navigation
      await page.keyboard.press("Tab");

      // Focus should be within modal
      const focusedElement = await page.locator(":focus").getAttribute("class");
      expect(focusedElement).toBeTruthy();

      // ESC should close modal
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });

  test("responsive design across different screen sizes", async ({ page }) => {
    await subscriptionUtils.navigateToSubscriptionPage("test");

    // Test mobile responsiveness
    await subscriptionUtils.verifyResponsiveDesign(375, 667);

    const modalOpened = await subscriptionUtils.openSubscriptionModal();
    if (modalOpened) {
      // Modal should be responsive
      const modal = page.getByRole("dialog");
      const modalBox = await modal.boundingBox();
      expect(modalBox?.width).toBeLessThanOrEqual(375);

      await subscriptionUtils.closeSubscriptionModal();
    }

    // Test tablet responsiveness
    await subscriptionUtils.verifyResponsiveDesign(768, 1024);

    // Test desktop responsiveness
    await subscriptionUtils.verifyResponsiveDesign(1280, 720);
  });

  test("subscription success page functionality", async ({ page }) => {
    await subscriptionUtils.navigateToSubscriptionPage("success");
    await subscriptionUtils.verifySuccessPage();

    // Test navigation from success page
    const continueButton = page.getByRole("link", {
      name: /continue|get.*started/i,
    });
    if (await continueButton.isVisible()) {
      await continueButton.click();

      // Should navigate to appropriate page
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|listings|home)/);
    }
  });

  test("subscription cancel page functionality", async ({ page }) => {
    await subscriptionUtils.navigateToSubscriptionPage("cancel");
    await subscriptionUtils.verifyCancelPage();

    // Test navigation from cancel page
    const returnButton = page.getByRole("link", { name: /return|back/i });
    if (await returnButton.isVisible()) {
      await returnButton.click();

      // Should navigate back to main area
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|home|\/$)/);
    }
  });
  test("premium feature indicators are visible", async ({ page }) => {
    await page.goto("/create-listing");

    // Should show premium indicators
    const hasIndicators =
      await subscriptionUtils.verifyPremiumFeatureIndicators();
    expect(hasIndicators).toBeTruthy();
  });
  test("file upload triggers premium check", async ({ page }) => {
    await page.goto("/create-listing");

    // Upload image for AI analysis
    await subscriptionUtils.uploadImageForAI();
    // Should trigger premium requirement
    await expect(
      page.getByText(/مطلوب اشتراك مميز|premium.*required|upgrade.*access/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("subscription modal can be opened and closed multiple times", async ({
    page,
  }) => {
    await subscriptionUtils.navigateToSubscriptionPage("test");

    // Open modal
    let modalOpened = await subscriptionUtils.openSubscriptionModal();
    if (modalOpened) {
      await subscriptionUtils.verifySubscriptionModal();

      // Close modal
      await subscriptionUtils.closeSubscriptionModal();

      // Open modal again
      modalOpened = await subscriptionUtils.openSubscriptionModal();
      if (modalOpened) {
        await subscriptionUtils.verifySubscriptionModal();

        // Close with ESC
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).not.toBeVisible();
      }
    }
  });

  test("subscription pages handle URL parameters correctly", async ({
    page,
  }) => {
    // Test success page with session ID
    await page.goto("/subscription/success?session_id=test_session_123");
    await subscriptionUtils.verifySuccessPage();

    // Session ID should not be visible to user
    const sessionIdVisible = await page
      .getByText(/test_session_123/)
      .isVisible();
    expect(sessionIdVisible).toBeFalsy();

    // Test cancel page with error parameter
    await page.goto("/subscription/cancel?error=payment_failed");
    await subscriptionUtils.verifyCancelPage();
  });

  test("subscription flow handles errors gracefully", async ({ page }) => {
    await subscriptionUtils.navigateToSubscriptionPage("test");

    // Look for error handling elements
    const errorElements = [
      page.locator('[data-testid="subscription-error"]'),
      page.getByText(/error.*subscription/i),
    ];

    // These elements should exist in DOM for error handling
    let errorHandlingExists = false;
    for (const element of errorElements) {
      const count = await element.count();
      if (count > 0) {
        errorHandlingExists = true;
        break;
      }
    }

    // Should have error handling UI elements ready
    expect(errorHandlingExists).toBeTruthy();
  });
});
