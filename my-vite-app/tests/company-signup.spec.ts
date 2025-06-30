import { test, expect, Page } from "@playwright/test";

// Helper function to select Ant Design Select option
const selectAntOption = async (
  page: Page,
  selectId: string,
  optionText: string
): Promise<void> => {
  // Click the select to open dropdown
  await page.click(`#${selectId}`);
  await page.waitForTimeout(500);

  // Click the option
  await page.click(`.ant-select-item:has-text("${optionText}")`);
};

// Generate test data for company registration
const generateCompanyTestData = () => {
  const timestamp = Date.now();
  return {
    companyName: `Test Company ${timestamp}`,
    companyDescription: `This is a test company for automated testing purposes. Created at ${new Date().toISOString()}`,
    companyAddress: `123 Test Street ${timestamp}`,
    companyCity: "دمشق",
    taxId: `12345${timestamp.toString().slice(-4)}`,
    website: `https://test-company-${timestamp}.com`,
    firstName: `TestFirstName${timestamp}`,
    lastName: `TestLastName${timestamp}`,
    email: `testcompany${timestamp}@example.com`,
    username: `testcompany${timestamp}`,
    phone: "1234567890",
    password: "TestPassword123!",
    confirmPassword: "TestPassword123!",
    subscriptionType: "yearly",
  };
};

test.describe("Company Signup Form Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/company-signup");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator('h1:has-text("إنشاء حساب وكالة سيارات")')
    ).toBeVisible();
  });

  test("should display company signup form with steps", async ({ page }) => {
    // Check if the steps are visible
    await expect(page.locator(".ant-steps")).toBeVisible();

    // Check step titles
    await expect(page.locator("text=معلومات الشركة")).toBeVisible();
    await expect(page.locator("text=معلومات المسؤول")).toBeVisible();
    await expect(page.locator("text=الاشتراك والدفع")).toBeVisible();

    // Check initial form fields (Step 1)
    await expect(page.locator("#companyName")).toBeVisible();
    await expect(page.locator("#companyDescription")).toBeVisible();
    await expect(page.locator("#companyAddress")).toBeVisible();
    await expect(page.locator("#companyCity")).toBeVisible();
    await expect(page.locator("#taxId")).toBeVisible();
    await expect(page.locator("#website")).toBeVisible();
  });

  test("should navigate through steps correctly", async ({ page }) => {
    const companyData = generateCompanyTestData();
    // Step 1: Fill company information
    await page.fill("#companyName", companyData.companyName);
    await page.fill("#companyDescription", companyData.companyDescription);
    await page.fill("#companyAddress", companyData.companyAddress);
    await selectAntOption(page, "companyCity", companyData.companyCity);
    await page.fill("#taxId", companyData.taxId);
    await page.fill("#website", companyData.website);

    // Click Next
    await page.click('button:has-text("التالي")');

    // Should be on step 2
    await expect(page.locator("#firstName")).toBeVisible();
    await expect(page.locator("#lastName")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();

    // Fill step 2
    await page.fill("#firstName", companyData.firstName);
    await page.fill("#lastName", companyData.lastName);
    await page.fill("#email", companyData.email);
    await page.fill("#username", companyData.username);
    await page.fill("#phone", companyData.phone);
    await page.fill("#password", companyData.password);
    await page.fill("#confirmPassword", companyData.confirmPassword);

    // Click Next to step 3
    await page.click('button:has-text("التالي")');

    // Should be on step 3 (subscription)
    await expect(page.locator("text=اختر نوع الاشتراك")).toBeVisible();
    await expect(page.locator('input[value="monthly"]')).toBeVisible();
    await expect(page.locator('input[value="yearly"]')).toBeVisible();
  });
  test("should show validation errors for empty required fields", async ({
    page,
  }) => {
    // Try to go to next step without filling required fields
    await page.click('button:has-text("التالي")');

    // Should show validation errors - check for at least one error message
    await expect(
      page.locator(".ant-form-item-explain-error").first()
    ).toBeVisible();

    // Check for specific validation messages
    await expect(page.locator("text=الرجاء إدخال اسم الشركة")).toBeVisible();
  });

  test("should validate email format in step 2", async ({ page }) => {
    const companyData = generateCompanyTestData();
    // Fill step 1 to get to step 2
    await page.fill("#companyName", companyData.companyName);
    await page.fill("#companyDescription", companyData.companyDescription);
    await page.fill("#companyAddress", companyData.companyAddress);
    await selectAntOption(page, "companyCity", companyData.companyCity);
    await page.fill("#taxId", companyData.taxId);
    await page.click('button:has-text("التالي")');

    // Fill invalid email
    await page.fill("#email", "invalid-email");
    await page.click('button:has-text("التالي")');

    // Should show email validation error
    await expect(
      page.locator(
        '.ant-form-item-explain-error:has-text("البريد الإلكتروني غير صالح")'
      )
    ).toBeVisible();
  });
  test("should validate password requirements", async ({ page }) => {
    const companyData = generateCompanyTestData();

    // Navigate to step 2 - fill all required fields first
    await page.fill("#companyName", companyData.companyName);
    await page.fill("#companyDescription", companyData.companyDescription);
    await page.fill("#companyAddress", companyData.companyAddress);
    await selectAntOption(page, "companyCity", companyData.companyCity);
    await page.fill("#taxId", companyData.taxId);
    await page.fill("#website", companyData.website);
    await page.click('button:has-text("التالي")');

    // Wait for step 2 to load
    await expect(page.locator("#password")).toBeVisible();

    // Fill weak password
    await page.fill("#password", "weak");
    await page.fill("#confirmPassword", "weak");
    await page.click('button:has-text("التالي")');

    // Should show password validation error
    await expect(
      page.locator(".ant-form-item-explain-error").first()
    ).toBeVisible();
  });

  test("should validate password confirmation", async ({ page }) => {
    const companyData = generateCompanyTestData();

    // Navigate to step 2
    await page.fill("#companyName", companyData.companyName);
    await page.fill("#companyDescription", companyData.companyDescription);
    await page.fill("#companyAddress", companyData.companyAddress);
    await selectAntOption(page, "companyCity", companyData.companyCity);
    await page.fill("#taxId", companyData.taxId);
    await page.click('button:has-text("التالي")');

    // Fill mismatched passwords
    await page.fill("#password", "TestPassword123!");
    await page.fill("#confirmPassword", "DifferentPassword123!");
    await page.click('button:has-text("التالي")');

    // Should show password confirmation error
    await expect(
      page.locator(
        '.ant-form-item-explain-error:has-text("كلمة المرور غير متطابقة")'
      )
    ).toBeVisible();
  });

  test("should complete full company signup flow", async ({ page }) => {
    const companyData = generateCompanyTestData();

    // Step 1: Company Information
    await page.fill("#companyName", companyData.companyName);
    await page.fill("#companyDescription", companyData.companyDescription);
    await page.fill("#companyAddress", companyData.companyAddress);
    await selectAntOption(page, "companyCity", companyData.companyCity);
    await page.fill("#taxId", companyData.taxId);
    await page.fill("#website", companyData.website);
    await page.click('button:has-text("التالي")');

    // Step 2: Admin Information
    await page.fill("#firstName", companyData.firstName);
    await page.fill("#lastName", companyData.lastName);
    await page.fill("#email", companyData.email);
    await page.fill("#username", companyData.username);
    await page.fill("#phone", companyData.phone);
    await page.fill("#password", companyData.password);
    await page.fill("#confirmPassword", companyData.confirmPassword);
    await page.click('button:has-text("التالي")');

    // Step 3: Subscription
    await page.click('input[value="yearly"]');

    // Submit form
    const submitButton = page.locator(
      'button:has-text("إنشاء الحساب والمتابعة للدفع")'
    );
    await expect(submitButton).toBeVisible();

    // Mock the API response or handle the actual submission
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

    await submitButton.click();

    // Should redirect to payment page
    await expect(page).toHaveURL(/\/company-payment/);
  });

  test("should navigate back to personal signup", async ({ page }) => {
    const personalSignupLink = page.locator(
      'button:has-text("إنشاء حساب شخصي")'
    );
    await expect(personalSignupLink).toBeVisible();

    await personalSignupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("should handle previous button correctly", async ({ page }) => {
    const companyData = generateCompanyTestData();

    // Fill step 1 and go to step 2
    await page.fill("#companyName", companyData.companyName);
    await page.fill("#companyDescription", companyData.companyDescription);
    await page.fill("#companyAddress", companyData.companyAddress);
    await selectAntOption(page, "companyCity", companyData.companyCity);
    await page.fill("#taxId", companyData.taxId);
    await page.click('button:has-text("التالي")');

    // Should show previous button
    await expect(page.locator('button:has-text("السابق")')).toBeVisible();

    // Click previous
    await page.click('button:has-text("السابق")');

    // Should be back to step 1 with data preserved
    await expect(page.locator("#companyName")).toHaveValue(
      companyData.companyName
    );
  });
});
