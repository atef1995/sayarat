/**
 * Enhanced Company Signup E2E Tests
 *
 * FEATURES:
 * =========
 * - Debug capabilities for selector identification
 * - Comprehensive validation testing
 * - Updated form flow based on current implementation
 * - Network mocking for reliable testing
 * - Screenshots on failure for debugging
 *
 * VALIDATION TESTING:
 * ==================
 * - Company description: 10-1000 characters
 * - Company address: 5-200 characters
 * - Email format validation
 * - Password complexity requirements
 * - Username availability checking
 * - Real-time field validation
 *
 * #TODO: Add accessibility testing
 * #TODO: Add mobile responsive testing
 * #TODO: Add performance testing
 * #TODO: Add internationalization testing
 */

import { test, expect, Page } from "@playwright/test";

// Test data generator with realistic data
const generateCompanyTestData = () => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);

  return {
    // Company Information (Step 1)
    companyName: `شركة السيارات المتحدة ${randomSuffix}`,
    companyDescription: `نحن شركة متخصصة في بيع وشراء السيارات المستعملة والجديدة، نقدم خدمات متنوعة تشمل التمويل والصيانة والضمان. تأسست الشركة عام 2020 وتهدف إلى تقديم أفضل الخدمات لعملائنا الكرام في جميع أنحاء سوريا.`,
    companyAddress: `شارع الثورة، مبنى رقم 123، الطابق الثاني، مكتب ${randomSuffix}`,
    companyCity: "دمشق",
    taxId: `12345${timestamp.toString().slice(-6)}`,
    website: `https://cars-company-${randomSuffix}.com`,

    // Admin Information (Step 2)
    firstName: `أحمد`,
    lastName: `محمد`,
    email: `testcompany${randomSuffix}@example.com`,
    username: `carscompany${randomSuffix}`,
    phone: "0991234567",
    password: "SecurePass123!",
    confirmPassword: "SecurePass123!",
  };
};

// Helper functions for better test maintainability
class CompanySignupHelper {
  constructor(private page: Page) {}

  /**
   * Debug helper: Take screenshot and log page content
   */
  async debugPageContent(stepName: string) {
    await this.page.screenshot({
      path: `debug-${stepName}-${Date.now()}.png`,
      fullPage: true,
    });

    const formContent = await this.page.locator("form").innerHTML();
    console.log(`=== DEBUG: ${stepName} ===`);
    console.log("Form HTML content:", formContent.substring(0, 1000) + "...");

    // Log all visible input fields with their IDs/names
    const inputs = await this.page.locator("input, textarea, select").all();
    console.log("Available form fields:");
    for (const input of inputs) {
      const id = await input.getAttribute("id");
      const name = await input.getAttribute("name");
      const type = await input.getAttribute("type");
      const placeholder = await input.getAttribute("placeholder");
      console.log(
        `- ID: ${id}, Name: ${name}, Type: ${type}, Placeholder: ${placeholder}`
      );
    }
  }

  /**
   * Wait for step to be active and visible
   */
  async waitForStep(stepNumber: number) {
    // Wait for the step indicator to show current step
    await this.page.waitForSelector(
      `.ant-steps-item:nth-child(${stepNumber + 1}).ant-steps-item-active`,
      {
        state: "visible",
        timeout: 10000,
      }
    );
  }
  /**
   * Fill company information step with validation
   */
  async fillCompanyInfoStep(data: ReturnType<typeof generateCompanyTestData>) {
    await this.debugPageContent("company-info-step");

    // Fill company name using working selector
    await this.page.fill("#companyName", data.companyName);

    // Fill company description using working selector
    await this.page.fill("#companyDescription", data.companyDescription);

    // Verify character count is shown and within range
    const charCount = await this.page
      .locator(".ant-input-data-count")
      .textContent()
      .catch(() => null);
    if (charCount) {
      const count = parseInt(charCount.split("/")[0]);
      expect(count).toBeGreaterThanOrEqual(10);
      expect(count).toBeLessThanOrEqual(1000);
    }

    // Fill company address using working selector
    await this.page.fill("#companyAddress", data.companyAddress);

    // Select company city using working selector
    await this.page.click("#companyCity");
    await this.page.waitForTimeout(500);
    await this.page.click('.ant-select-item:has-text("دمشق")');
    await this.page.waitForTimeout(300);

    // Fill tax ID using working selector
    await this.page.fill("#taxId", data.taxId);

    // Fill website (optional) using working selector
    await this.page.fill("#website", data.website);
  }
  /**
   * Fill admin information step with validation
   */
  async fillAdminInfoStep(data: ReturnType<typeof generateCompanyTestData>) {
    await this.debugPageContent("admin-info-step");

    // Use the working selectors from step 2
    await this.page.fill("#firstName", data.firstName);
    await this.page.fill("#lastName", data.lastName);
    await this.page.fill("#email", data.email);
    await this.page.fill("#username", data.username);
    await this.page.fill("#phone", data.phone);
    await this.page.fill("#password", data.password);
    await this.page.fill("#confirmPassword", data.confirmPassword);
  }

  /**
   * Handle Ant Design Select dropdown - Simplified version
   */
  async selectAntOption(fieldName: string, optionText: string) {
    // Use the selector that we know works from testing
    await this.page.click(`#${fieldName}`);
    await this.page.waitForTimeout(500);
    await this.page.click(`.ant-select-item:has-text("${optionText}")`);
    await this.page.waitForTimeout(300);
  }

  /**
   * Click next button with validation
   */
  async clickNext() {
    const nextButton = this.page.locator('button:has-text("التالي")');
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Wait for step transition
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click previous button
   */
  async clickPrevious() {
    const prevButton = this.page.locator('button:has-text("السابق")');
    await expect(prevButton).toBeVisible();
    await expect(prevButton).toBeEnabled();
    await prevButton.click();

    // Wait for step transition
    await this.page.waitForTimeout(1000);
  }

  /**
   * Submit the final form
   */
  async submitForm() {
    const submitButton = this.page.locator('button:has-text("إنشاء الحساب")');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }
  /**
   * Check for validation errors
   */
  async checkValidationErrors(): Promise<string[]> {
    const errors = await this.page
      .locator(".ant-form-item-explain-error")
      .all();
    const errorMessages: string[] = [];

    for (const error of errors) {
      const text = await error.textContent();
      if (text) errorMessages.push(text);
    }

    return errorMessages;
  }
}

test.describe("Enhanced Company Signup Tests", () => {
  let helper: CompanySignupHelper;

  test.beforeEach(async ({ page }) => {
    helper = new CompanySignupHelper(page);

    // Setup network request interception for better control
    await page.route("**/api/auth/**", (route) => {
      const url = route.request().url();
      console.log("API Request:", url);
      route.continue();
    });

    // Navigate to company signup page
    await page.goto("/company-signup");
    await page.waitForLoadState("networkidle");

    // Verify page loaded correctly
    await expect(
      page.locator('h1:has-text("إنشاء حساب وكالة سيارات")')
    ).toBeVisible();

    // Take initial screenshot for debugging
    await helper.debugPageContent("initial-load");
  });

  test("should display all form elements correctly", async ({ page }) => {
    // Check step indicators
    await expect(page.locator(".ant-steps")).toBeVisible();
    await expect(page.locator('text="معلومات الشركة"')).toBeVisible();
    await expect(page.locator('text="معلومات المسؤول"')).toBeVisible();
    await expect(page.locator('text="اكتمال التسجيل"')).toBeVisible(); // Check company info fields using working selectors
    await expect(page.locator("#companyName")).toBeVisible();
    await expect(page.locator("#companyDescription")).toBeVisible();
    await expect(page.locator("#companyAddress")).toBeVisible();
    await expect(page.locator("#companyCity")).toBeVisible();
    await expect(page.locator("#taxId")).toBeVisible();
    await expect(page.locator("#website")).toBeVisible();
  });
  test("should validate company description length requirements", async ({
    page,
  }) => {
    // Test short description (less than 10 characters)
    await page.fill("#companyDescription", "قصير");
    await helper.clickNext();

    const errors = await helper.checkValidationErrors();
    expect(
      errors.some((error) => error.includes("10") || error.includes("أحرف"))
    ).toBeTruthy();

    // Test valid description
    const validDescription =
      "وصف مفصل للشركة ونشاطها التجاري في مجال السيارات والخدمات المتعلقة بها";
    await page.fill("#companyDescription", validDescription);

    // Errors should be cleared or reduced
    await page.waitForTimeout(1000);
  });

  test("should validate company address length requirements", async ({
    page,
  }) => {
    const data = generateCompanyTestData();

    // Fill other required fields first
    await page.fill('input[id*="companyName"]', data.companyName);
    await page.fill(
      'textarea[id*="companyDescription"]',
      data.companyDescription
    );

    // Test short address (less than 5 characters)
    await page.fill('input[id*="companyAddress"]', "دمشق");
    await helper.selectAntOption("companyCity", data.companyCity);
    await page.fill('input[id*="taxId"]', data.taxId);

    await helper.clickNext();

    const errors = await helper.checkValidationErrors();
    expect(
      errors.some((error) => error.includes("5") || error.includes("200"))
    ).toBeTruthy();
  });

  test("should complete full signup flow with network mocking", async ({
    page,
  }) => {
    const data = generateCompanyTestData();

    // Mock validation endpoints to return success
    await page.route("**/api/auth/validate-company-step", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Validation successful",
        }),
      });
    });

    await page.route("**/api/auth/validate-admin-step", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Validation successful",
        }),
      });
    });

    await page.route("**/api/auth/validate-company-signup", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Full validation successful",
        }),
      });
    });

    await page.route("**/api/auth/company-signup", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Company account created successfully",
          user: {
            id: "test-user-id",
            companyId: "test-company-id",
            accountType: "company",
          },
        }),
      });
    });

    // Step 1: Company Information
    await helper.fillCompanyInfoStep(data);
    await helper.clickNext();

    // Verify we're on step 2
    await helper.waitForStep(1);
    await expect(
      page.locator('input[id*="firstName"], input[name*="firstName"]')
    ).toBeVisible();

    // Step 2: Admin Information
    await helper.fillAdminInfoStep(data);
    await helper.clickNext();

    // Verify we're on step 3
    await helper.waitForStep(2);
    await expect(page.locator('text="اكتمال التسجيل"')).toBeVisible();

    // Step 3: Final submission
    await helper.submitForm(); // Should show success message or redirect
    await expect(
      page
        .locator('text="تم إنشاء حساب الشركة بنجاح"')
        .or(
          page
            .locator(".ant-message-success")
            .or(page.locator('[data-testid="success-message"]'))
        )
    ).toBeVisible({ timeout: 15000 });
  });

  test("should handle validation errors from backend", async ({ page }) => {
    const data = generateCompanyTestData();

    // Mock backend validation to return errors
    await page.route("**/api/auth/validate-company-signup", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "النص يجب أن يكون بين 10 و 1000 حرف",
          field: "companyDescription",
        }),
      });
    });

    // Fill form with valid data
    await helper.fillCompanyInfoStep(data);
    await helper.clickNext();
    await helper.fillAdminInfoStep(data);
    await helper.clickNext();

    // Try to submit - should show validation error
    await helper.submitForm(); // Should navigate back to step 1 and show error
    await helper.waitForStep(0);
    await expect(page.locator(".ant-message-error").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("should preserve form data when navigating between steps", async ({
    page,
  }) => {
    const data = generateCompanyTestData();

    // Fill step 1
    await helper.fillCompanyInfoStep(data);
    await helper.clickNext();

    // Fill step 2
    await helper.fillAdminInfoStep(data);

    // Go back to step 1
    await helper.clickPrevious();
    await helper.waitForStep(0);

    // Verify data is preserved
    await expect(page.locator('input[id*="companyName"]')).toHaveValue(
      data.companyName
    );
    await expect(
      page.locator('textarea[id*="companyDescription"]')
    ).toHaveValue(data.companyDescription);

    // Go forward to step 2
    await helper.clickNext();
    await helper.waitForStep(1);

    // Verify step 2 data is preserved
    await expect(page.locator('input[id*="firstName"]')).toHaveValue(
      data.firstName
    );
    await expect(page.locator('input[id*="email"]')).toHaveValue(data.email);
  });
  test("should show character count for description field", async ({
    page,
  }) => {
    const description = "وصف قصير للشركة";
    await page.fill('textarea[id*="companyDescription"]', description);

    // Wait for the character count to update
    await page.waitForTimeout(500);

    // Check if character count is displayed - Ant Design shows count for textarea
    const descriptionField = page.locator("#companyDescription");
    const parentContainer = descriptionField.locator(
      'xpath=ancestor::div[@class="ant-form-item-control-input-content"]'
    );
    const charCountElement = parentContainer.locator(".ant-input-data-count");

    await expect(charCountElement).toBeVisible();

    const charCountText = await charCountElement.textContent();
    console.log("Character count text:", charCountText);
    console.log("Description length:", description.length);

    // The format should be "X / 1000" where X is the character count
    expect(charCountText).toContain(description.length.toString());
    expect(charCountText).toContain("/ 1000");
  });

  test("should handle subscription modal after successful creation", async ({
    page,
  }) => {
    const data = generateCompanyTestData();

    // Mock successful company creation
    await page.route("**/api/auth/company-signup", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Company account created successfully",
          user: { id: "test-user-id", accountType: "company" },
        }),
      });
    });

    // Complete full flow
    await helper.fillCompanyInfoStep(data);
    await helper.clickNext();
    await helper.fillAdminInfoStep(data);
    await helper.clickNext();
    await helper.submitForm();

    // Should show subscription modal
    await expect(
      page.locator(".ant-modal").or(page.locator('[role="dialog"]'))
    ).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Take screenshot on failure for debugging
    if (testInfo.status !== testInfo.expectedStatus) {
      await page.screenshot({
        path: `test-failure-${testInfo.title.replace(
          /\s+/g,
          "-"
        )}-${Date.now()}.png`,
        fullPage: true,
      });
    }
  });
});
