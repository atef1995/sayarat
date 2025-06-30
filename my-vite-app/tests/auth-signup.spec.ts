import { test, expect, Page } from "@playwright/test";

// Configuration constants
const RETRY_CONFIG = {
  maxRetries: 3,
  timeout: 10000,
  shortTimeout: 5000,
  longTimeout: 30000,
};

// Test data types
interface TestUserData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: string;
}

// Test data generators
const generateTestUser = (): TestUserData => {
  const timestamp = Date.now();
  return {
    firstName: "أحمد",
    lastName: "محمد",
    email: `test.user.${timestamp}@example.com`,
    username: `testuser${timestamp}`,
    phone: "1234567890",
    password: "TestPassword123!",
    confirmPassword: "TestPassword123!",
    gender: "male",
  };
};

const generateInvalidTestData = () => ({
  invalidEmail: "invalid-email",
  shortPassword: "123",
  weakPassword: "password",
  shortPhone: "123",
  longPhone: "12345678901234567890",
});

// Enhanced retry utility function
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  timeout: number = RETRY_CONFIG.timeout
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Operation timed out after ${timeout}ms`)),
            timeout
          )
        ),
      ]);
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error("All retry attempts failed");
};

// Helper functions for form interaction
const fillSignupForm = async (page: Page, userData: TestUserData) => {
  // First wait for the form to be loaded
  await page.waitForSelector("form", { timeout: 10000 });

  // Fill form fields using the actual IDs
  await page.fill("#firstName", userData.firstName);
  await page.fill("#lastName", userData.lastName);
  await page.fill("#email", userData.email);
  await page.fill("#username", userData.username);
  await page.fill("#phone", userData.phone);
  // Fill date of birth (set to a date that makes user over 18)
  await page.click("#dateOfBirth");
  await page.waitForSelector(".ant-picker-dropdown", { timeout: 5000 });

  // Try different approaches for the date picker
  try {
    // First try to set year to 2000
    await page.click(".ant-picker-year-btn", { timeout: 2000 });
    await page.waitForSelector(
      ".ant-picker-decade-panel, .ant-picker-year-panel",
      { timeout: 2000 }
    );

    // Look for year 2000 in any format
    const yearCells = await page.locator(".ant-picker-cell").all();
    for (const cell of yearCells) {
      const text = await cell.textContent();
      if (text && text.includes("2000")) {
        await cell.click();
        break;
      }
    }

    // Select month (January)
    await page.click(".ant-picker-month-btn", { timeout: 2000 });
    await page.waitForSelector(".ant-picker-month-panel", { timeout: 2000 });
    await page.click(
      '.ant-picker-cell:has-text("Jan"), .ant-picker-cell:has-text("1")',
      { timeout: 2000 }
    );

    // Select day (15th)
    await page.click('.ant-picker-cell:has-text("15")', { timeout: 2000 });
  } catch {
    // If detailed date picking fails, just close the picker and continue
    console.log(
      "Date picker interaction failed, continuing without setting specific date"
    );
    await page.keyboard.press("Escape");
  }
  // Select gender
  try {
    await page.click("#gender");
    await page.waitForSelector(".ant-select-dropdown", { timeout: 5000 });
    // Try to click male option (ذكر)
    await page.click(
      '.ant-select-item-option:has-text("ذكر"), .ant-select-item-option[title="ذكر"]',
      { timeout: 3000 }
    );
  } catch {
    // If gender selection fails, just press escape and continue
    console.log("Gender selection failed, continuing without selecting gender");
    await page.keyboard.press("Escape");
  }

  // Fill passwords
  await page.fill("#password", userData.password);
  await page.fill("#confirmPassword", userData.confirmPassword);
};

const waitForApiResponse = async (page: Page, expectedStatus: number = 200) => {
  return page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/signup") &&
      response.status() === expectedStatus,
    { timeout: RETRY_CONFIG.longTimeout }
  );
};

test.describe("User Signup", () => {
  test.beforeEach(async ({ page }) => {
    await retryOperation(async () => {
      await page.goto("/create-account");
      await page.waitForLoadState("networkidle");

      // Wait for the signup form to be visible
      await expect(page.locator('h1:has-text("إنشاء حساب جديد")')).toBeVisible({
        timeout: RETRY_CONFIG.timeout,
      });
    });
  });

  test("should display signup form correctly", async ({ page }) => {
    // Check form title
    await expect(page.locator("h1")).toHaveText("إنشاء حساب جديد"); // Check all required form fields are present
    await expect(page.locator("#firstName")).toBeVisible();
    await expect(page.locator("#lastName")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#phone")).toBeVisible();
    await expect(page.locator("#dateOfBirth")).toBeVisible(); // Date picker
    await expect(page.locator("#gender")).toBeVisible(); // Gender select
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should successfully register a new user", async ({ page }) => {
    const userData = generateTestUser();

    await retryOperation(async () => {
      // Fill the signup form
      await fillSignupForm(page, userData);

      // Wait for API response
      const responsePromise = waitForApiResponse(page, 200);

      // Submit the form
      await page.click('button[type="submit"]');

      const response = await responsePromise;
      expect(response.status()).toBe(200);

      // Check for success message
      await expect(
        page.locator(".ant-message-success, .ant-notification-notice-success")
      ).toBeVisible({
        timeout: RETRY_CONFIG.timeout,
      });

      // Verify success message contains expected text
      const successMessage = await page
        .locator(
          ".ant-message-success .ant-message-custom-content, .ant-notification-notice-message"
        )
        .textContent();
      expect(successMessage).toContain("تم إنشاء الحساب بنجاح");

      // Verify form is reset or user is redirected
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(create-account|login|\/)?$/);
    });
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    await retryOperation(async () => {
      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Wait for validation errors
      await page.waitForTimeout(1000);

      // Check for required field validation messages
      const errorMessages = await page
        .locator(".ant-form-item-explain-error")
        .allTextContents();
      expect(errorMessages.length).toBeGreaterThan(0);

      // Check specific required field errors
      await expect(
        page.locator(
          '.ant-form-item-explain-error:has-text("الرجاء إدخال الاسم الأول")'
        )
      ).toBeVisible();
      await expect(
        page.locator(
          '.ant-form-item-explain-error:has-text("الرجاء إدخال الاسم الأخير")'
        )
      ).toBeVisible();
      await expect(
        page.locator(
          '.ant-form-item-explain-error:has-text("الرجاء إدخال البريد الإلكتروني")'
        )
      ).toBeVisible();
    });
  });

  test("should validate email format", async ({ page }) => {
    const invalidData = generateInvalidTestData();
    await retryOperation(async () => {
      await page.fill("#email", invalidData.invalidEmail);
      await page.fill("#firstName", "أحمد");
      await page.fill("#lastName", "محمد");

      // Click submit to trigger validation
      await page.click('button[type="submit"]');

      // Wait for validation error
      await expect(
        page.locator(
          '.ant-form-item-explain-error:has-text("البريد الإلكتروني غير صالح")'
        )
      ).toBeVisible({
        timeout: RETRY_CONFIG.shortTimeout,
      });
    });
  });

  test("should validate password requirements", async ({ page }) => {
    const invalidData = generateInvalidTestData();
    await retryOperation(async () => {
      // Test short password
      await page.fill("#firstName", "أحمد");
      await page.fill("#lastName", "محمد");
      await page.fill("#email", "test@example.com");
      await page.fill("#password", invalidData.shortPassword);

      await page.click('button[type="submit"]');

      await expect(
        page.locator(
          '.ant-form-item-explain-error:has-text("كلمة المرور يجب أن تكون 8 أحرف على الأقل")'
        )
      ).toBeVisible({
        timeout: RETRY_CONFIG.shortTimeout,
      }); // Test weak password
      await page.fill("#password", invalidData.weakPassword);
      await page.click('button[type="submit"]');

      await expect(
        page.locator(
          '.ant-form-item-explain-error:has-text("كلمة المرور يجب أن تحتوي على حروف وأرقام ورموز خاصة")'
        )
      ).toBeVisible({
        timeout: RETRY_CONFIG.shortTimeout,
      });
    });
  });

  test("should validate password confirmation", async ({ page }) => {
    const userData = generateTestUser();
    await retryOperation(async () => {
      await page.fill("#firstName", userData.firstName);
      await page.fill("#lastName", userData.lastName);
      await page.fill("#email", userData.email);
      await page.fill("#password", userData.password);
      await page.fill("#confirmPassword", "DifferentPassword123!");

      await page.click('button[type="submit"]');

      await expect(
        page.locator(
          '.ant-form-item-explain-error:has-text("كلمة المرور غير متطابقة")'
        )
      ).toBeVisible({
        timeout: RETRY_CONFIG.shortTimeout,
      });
    });
  });

  test("should validate phone number format", async ({ page }) => {
    const invalidData = generateInvalidTestData();
    await retryOperation(async () => {
      await page.fill("#firstName", "أحمد");
      await page.fill("#lastName", "محمد");
      await page.fill("#email", "test@example.com");
      await page.fill("#phone", invalidData.shortPhone);

      await page.click('button[type="submit"]');

      await expect(
        page.locator(
          '.ant-form-item-explain-error:has-text("رقم الهاتف غير صالح")'
        )
      ).toBeVisible({
        timeout: RETRY_CONFIG.shortTimeout,
      });
    });
  });

  test("should handle duplicate username error", async ({ page }) => {
    const userData = generateTestUser();
    userData.username = "existinguser"; // Assume this user already exists

    await retryOperation(async () => {
      await fillSignupForm(page, userData);

      // Wait for API response with error
      const responsePromise = waitForApiResponse(page, 409);

      await page.click('button[type="submit"]');

      const response = await responsePromise;
      expect(response.status()).toBe(409);

      // Check for error message
      await expect(
        page.locator(
          '.ant-message-error:has-text("اسم المستخدم غير صالح للاستخدام")'
        )
      ).toBeVisible({
        timeout: RETRY_CONFIG.timeout,
      });
    });
  });

  test("should handle duplicate email error", async ({ page }) => {
    const userData = generateTestUser();
    userData.email = "existing@example.com"; // Assume this email already exists

    await retryOperation(async () => {
      await fillSignupForm(page, userData);

      // Wait for API response with error
      const responsePromise = waitForApiResponse(page, 409);

      await page.click('button[type="submit"]');

      const response = await responsePromise;
      expect(response.status()).toBe(409);

      // Check for error message
      await expect(
        page.locator(
          '.ant-message-error:has-text("البريد الإلكتروني مسجل مسبقاً")'
        )
      ).toBeVisible({
        timeout: RETRY_CONFIG.timeout,
      });
    });
  });

  test("should validate age requirement", async ({ page }) => {
    const userData = generateTestUser();
    await retryOperation(async () => {
      await page.fill("#firstName", userData.firstName);
      await page.fill("#lastName", userData.lastName);
      await page.fill("#email", userData.email);
      await page.fill("#username", userData.username);
      await page.fill("#phone", userData.phone);

      // Set date of birth to make user under 16
      await page.click("#dateOfBirth");
      await page.waitForSelector(".ant-picker-dropdown");
      await page.click(".ant-picker-year-btn");
      await page.click('.ant-picker-cell[title="2015"]'); // Make user ~9 years old
      await page.click(".ant-picker-month-btn");
      await page.click('.ant-picker-cell[title="Jan"]');
      await page.click('.ant-picker-cell[title="15"]');

      await page.click('button[type="submit"]');

      await expect(
        page.locator(
          '.ant-form-item-explain-error:has-text("يجب أن يكون عمرك 16 سنة على الأقل")'
        )
      ).toBeVisible({
        timeout: RETRY_CONFIG.shortTimeout,
      });
    });
  });

  test("should handle server errors gracefully", async ({ page }) => {
    const userData = generateTestUser();

    // Mock a server error
    await page.route("**/api/auth/signup", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Internal server error",
        }),
      });
    });

    await retryOperation(async () => {
      await fillSignupForm(page, userData);
      await page.click('button[type="submit"]');

      // Check for error message
      await expect(
        page.locator(
          '.ant-message-error:has-text("حدث خطأ أثناء إنشاء الحساب")'
        )
      ).toBeVisible({
        timeout: RETRY_CONFIG.timeout,
      });
    });
  });

  test("should navigate to login page after successful signup", async ({
    page,
  }) => {
    const userData = generateTestUser();

    await retryOperation(async () => {
      await fillSignupForm(page, userData);

      const responsePromise = waitForApiResponse(page, 200);
      await page.click('button[type="submit"]');
      await responsePromise;

      // Wait for navigation
      await page.waitForTimeout(2000);

      // Check if redirected to home page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(login|\/)?$/);
    });
  });

  test("should reset form after successful submission", async ({ page }) => {
    const userData = generateTestUser();

    await retryOperation(async () => {
      await fillSignupForm(page, userData);

      const responsePromise = waitForApiResponse(page, 200);
      await page.click('button[type="submit"]');
      await responsePromise;

      // Wait for form reset
      await page.waitForTimeout(1000);
      // Check if form fields are cleared (if still on the same page)
      const firstNameValue = await page.locator("#firstName").inputValue();
      const emailValue = await page.locator("#email").inputValue();

      if (firstNameValue !== undefined) {
        expect(firstNameValue).toBe("");
      }
      if (emailValue !== undefined) {
        expect(emailValue).toBe("");
      }
    });
  });
  test("should have proper accessibility", async ({ page }) => {
    // Check for proper form labels and ARIA attributes
    await expect(page.locator("#firstName")).toHaveAttribute(
      "aria-required",
      "true"
    );
    await expect(page.locator("#email")).toHaveAttribute("type", "text"); // Ant Design email input may be type="text"
    await expect(page.locator("#password")).toHaveAttribute("type", "password");

    // Check form structure
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
});
