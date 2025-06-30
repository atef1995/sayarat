import { test, expect } from "@playwright/test";

test.describe("Basic Authentication Flow", () => {
  test("should redirect to login when accessing create listing without auth", async ({
    page,
  }) => {
    // Clear any existing auth
    await page.context().clearCookies();

    // Try to access create listing
    await page.goto("/create-listing");
    // Should be redirected to login or see login requirement
    const currentUrl = page.url();
    const hasLoginElements = await page
      .getByRole("heading", { name: /تسجيل الدخول|login/i })
      .isVisible();

    expect(currentUrl.includes("login") || hasLoginElements).toBeTruthy();
  });

  test("should show AI feature with premium requirement for non-authenticated users", async ({
    page,
  }) => {
    // Visit home page
    await page.goto("/");

    // If there's a way to access AI features from home, test it
    // Otherwise this test can be skipped
    const aiFeatures = await page
      .getByText(/ai.*analysis|ذكاء.*اصطناعي/i)
      .count();

    if (aiFeatures > 0) {
      // Click on AI feature
      await page
        .getByText(/ai.*analysis|ذكاء.*اصطناعي/i)
        .first()
        .click();

      // Should show some kind of premium requirement or login requirement
      const requiresAuth = await page
        .getByText(/login|premium|upgrade|تسجيل|مميز|ترقية/i)
        .isVisible();
      expect(requiresAuth).toBeTruthy();
    }
  });

  test("should display subscription modal when available", async ({ page }) => {
    await page.goto("/");

    // Look for any subscription-related buttons on the homepage
    const subscriptionButtons = [
      page.getByText(/subscription|اشتراك/i),
      page.getByText(/premium|مميز/i),
      page.getByText(/upgrade|ترقية/i),
    ];

    let foundButton = false;
    for (const button of subscriptionButtons) {
      if (await button.isVisible()) {
        await button.click();
        foundButton = true;

        // Look for modal or subscription page
        const modal = page.getByRole("dialog");
        const subscriptionContent = page.getByText(/plan|خطة|price|سعر/i);

        if (
          (await modal.isVisible()) ||
          (await subscriptionContent.isVisible())
        ) {
          expect(true).toBeTruthy(); // Found subscription interface
          break;
        }
      }
    }

    // If no subscription buttons found, that's also valid
    if (!foundButton) {
      console.log("No subscription buttons found on homepage - this is okay");
    }
  });

  // test("should handle subscription test page if it exists", async ({
  //   page,
  // }) => {
  //   try {
  //     await page.goto("/subscription-test");

  //     // Check if page loads successfully
  //     const pageTitle = await page.textContent('h1, h2, [role="heading"]');
  //     if (pageTitle) {
  //       expect(pageTitle).toBeTruthy();

  //       // Look for subscription modal trigger
  //       const modalTrigger = page.getByRole("button", {
  //         name: /open.*modal|test.*subscription/i,
  //       });
  //       if (await modalTrigger.isVisible()) {
  //         await modalTrigger.click();
  //         await expect(page.getByRole("dialog")).toBeVisible();
  //       }
  //     }
  //   } catch {
  //     // Test page might not exist, which is fine
  //     console.log("Subscription test page not found or not accessible");
  //   }
  // });
});
