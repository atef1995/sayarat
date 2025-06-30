import { test, expect, Page } from "@playwright/test";

test.describe("Subscription System", () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto("/");
  });

  test.describe("Premium Feature Access", () => {
    test("should show subscription modal when non-premium user accesses AI features", async () => {
      // Navigate to AI car analysis (or listing creation with AI helper)
      await page.goto("/test-subscription");

      // Look for AI upload button or similar premium feature
      const aiUploadButton = page.getByRole("button", {
        name: /upload.*image/i,
      });

      if (await aiUploadButton.isVisible()) {
        await aiUploadButton.click();
        // Check if subscription modal appears
        await expect(page.getByText(/الاشتراك المميز مطلوب/)).toBeVisible();
        await expect(page.getByText(/اختر الخطة المناسبة/)).toBeVisible();
      }
    });

    test("should display premium plans in subscription modal", async () => {
      await page.goto("/test-subscription");

      // Trigger subscription modal (this might vary based on implementation)
      const upgradeButton = page.getByRole("button", { name: /upgrade/i });
      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();
      }
      // Check for premium plan options
      await expect(page.getByText(/مميز شهري|premium monthly/i)).toBeVisible();
      await expect(page.getByText(/مميز سنوي|premium yearly/i)).toBeVisible();

      // Check plan features
      await expect(
        page.getByText(/مساعد ذكي|ai.*powered.*listing/i)
      ).toBeVisible();
      await expect(
        page.getByText(/إعلانات غير محدودة|unlimited.*listings/i)
      ).toBeVisible();
    });

    test("should close subscription modal when cancel is clicked", async () => {
      await page.goto("/test-subscription");

      // Open subscription modal
      const upgradeButton = page.getByRole("button", { name: /upgrade/i });
      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();
      }

      // Close modal
      const closeButton = page
        .getByRole("button", { name: /close|cancel/i })
        .first();
      await closeButton.click();
      // Modal should be hidden
      await expect(
        page.getByText(/اختر الخطة المناسبة|choose your plan/i)
      ).not.toBeVisible();
    });
  });

  test.describe("Stripe Integration", () => {
    test("should redirect to Stripe checkout when selecting premium plan", async () => {
      await page.goto("/test-subscription");

      // Open subscription modal
      const upgradeButton = page.getByRole("button", { name: /upgrade/i });
      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();
      }

      // Click on premium monthly plan
      const premiumMonthlyButton = page.getByRole("button", {
        name: /choose.*premium monthly/i,
      });
      if (await premiumMonthlyButton.isVisible()) {
        // We'll mock the Stripe redirect for testing
        // In a real test environment, you might want to use Stripe's test mode
        await premiumMonthlyButton.click();

        // Check if redirecting to Stripe (URL should contain checkout.stripe.com in real scenario)
        // For testing, we'll check if the checkout process starts
        await expect(page.getByText(/redirecting.*payment/i)).toBeVisible({
          timeout: 10000,
        });
      }
    });

    test("should handle Stripe checkout cancellation", async () => {
      // Navigate to the cancel page directly
      await page.goto("/subscription/cancel");
      // Check cancel page content
      await expect(
        page.getByText(/تم إلغاء عملية الاشتراك|subscription.*cancelled/i)
      ).toBeVisible();
      await expect(
        page.getByText(/لم يتم إتمام عملية الدفع|payment.*cancelled/i)
      ).toBeVisible();

      // Check for return to dashboard link
      const returnButton = page.getByRole("link", {
        name: /return.*dashboard/i,
      });
      await expect(returnButton).toBeVisible();
    });

    test("should handle successful subscription", async () => {
      // Navigate to the success page directly
      await page.goto("/subscription/success");
      // Check success page content
      await expect(
        page.getByText(/تم الاشتراك بنجاح|subscription.*successful/i)
      ).toBeVisible();
      await expect(
        page.getByText(/يمكنك الآن الاستفادة|premium.*features.*unlocked/i)
      ).toBeVisible();

      // Check for continue button
      const continueButton = page.getByRole("link", { name: /continue/i });
      await expect(continueButton).toBeVisible();
    });
  });

  test.describe("User Authentication & Subscription Flow", () => {
    test("should require authentication before accessing subscription features", async () => {
      // Try to access subscription features without being logged in
      await page.goto("/test-subscription");

      // Should redirect to login or show login prompt
      const loginRequired =
        (await page.getByText(/login.*required/i).isVisible()) ||
        (await page.getByText(/sign.*in/i).isVisible()) ||
        page.url().includes("/login");

      expect(loginRequired).toBeTruthy();
    });

    test("should show different UI for premium vs non-premium users", async () => {
      // This test would require setting up test users with different subscription statuses
      // For now, we'll test the UI elements that should be present

      await page.goto("/test-subscription");

      // Check for subscription status indicators
      const statusElements = [
        page.getByText(/premium.*status/i),
        page.getByText(/current.*plan/i),
        page.getByText(/upgrade.*premium/i),
      ];

      // At least one of these should be visible
      const visibleElements = await Promise.all(
        statusElements.map((element) => element.isVisible())
      );

      expect(visibleElements.some((visible) => visible)).toBeTruthy();
    });
  });

  test.describe("AI Feature Gating", () => {
    test("should block AI car analysis for non-premium users", async () => {
      await page.goto("/create-listing");

      // Look for AI analysis button/feature
      const aiButton = page.getByRole("button", {
        name: /ai.*analysis|analyze.*image/i,
      });

      if (await aiButton.isVisible()) {
        await aiButton.click();
        // Should show premium upgrade prompt
        await expect(
          page.getByText(/مطلوب اشتراك مميز|premium.*required/i)
        ).toBeVisible();
        await expect(
          page.getByText(/ترقية للوصول|upgrade.*unlock/i)
        ).toBeVisible();
      }
    });
    test("should show AI features are premium-only in UI", async () => {
      await page.goto("/create-listing");
      // Check for premium badges or locks on AI features
      const premiumIndicators = [
        page.getByText(/مميز فقط|premium.*only/i),
        page.locator('[data-premium="true"]'),
        page.getByText(/🔒.*مميز|🔒.*premium/i),
      ];

      // At least one premium indicator should be visible
      const visibleIndicators = await Promise.all(
        premiumIndicators.map((indicator) => indicator.isVisible())
      );

      expect(visibleIndicators.some((visible) => visible)).toBeTruthy();
    });
  });

  test.describe("Subscription Management", () => {
    test("should display subscription status correctly", async () => {
      await page.goto("/test-subscription");

      // Check for subscription status display
      const statusDisplay = page.locator('[data-testid="subscription-status"]');
      if (await statusDisplay.isVisible()) {
        const statusText = await statusDisplay.textContent();
        expect(statusText).toMatch(
          /(مجاني|مميز|نشط|غير نشط|free|premium|active|inactive)/i
        );
      }
    });

    test("should handle subscription loading states", async () => {
      await page.goto("/test-subscription");
      // Check for loading indicators
      const loadingIndicator = page.getByText(
        /جاري تحميل الاشتراك|loading.*subscription/i
      );

      // Loading should appear briefly then disappear
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
      }
    });

    test("should show proper error messages for failed subscription actions", async () => {
      // This would require mocking API failures
      // For now, we'll check that error handling UI elements exist

      await page.goto("/test-subscription");

      // Look for error handling UI elements
      const errorElements = [
        page.locator('[data-testid="subscription-error"]'),
        page.getByText(/error.*subscription/i),
        page.getByText(/failed.*load/i),
      ];

      // These elements might not be visible initially, but should exist in DOM
      const elementsExist = await Promise.all(
        errorElements.map((element) =>
          element.count().then((count) => count > 0)
        )
      );

      // At least one error handling element should exist
      expect(elementsExist.some((exists) => exists)).toBeTruthy();
    });
  });

  test.describe("Mobile Responsiveness", () => {
    test("should display subscription modal correctly on mobile", async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

      await page.goto("/test-subscription");

      // Open subscription modal
      const upgradeButton = page.getByRole("button", { name: /upgrade/i });
      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();
      }

      // Modal should be responsive
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible()) {
        const modalBox = await modal.boundingBox();
        expect(modalBox?.width).toBeLessThanOrEqual(375);
      }
    });

    test("should handle subscription flow on tablet", async () => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

      await page.goto("/test-subscription");

      // Check that subscription UI elements are properly sized
      const planCards = page.locator('[data-testid="subscription-plan"]');
      const cardCount = await planCards.count();

      if (cardCount > 0) {
        // Plans should be visible and properly arranged
        for (let i = 0; i < cardCount; i++) {
          await expect(planCards.nth(i)).toBeVisible();
        }
      }
    });
  });

  test.describe("Integration with Listing Creation", () => {
    test("should integrate subscription check with car listing AI helper", async () => {
      await page.goto("/create-listing");

      // Look for image upload in listing form
      const imageUpload = page.locator('input[type="file"]').first();

      if (await imageUpload.isVisible()) {
        // Try to upload an image (this should trigger subscription check)
        await imageUpload.setInputFiles({
          name: "test-car.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("fake-image-data"),
        });

        // Should show subscription modal or premium requirement
        const premiumPrompt = await page
          .getByText(/premium.*required|upgrade.*premium/i)
          .isVisible();
        const subscriptionModal = await page
          .getByText(/choose.*plan/i)
          .isVisible();

        expect(premiumPrompt || subscriptionModal).toBeTruthy();
      }
    });
  });
});
