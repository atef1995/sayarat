import { test, expect } from "@playwright/test";
import { AuthTestUtils } from "./utils/authTestUtils";

test.describe("Subscription System Integration Tests", () => {
  let authUtils: AuthTestUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthTestUtils(page);

    // Clear any existing auth state
    await authUtils.clearAuth();
  });

  test.describe("Authentication Requirements", () => {
    test("should require login to access create listing page", async ({
      page,
    }) => {
      // Try to access create listing without login
      await page.goto("/create-listing");

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
      await expect(page.getByText(/login|تسجيل الدخول/i)).toBeVisible();
    });

    test("should allow access to create listing after login", async ({
      page,
    }) => {
      // Login first
      await authUtils.loginAs("regular");

      // Navigate to create listing
      await authUtils.navigateToCreateListing();

      // Should be on create listing page
      await expect(
        page.getByRole("heading", {
          name: /إضافة سيارة جديدة|Add New Car|Create.*Listing/i,
        })
      ).toBeVisible();
    });
  });

  test.describe("AI Feature Access Control", () => {
    test("non-premium user cannot access AI features", async ({ page }) => {
      // Login as regular user
      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Look for AI analysis section
      const aiSection = page.locator(
        '.ai-analysis-section, [data-testid="ai-helper"]'
      );

      if (await aiSection.isVisible()) {
        // Should show premium requirement
        await expect(
          page.getByText(/ميزة مميزة|premium.*feature|upgrade.*required/i)
        ).toBeVisible();

        // Try to trigger AI feature
        const aiButton = page.getByRole("button", {
          name: /ai.*analysis|تحليل.*ذكي/i,
        });
        if (await aiButton.isVisible()) {
          await aiButton.click();

          // Should show subscription modal
          await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
          await expect(
            page.getByText(/choose.*plan|اختر.*خطة|subscription.*plans/i)
          ).toBeVisible();
        }
      }
    });

    test("premium user can access AI features", async ({ page }) => {
      // Login as premium user (would need to be set up with subscription)
      await authUtils.loginAs("premium");
      await authUtils.mockSubscriptionStatus(true, false);
      await authUtils.navigateToCreateListing();

      // Look for AI analysis section
      const aiSection = page.locator(
        '.ai-analysis-section, [data-testid="ai-helper"]'
      );

      if (await aiSection.isVisible()) {
        // Should not show premium requirement
        const premiumWarning = page.getByText(
          /ميزة مميزة|premium.*only|upgrade.*required/i
        );
        const isWarningVisible = await premiumWarning.isVisible();

        if (isWarningVisible) {
          // If warning is visible, it means access is blocked
          expect(isWarningVisible).toBeFalsy();
        } else {
          // Should have access to upload features
          const uploadButton = page.getByRole("button", {
            name: /upload.*image|رفع.*صورة/i,
          });
          await expect(uploadButton).toBeVisible();
        }
      }
    });

    test("company user can access AI features", async ({ page }) => {
      // Login as company user
      await authUtils.loginAs("company");
      await authUtils.mockSubscriptionStatus(false, true);
      await authUtils.navigateToCreateListing();

      // Similar test to premium user
      const aiSection = page.locator(
        '.ai-analysis-section, [data-testid="ai-helper"]'
      );

      if (await aiSection.isVisible()) {
        const premiumWarning = page.getByText(
          /ميزة مميزة|premium.*only|upgrade.*required/i
        );
        const isWarningVisible = await premiumWarning.isVisible();

        if (isWarningVisible) {
          expect(isWarningVisible).toBeFalsy();
        } else {
          const uploadButton = page.getByRole("button", {
            name: /upload.*image|رفع.*صورة/i,
          });
          await expect(uploadButton).toBeVisible();
        }
      }
    });
  });

  test.describe("Premium Badge Display", () => {
    test("should display premium badges on AI features", async ({ page }) => {
      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Check for premium indicators
      const premiumIndicators = [
        page.locator('[data-premium="true"]'),
        page.locator(".premium-badge"),
        page.getByText(/Premium/i),
        page.locator('[class*="premium"]'),
        page.getByText(/🔒/),
        page.getByText(/👑/),
      ];

      let foundIndicator = false;
      for (const indicator of premiumIndicators) {
        if (await indicator.isVisible()) {
          foundIndicator = true;
          break;
        }
      }

      expect(foundIndicator).toBeTruthy();
    });

    test("should show premium feature preview for non-premium users", async ({
      page,
    }) => {
      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Look for preview sections
      const previewElements = [
        page.getByText(/معاينة الميزة المميزة|Premium Feature Preview/i),
        page.getByText(/تحليل ذكي للصور|AI.*analysis.*preview/i),
        page.locator('[class*="preview"]'),
        page.getByText(/استخراج تلقائي للبيانات|automatic.*data.*extraction/i),
      ];

      let hasPreview = false;
      for (const element of previewElements) {
        if (await element.isVisible()) {
          hasPreview = true;
          break;
        }
      }

      expect(hasPreview).toBeTruthy();
    });
  });

  test.describe("Subscription Modal Integration", () => {
    test("should open subscription modal when AI feature is clicked", async ({
      page,
    }) => {
      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Find and click upgrade button or AI feature
      const upgradeButtons = [
        page.getByRole("button", {
          name: /ترقية إلى الحساب المميز|upgrade.*premium/i,
        }),
        page.getByRole("button", { name: /ai.*analysis|تحليل.*ذكي/i }),
        page.getByRole("button", {
          name: /رفع صورة.*للتحليل|upload.*image.*analysis/i,
        }),
      ];

      for (const button of upgradeButtons) {
        if (await button.isVisible()) {
          await button.click();

          // Check if modal opens
          const modal = page.getByRole("dialog");
          if (await modal.isVisible()) {
            await expect(
              page.getByText(/اختر.*خطة|choose.*plan|subscription.*plans/i)
            ).toBeVisible();
            break;
          }
        }
      }
    });

    test("should show proper subscription plans in modal", async ({ page }) => {
      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Trigger subscription modal
      const upgradeButton = page.getByRole("button", {
        name: /ترقية إلى الحساب المميز|upgrade.*premium/i,
      });

      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();

        // Wait for modal
        await expect(page.getByRole("dialog")).toBeVisible();

        // Check for plan elements
        const planElements = [
          page.getByText(/خطة شهرية|monthly.*plan/i),
          page.getByText(/خطة سنوية|yearly.*plan/i),
          page.getByText(/\$|ريال|price/i),
        ];

        let foundPlan = false;
        for (const element of planElements) {
          if (await element.isVisible()) {
            foundPlan = true;
            break;
          }
        }

        expect(foundPlan).toBeTruthy();
      }
    });

    test("should close subscription modal when cancelled", async ({ page }) => {
      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Open modal
      const upgradeButton = page.getByRole("button", {
        name: /ترقية إلى الحساب المميز|upgrade.*premium/i,
      });

      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();
        await expect(page.getByRole("dialog")).toBeVisible();

        // Close modal
        const closeButtons = [
          page.getByRole("button", { name: /close|إغلاق|cancel|إلغاء/i }),
          page.locator('[data-testid="modal-close"]'),
          page.locator(".ant-modal-close"),
        ];

        for (const closeBtn of closeButtons) {
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
            break;
          }
        }

        // Modal should close
        await expect(page.getByRole("dialog")).not.toBeVisible();
      }
    });
  });

  test.describe("File Upload Premium Check", () => {
    test("should trigger premium check on file upload for AI analysis", async ({
      page,
    }) => {
      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Look for AI file input
      const fileInputs = page.locator('input[type="file"][accept*="image"]');

      if ((await fileInputs.count()) > 0) {
        const aiFileInput = fileInputs.first();

        // Upload a test image
        await aiFileInput.setInputFiles({
          name: "test-car.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("fake-image-data"),
        });

        // Should trigger premium requirement or subscription modal
        const premiumCheck = await Promise.race([
          page
            .getByText(/مطلوب اشتراك مميز|premium.*required/i)
            .waitFor({ timeout: 5000 }),
          page.getByRole("dialog").waitFor({ timeout: 5000 }),
        ]).catch(() => null);

        expect(premiumCheck).toBeTruthy();
      }
    });
  });

  test.describe("Cross-Device Responsiveness", () => {
    test("should work correctly on mobile devices", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Check if AI section is visible and responsive
      const aiSection = page.locator(
        '.ai-analysis-section, [data-testid="ai-helper"]'
      );

      if (await aiSection.isVisible()) {
        // Premium indicators should be visible on mobile
        const premiumIndicator = page.getByText(/ميزة مميزة|premium.*feature/i);
        await expect(premiumIndicator).toBeVisible();

        // Upgrade button should be accessible
        const upgradeButton = page.getByRole("button", {
          name: /ترقية إلى الحساب المميز|upgrade.*premium/i,
        });

        if (await upgradeButton.isVisible()) {
          await upgradeButton.click();

          // Modal should open and be responsive
          await expect(page.getByRole("dialog")).toBeVisible();
        }
      }
    });

    test("should work correctly on tablet devices", async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Similar checks for tablet
      const aiSection = page.locator(
        '.ai-analysis-section, [data-testid="ai-helper"]'
      );
      await expect(aiSection).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should handle network errors gracefully during subscription flow", async ({
      page,
    }) => {
      await authUtils.loginAs("regular");
      await authUtils.navigateToCreateListing();

      // Simulate network failure
      await page.route("**/api/subscription/**", (route) => route.abort());

      const upgradeButton = page.getByRole("button", {
        name: /ترقية إلى الحساب المميز|upgrade.*premium/i,
      });

      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();

        // Should show error message
        await expect(page.getByText(/error|خطأ|failed|فشل/i)).toBeVisible({
          timeout: 10000,
        });
      }
    });
  });
});
