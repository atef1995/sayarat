import { test, expect } from "@playwright/test";

test.describe("Subscription Modal Component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test-subscription");
  });

  test("should display subscription modal with proper structure", async ({
    page,
  }) => {
    // Trigger the subscription modal
    const triggerButton = page.getByRole("button", {
      name: /trigger.*subscription|upgrade.*premium/i,
    });

    if (await triggerButton.isVisible()) {
      await triggerButton.click();
      // Check modal structure
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByText(
          /الاشتراك المميز مطلوب|اختر الخطة المناسبة|choose.*plan|subscription.*plans/i
        )
      ).toBeVisible();

      // Check for plan options
      await expect(page.getByText(/مميز شهري|premium.*monthly/i)).toBeVisible();
      await expect(page.getByText(/مميز سنوي|premium.*yearly/i)).toBeVisible();

      // Check for pricing
      await expect(page.getByText(/\$\d+/)).toBeVisible(); // Should show price

      // Check for close button
      await expect(
        page.getByRole("button", { name: /close|×/i })
      ).toBeVisible();
    }
  });

  test("should close modal when clicking close button", async ({ page }) => {
    const triggerButton = page.getByRole("button", {
      name: /trigger.*subscription|upgrade.*premium/i,
    });

    if (await triggerButton.isVisible()) {
      await triggerButton.click();

      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Click close button
      await page.getByRole("button", { name: /close|×/i }).click();

      // Modal should be hidden
      await expect(modal).not.toBeVisible();
    }
  });

  test("should close modal when clicking outside", async ({ page }) => {
    const triggerButton = page.getByRole("button", {
      name: /trigger.*subscription|upgrade.*premium/i,
    });

    if (await triggerButton.isVisible()) {
      await triggerButton.click();

      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Click outside modal (on backdrop)
      await page
        .locator(".modal-backdrop, [data-modal-backdrop]")
        .click({ force: true });

      // Modal should be hidden
      await expect(modal).not.toBeVisible();
    }
  });

  test("should handle plan selection", async ({ page }) => {
    const triggerButton = page.getByRole("button", {
      name: /trigger.*subscription|upgrade.*premium/i,
    });

    if (await triggerButton.isVisible()) {
      await triggerButton.click();
      // Select monthly plan
      const monthlyPlan = page.getByRole("button", {
        name: /اشترك الآن|choose.*monthly|select.*monthly/i,
      });
      if (await monthlyPlan.isVisible()) {
        await monthlyPlan.click();

        // Should start checkout process or show loading
        await expect(
          page.getByText(
            /جاري إنشاء جلسة الدفع|جاري الاشتراك|processing|redirecting|loading/i
          )
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("should display proper plan features", async ({ page }) => {
    const triggerButton = page.getByRole("button", {
      name: /trigger.*subscription|upgrade.*premium/i,
    });

    if (await triggerButton.isVisible()) {
      await triggerButton.click();
      // Check for feature lists
      await expect(
        page.getByText(/المساعد الذكي|ai.*powered.*listing/i)
      ).toBeVisible();
      await expect(
        page.getByText(/إعلانات غير محدودة|unlimited.*listings/i)
      ).toBeVisible();
      await expect(
        page.getByText(/دعم أولوية|priority.*support/i)
      ).toBeVisible();
    }
  });

  test("should handle keyboard navigation", async ({ page }) => {
    const triggerButton = page.getByRole("button", {
      name: /trigger.*subscription|upgrade.*premium/i,
    });

    if (await triggerButton.isVisible()) {
      await triggerButton.click();

      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Test ESC key closes modal
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible();
    }
  });
});
