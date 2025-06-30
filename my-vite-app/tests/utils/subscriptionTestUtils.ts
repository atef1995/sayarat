import { Page, expect } from "@playwright/test";

export class SubscriptionTestUtils {
  constructor(private page: Page) {}
  /**
   * Trigger the subscription modal by finding and clicking an upgrade button
   */
  async openSubscriptionModal(): Promise<boolean> {
    const triggerButtons = [
      this.page.getByRole("button", { name: /ترقية للمميز|upgrade.*premium/i }),
      this.page.getByRole("button", {
        name: /فتح اشتراك|trigger.*subscription/i,
      }),
      this.page.getByRole("button", { name: /فتح المميز|unlock.*premium/i }),
      this.page.getByText(/ترقية الآن|upgrade.*now/i),
    ];

    for (const button of triggerButtons) {
      if (await button.isVisible()) {
        await button.click();
        return true;
      }
    }
    return false;
  }
  /**
   * Check if subscription modal is visible and properly structured
   */
  async verifySubscriptionModal(): Promise<void> {
    await expect(this.page.getByRole("dialog")).toBeVisible();
    await expect(
      this.page.getByText(
        /الاشتراك المميز مطلوب|اختر الخطة المناسبة|choose.*plan|subscription.*plans/i
      )
    ).toBeVisible();

    // Check for plan options
    await expect(
      this.page.getByText(/مميز شهري|premium.*monthly/i)
    ).toBeVisible();
    await expect(
      this.page.getByText(/مميز سنوي|premium.*yearly/i)
    ).toBeVisible();
  }

  /**
   * Close the subscription modal
   */
  async closeSubscriptionModal(): Promise<void> {
    const closeButton = this.page.getByRole("button", { name: /close|×/i });
    await closeButton.click();
    await expect(this.page.getByRole("dialog")).not.toBeVisible();
  }
  /**
   * Select a subscription plan
   */
  async selectPlan(planType: "monthly" | "yearly"): Promise<void> {
    const planButton = this.page.getByRole("button", {
      name: new RegExp(
        `اشترك الآن|choose.*${planType}|select.*${planType}`,
        "i"
      ),
    });

    await expect(planButton).toBeVisible();
    await planButton.click();
  }
  /**
   * Check for premium feature indicators
   */
  async verifyPremiumFeatureIndicators(): Promise<boolean> {
    const indicators = [
      this.page.getByText(/مميز فقط|premium.*only/i),
      this.page.locator('[data-premium="true"]'),
      this.page.getByText(/🔒.*مميز|🔒.*premium/i),
      this.page.locator(".premium-badge"),
    ];

    for (const indicator of indicators) {
      if (await indicator.isVisible()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Navigate to a subscription-related page
   */
  async navigateToSubscriptionPage(
    page: "success" | "cancel" | "test"
  ): Promise<void> {
    const urls = {
      success: "/subscription/success",
      cancel: "/subscription/cancel",
      test: "/test-subscription",
    };

    await this.page.goto(urls[page]);
  }
  /**
   * Verify subscription success page content
   */
  async verifySuccessPage(): Promise<void> {
    await expect(
      this.page.getByText(
        /تم الاشتراك بنجاح|subscription.*successful|welcome.*premium/i
      )
    ).toBeVisible();
    await expect(
      this.page.getByText(/يمكنك الآن الاستفادة|premium.*features.*unlocked/i)
    ).toBeVisible();

    const continueButton = this.page.getByRole("link", {
      name: /جرب المساعد|إدارة الاشتراك|العودة للرئيسية|continue|get.*started/i,
    });
    await expect(continueButton).toBeVisible();
  }
  /**
   * Verify subscription cancel page content
   */
  async verifyCancelPage(): Promise<void> {
    await expect(
      this.page.getByText(
        /تم إلغاء عملية الاشتراك|لم يتم إتمام عملية الدفع|subscription.*cancelled|payment.*cancelled/i
      )
    ).toBeVisible();
    await expect(
      this.page.getByText(/لم يتم خصم أي مبلغ|no.*charges.*made/i)
    ).toBeVisible();

    const returnButton = this.page.getByRole("link", {
      name: /العودة للرئيسية|المحاولة مرة أخرى|return.*dashboard|back/i,
    });
    await expect(returnButton).toBeVisible();
  }
  /**
   * Check if AI features are properly gated
   */
  async verifyAIFeatureGating(): Promise<boolean> {
    // Look for AI features
    const aiFeatures = [
      this.page.getByRole("button", { name: /تحليل ذكي|ai.*analysis/i }),
      this.page.getByRole("button", { name: /تحليل الصورة|analyze.*image/i }),
      this.page.getByText(/رفع صورة للذكاء الاصطناعي|upload.*image.*ai/i),
    ];

    for (const feature of aiFeatures) {
      if (await feature.isVisible()) {
        await feature.click();

        // Check if premium requirement is shown
        const premiumRequired = await this.page
          .getByText(/مطلوب اشتراك مميز|premium.*required|upgrade.*premium/i)
          .isVisible();
        const subscriptionModal = await this.page
          .getByRole("dialog")
          .isVisible();

        return premiumRequired || subscriptionModal;
      }
    }
    return false;
  }

  /**
   * Simulate file upload for AI analysis
   */
  async uploadImageForAI(fileName = "test-car.jpg"): Promise<void> {
    const fileInput = this.page.locator('input[type="file"][accept*="image"]');

    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: fileName,
        mimeType: "image/jpeg",
        buffer: Buffer.from("mock-image-data"),
      });
    }
  }

  /**
   * Check responsive design on different viewports
   */
  async verifyResponsiveDesign(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });

    // Wait for any responsive adjustments
    await this.page.waitForTimeout(500);

    // Check that content fits within viewport
    const mainContent = this.page.locator('main, [role="main"]');
    if (await mainContent.isVisible()) {
      const boundingBox = await mainContent.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(width + 20); // Allow for small margin
    }
  }

  /**
   * Wait for subscription status to load
   */
  async waitForSubscriptionLoad(): Promise<void> {
    // Wait for loading to complete
    const loadingIndicator = this.page.getByText(/loading.*subscription/i);

    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }

    // Wait for content to appear
    await this.page
      .waitForSelector(
        '[data-testid="subscription-status"], .subscription-info',
        {
          timeout: 5000,
          state: "visible",
        }
      )
      .catch(() => {
        // If specific subscription elements aren't found, that's okay
        // The test will handle this case
      });
  }
}

export const subscriptionTestData = {
  mockUser: {
    email: "test@example.com",
    password: "password123",
    username: "testuser",
  },

  mockPlans: {
    monthly: {
      name: "Premium Monthly",
      price: "$9.99",
      features: [
        "AI-powered listings",
        "Unlimited listings",
        "Priority support",
      ],
    },
    yearly: {
      name: "Premium Yearly",
      price: "$99.99",
      features: [
        "AI-powered listings",
        "Unlimited listings",
        "Priority support",
        "2 months free",
      ],
    },
  },

  mockFiles: {
    carImage: {
      name: "test-car.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("mock-car-image-data"),
    },
  },
};
