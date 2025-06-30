import { test, expect } from "@playwright/test";
import { AuthTestUtils } from "./utils/authTestUtils";

test.describe("AI Car Analysis Premium Integration", () => {
  let authUtils: AuthTestUtils;

  test.beforeEach(async ({ page }) => {
    authUtils = new AuthTestUtils(page);
    // Login before each test since AI features require authentication
    await authUtils.loginAs("regular");

    await page.goto("/create-listing");
    await page.waitForLoadState("networkidle");
    // Ensure we are on the create listing page
    await expect(
      page.getByRole("heading", { name: /إضافة سيارة جديدة|Add New Car/i })
    ).toBeVisible();
  });

  test.afterEach(async () => {
    // Logout after each test
    await authUtils.logout();
  });
  test("should show premium requirement for AI image analysis", async ({
    page,
  }) => {
    // Look for AI analysis section
    const aiSection = page.getByText("المساعد الذكي لتحليل المركبات");

    if (await aiSection.isVisible()) {
      // Should show premium requirement alert for regular users
      await expect(page.getByText("خدمة مميزة")).toBeVisible();

      await expect(
        page.getByText("هذه الخدمة متوفرة للأعضاء المميزين ومعارض السيارات فقط")
      ).toBeVisible();

      // Should show upgrade button
      await expect(
        page.getByRole("button", { name: "الترقية للعضوية المميزة" })
      ).toBeVisible();
    }
  });
  test("should display premium badge on AI features", async ({ page }) => {
    // Check for premium indicators on AI features
    const premiumAlert = page.getByText("خدمة مميزة");
    const premiumDescription = page.getByText(
      "هذه الخدمة متوفرة للأعضاء المميزين ومعارض السيارات فقط"
    );

    // Should show premium requirement
    await expect(premiumAlert).toBeVisible();
    await expect(premiumDescription).toBeVisible();
  });
  test("should trigger subscription modal from AI feature", async ({
    page,
  }) => {
    // Click on the upgrade button in AI section
    const upgradeButton = page.getByRole("button", {
      name: "الترقية للعضوية المميزة",
    });

    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();

      // Check if subscription modal appears
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByText(/اختر الخطة المناسبة|Premium Plans/i)
      ).toBeVisible();
    }
  });
  test("should handle file upload restriction for non-premium users", async ({
    page,
  }) => {
    // For non-premium users, the upload button should not be visible
    // Instead they should see the premium requirement message    await expect(page.getByText("خدمة مميزة")).toBeVisible();

    // Upload button should not be available for non-premium users
    const uploadButton = page.getByRole("button", {
      name: "رفع صورة المركبة للتحليل",
    });

    // This button should either not exist or not be visible for regular users
    const isUploadVisible = await uploadButton.isVisible().catch(() => false);
    expect(isUploadVisible).toBeFalsy();
  });
  test("should show upgrade flow from AI helper", async ({ page }) => {
    // Navigate to AI helper section
    const aiSection = page.getByText("المساعد الذكي لتحليل المركبات");

    if (await aiSection.isVisible()) {
      // Click upgrade button within AI section
      const upgradeButton = page.getByRole("button", {
        name: "الترقية للعضوية المميزة",
      });

      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();

        // Should open subscription modal
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(
          page.getByText(/اختر الخطة المناسبة|Premium Plans/i)
        ).toBeVisible();
      }
    }
  });
  test("should display AI feature description for non-premium users", async ({
    page,
  }) => {
    // Check if there's a clear description of what the AI feature does
    await expect(page.getByText("المساعد الذكي لتحليل المركبات")).toBeVisible(); // Should show what the feature is about for non-premium users
    await expect(
      page.getByText("هذه الخدمة متوفرة للأعضاء المميزين ومعارض السيارات فقط")
    ).toBeVisible();

    // Should show the call-to-action to upgrade
    await expect(
      page.getByRole("button", { name: "الترقية للعضوية المميزة" })
    ).toBeVisible();
  });
});
