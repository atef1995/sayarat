import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import { getRandomImages as getRandomImagesHelper } from "./utils/imageUploadHelper";

// Configuration constants
const RETRY_CONFIG = {
  maxRetries: 3,
  timeout: 10000,
  shortTimeout: 5000,
  longTimeout: 30000,
};

// Get the fixtures directory path reliably
const getFixturesDir = (): string => {
  const cwd = process.cwd();
  return path.join(cwd, "tests", "fixtures");
};

// Utility function to get random images from fixtures directory (using helper)
const getRandomImages = async (count: number = 2): Promise<string[]> => {
  return await getRandomImagesHelper({
    count,
    sourceDir: getFixturesDir(),
  });
};

// Enhanced retry utility function
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  operationName: string = "operation"
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Attempting ${operationName} (attempt ${attempt}/${maxRetries})`
      );
      const result = await operation();
      if (attempt > 1) {
        console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      console.log(
        `❌ ${operationName} failed on attempt ${attempt}: ${lastError.message}`
      );

      if (attempt < maxRetries) {
        const delay = attempt * 1000; // Progressive delay
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `${operationName} failed after ${maxRetries} attempts. Last error: ${
      lastError?.message || "Unknown error"
    }`
  );
};

// Enhanced text input filling with verification
const fillTextInput = async (
  page: Page,
  inputName: string,
  value: string
): Promise<void> => {
  await retryOperation(
    async () => {
      const input = page.getByRole("textbox", { name: inputName });

      // Wait for input to be visible and enabled
      await input.waitFor({ state: "visible", timeout: RETRY_CONFIG.timeout });
      await expect(input).toBeEnabled({ timeout: RETRY_CONFIG.shortTimeout });

      // Clear existing value
      await input.clear();
      await page.waitForTimeout(200);

      // Fill the value
      await input.fill(value);
      await page.waitForTimeout(300);

      // Verify the value was set correctly
      const actualValue = await input.inputValue();
      if (actualValue !== value) {
        throw new Error(
          `Expected "${value}" but got "${actualValue}" for ${inputName}`
        );
      }

      console.log(`✅ Successfully filled ${inputName} with: ${value}`);
    },
    RETRY_CONFIG.maxRetries,
    `fill text input "${inputName}"`
  );
};

// Enhanced number input filling
const fillNumberInput = async (
  page: Page,
  inputName: string,
  value: string
): Promise<void> => {
  await retryOperation(
    async () => {
      const input = page.getByRole("spinbutton", { name: inputName });

      // Wait for input to be visible and enabled
      await input.waitFor({ state: "visible", timeout: RETRY_CONFIG.timeout });
      await expect(input).toBeEnabled({ timeout: RETRY_CONFIG.shortTimeout });

      // Clear and fill
      await input.clear();
      await page.waitForTimeout(200);
      await input.fill(value);
      await page.waitForTimeout(300); // Verify value (handle formatted numbers with commas)
      const actualValue = await input.inputValue();
      const normalizedActual = actualValue.replace(/,/g, "");
      const normalizedExpected = value.replace(/,/g, "");

      if (normalizedActual !== normalizedExpected) {
        throw new Error(
          `Expected "${value}" but got "${actualValue}" for ${inputName}`
        );
      }

      console.log(
        `✅ Successfully filled number input ${inputName} with: ${value}`
      );
    },
    RETRY_CONFIG.maxRetries,
    `fill number input "${inputName}"`
  );
};

// Enhanced radio button selection
const selectRadioWithRetry = async (
  page: Page,
  value: string
): Promise<void> => {
  await retryOperation(
    async () => {
      // Wait for radio group to be visible
      await page.waitForSelector(".ant-radio-button-wrapper", {
        timeout: RETRY_CONFIG.timeout,
      });

      const radioButton = page.locator(".ant-radio-button-wrapper", {
        hasText: value,
      });
      await radioButton.waitFor({
        state: "visible",
        timeout: RETRY_CONFIG.shortTimeout,
      });
      await radioButton.click();

      // Verify selection
      await page.waitForTimeout(300);
      const checkedButton = page.locator(".ant-radio-button-wrapper-checked");
      await expect(checkedButton).toHaveText(value, {
        timeout: RETRY_CONFIG.shortTimeout,
      });

      console.log(`✅ Successfully selected radio button: ${value}`);
    },
    RETRY_CONFIG.maxRetries,
    `select radio button "${value}"`
  );
};

const fillStripePayment = async (page) => {
  console.log("💳 Starting Stripe payment process...");

  await retryOperation(
    async () => {
      // Initial wait for Stripe to load
      await page.waitForTimeout(5000);

      const stripeFrameName = await page.evaluate(() => {
        const iframes = document.querySelectorAll("iframe");
        for (const iframe of iframes) {
          if (iframe.name && iframe.name.startsWith("__privateStripeFrame")) {
            console.log("Stripe frame found:", iframe.name);
            return iframe.name;
          }
        }
        return null;
      });

      if (!stripeFrameName) {
        throw new Error("Stripe frame not found");
      }

      // Wait for the Stripe iframe to load
      await page.waitForSelector(`[name="${stripeFrameName}"]`, {
        state: "attached",
        timeout: RETRY_CONFIG.longTimeout,
      });

      // Get the Stripe iframe
      const stripeFrame = page.frameLocator(`[name="${stripeFrameName}"]`);

      // Wait for the card number input to be visible and enabled
      const cardInput = stripeFrame.locator('[name="number"]');
      await cardInput.waitFor({
        state: "visible",
        timeout: RETRY_CONFIG.longTimeout,
      });
      await expect(cardInput).toBeEnabled({
        timeout: RETRY_CONFIG.longTimeout,
      });

      // Fill payment details with verification
      await cardInput.fill("4242424242424242");
      await page.waitForTimeout(500);

      await stripeFrame.locator('[name="expiry"]').fill("12/34");
      await page.waitForTimeout(500);

      await stripeFrame.locator('[name="cvc"]').fill("123");
      await page.waitForTimeout(500);

      // Wait for payment button to be enabled
      await page.waitForSelector('button:has-text("دفع"):not([disabled])', {
        state: "visible",
        timeout: RETRY_CONFIG.longTimeout,
      });

      console.log("✅ Stripe payment form filled successfully!");
    },
    RETRY_CONFIG.maxRetries,
    "fill Stripe payment form"
  );
};

const selectRadio = async (page: Page, value: string) => {
  await selectRadioWithRetry(page, value);
};

const fillCreateListingForm = async (page: Page) => {
  console.log("🚀 Starting to fill create listing form...");

  await retryOperation(
    async () => {
      await page.goto("/create-listing");
      await page.waitForLoadState("networkidle");

      // Verify page loaded correctly
      await expect(
        page.getByRole("textbox", { name: "عنوان الإعلان" })
      ).toBeVisible({
        timeout: RETRY_CONFIG.timeout,
      });
    },
    RETRY_CONFIG.maxRetries,
    "navigate to create listing page"
  );

  // Fill title with retry
  await fillTextInput(page, "عنوان الإعلان", "Test Car Listing"); // Handle manufacturer selection using enhanced searchable combobox helper
  await fillSearchableCombobox(page, "الشركة المصنعة", "Toyota");

  await fillSearchableCombobox(page, "الموديل", "Camry");
  // Handle year selection using searchable combobox
  await fillSearchableCombobox(page, "سنة الصنع", "2020");
  // Handle mileage selection using searchable combobox
  await fillSearchableCombobox(page, "عدد الكيلومترات", "50000");

  // Fill price with retry
  await fillNumberInput(page, "السعر", "15000");

  // Fill remaining dropdowns
  await fillSearchableCombobox(page, "اللون", "أبيض");
  await selectRadio(page, "اوتوماتيك");
  await fillSearchableCombobox(page, "الوقود", "بنزين");
  await fillReadOnlyCombobox(page, "المحافظة", "دمشق");
  await fillSearchableCombobox(page, "نوع السيارة", "جبلية");

  // Enhanced image upload with retry
  await retryOperation(
    async () => {
      const uploadInput = page.locator('input[type="file"]').first();
      await uploadInput.waitFor({
        state: "attached",
        timeout: RETRY_CONFIG.timeout,
      });

      // Get random images from fixtures directory
      const randomImages = await getRandomImages(2);
      console.log("📷 Selected random images:", randomImages);

      await uploadInput.setInputFiles(randomImages);

      // Wait for images to be uploaded with timeout
      await page.waitForSelector(".ant-upload-list-item", {
        state: "attached",
        timeout: RETRY_CONFIG.longTimeout,
      });

      // Verify correct number of images uploaded
      const uploadedImages = await page
        .locator(".ant-upload-list-item")
        .count();
      if (uploadedImages !== randomImages.length) {
        throw new Error(
          `Expected ${randomImages.length} images but got ${uploadedImages}`
        );
      }

      console.log(`✅ Successfully uploaded ${uploadedImages} images`);
    },
    RETRY_CONFIG.maxRetries,
    "upload images"
  );

  // Fill description with retry
  await fillTextInput(page, "الوصف", "This is a test car listing");

  console.log("✅ Form filling completed successfully!");
};

const logout = async (page: Page) => {
  console.log("🚪 Logging out...");

  await retryOperation(
    async () => {
      await page.goto("/create-listing");
      await page.waitForLoadState("networkidle");

      const logoutButton = page.getByRole("menuitem", {
        name: "logout تسجيل الخروج",
      });
      await logoutButton.waitFor({
        state: "visible",
        timeout: RETRY_CONFIG.timeout,
      });
      await logoutButton.click();

      // Wait for the logout process to complete
      await page.waitForTimeout(1000);

      // Ensure the user is logged out
      const loginButton = page.getByRole("menuitem", {
        name: "login تسجيل الدخول",
      });
      await loginButton.waitFor({
        state: "visible",
        timeout: RETRY_CONFIG.timeout,
      });
      await expect(loginButton).toBeVisible();

      // Verify redirection to root page
      await expect(page).toHaveURL("/");
      console.log("✅ Successfully logged out");
    },
    RETRY_CONFIG.maxRetries,
    "logout process"
  );
};

// Enhanced searchable combobox (for manufacturer, model, etc.)
const fillSearchableCombobox = async (
  page: Page,
  label: string,
  value: string,
  isRequired: boolean = true
): Promise<void> => {
  const selectorName = isRequired ? `* ${label}` : label;
  await retryOperation(
    async () => {
      const combobox = page.getByRole("combobox", { name: selectorName });
      await combobox.waitFor({
        state: "visible",
        timeout: RETRY_CONFIG.timeout,
      });

      // Check if the value is already selected
      const currentText = await combobox.textContent();
      if (currentText?.includes(value)) {
        console.log(`✅ ${label} already selected: ${value}`);
        return;
      }

      // Check if there's a selection display span that might be blocking
      const selectionDisplay = page.locator(
        `.ant-select-selection-item[title="${value}"]`
      );
      if (await selectionDisplay.isVisible()) {
        console.log(`✅ ${label} already selected via display: ${value}`);
        return;
      }

      // Click to focus the combobox - use force if blocked
      try {
        await combobox.click();
      } catch {
        // If click is blocked, try force click
        await combobox.click({ force: true });
      }

      // Clear any existing text
      await combobox.clear();
      await page.waitForTimeout(200);

      // Type the value to filter options
      await combobox.fill(value);
      await page.waitForTimeout(500); // Wait for filtering to complete

      // Wait for dropdown to be visible
      await page.waitForSelector(".ant-select-dropdown:visible", {
        timeout: RETRY_CONFIG.timeout,
      });

      // Try multiple selectors for the option
      let option = page.locator(`.ant-select-item-option[title="${value}"]`);

      // If title selector doesn't work, try text content
      if (!(await option.isVisible({ timeout: 1000 }))) {
        option = page
          .locator(".ant-select-item-option")
          .filter({ hasText: value });
      }

      // If still not found, try case-insensitive match
      if (!(await option.isVisible({ timeout: 1000 }))) {
        option = page.locator(".ant-select-item-option").filter({
          hasText: new RegExp(value, "i"),
        });
      }

      await option.waitFor({
        state: "visible",
        timeout: RETRY_CONFIG.shortTimeout,
      });

      // Scroll into view if needed
      await option.scrollIntoViewIfNeeded();
      await option.click();

      // Wait for dropdown to close
      await page.waitForSelector(".ant-select-dropdown", {
        state: "hidden",
        timeout: RETRY_CONFIG.timeout,
      });

      // Verify selection
      await page.waitForTimeout(500);
      const selectedText = await combobox.textContent();
      const hasSelectionDisplay = await page
        .locator(`.ant-select-selection-item[title="${value}"]`)
        .isVisible();

      if (!selectedText?.includes(value) && !hasSelectionDisplay) {
        throw new Error(
          `Failed to select "${value}" for ${label}. Current text: "${selectedText}"`
        );
      }

      console.log(`✅ Successfully selected ${label}: ${value}`);
    },
    RETRY_CONFIG.maxRetries,
    `select "${value}" for "${label}"`
  );
};

// Fallback for non-searchable/readonly comboboxes (like city/location)
const fillReadOnlyCombobox = async (
  page: Page,
  label: string,
  value: string,
  isRequired: boolean = true
): Promise<void> => {
  const selectorName = isRequired ? `* ${label}` : label;

  await retryOperation(
    async () => {
      const combobox = page.getByRole("combobox", { name: selectorName });
      await combobox.waitFor({
        state: "visible",
        timeout: RETRY_CONFIG.timeout,
      });

      // Check if the value is already selected
      const currentText = await combobox.textContent();
      if (currentText?.includes(value)) {
        console.log(`✅ ${label} already selected: ${value}`);
        return;
      }

      // For readonly comboboxes, just click to open dropdown
      await combobox.click();

      // Wait for dropdown to be visible
      await page.waitForSelector(".ant-select-dropdown:visible", {
        timeout: RETRY_CONFIG.timeout,
      });

      // Try multiple selectors for the option
      let option = page.locator(`.ant-select-item-option[title="${value}"]`);

      // If title selector doesn't work, try text content
      if (!(await option.isVisible({ timeout: 1000 }))) {
        option = page
          .locator(".ant-select-item-option")
          .filter({ hasText: value });
      }

      // If still not found, try case-insensitive match
      if (!(await option.isVisible({ timeout: 1000 }))) {
        option = page.locator(".ant-select-item-option").filter({
          hasText: new RegExp(value, "i"),
        });
      }

      await option.waitFor({
        state: "visible",
        timeout: RETRY_CONFIG.shortTimeout,
      });

      // Scroll into view if needed
      await option.scrollIntoViewIfNeeded();
      await option.click();

      // Wait for dropdown to close
      await page.waitForSelector(".ant-select-dropdown", {
        state: "hidden",
        timeout: RETRY_CONFIG.timeout,
      });

      // Verify selection
      await page.waitForTimeout(500);
      const selectedText = await combobox.textContent();
      const hasSelectionDisplay = await page
        .locator(`.ant-select-selection-item[title="${value}"]`)
        .isVisible();

      if (!selectedText?.includes(value) && !hasSelectionDisplay) {
        throw new Error(
          `Failed to select "${value}" for ${label}. Current text: "${selectedText}"`
        );
      }

      console.log(`✅ Successfully selected ${label}: ${value}`);
    },
    RETRY_CONFIG.maxRetries,
    `select "${value}" for "${label}"`
  );
};

test.describe("Create Listing", () => {
  // Global test configuration
  test.setTimeout(120000); // 2 minutes timeout for the entire test

  // Enhanced error reporting
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      // Capture screenshot on failure
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach("screenshot", {
        body: screenshot,
        contentType: "image/png",
      });

      // Capture page HTML for debugging
      const html = await page.content();
      await testInfo.attach("page-html", {
        body: html,
        contentType: "text/html",
      });

      // Log console errors
      console.log("📋 Test failed. Capturing debug information...");
    }
  });

  test.beforeEach(async ({ page }) => {
    // Enable console logging for better debugging
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`🔴 Browser console error: ${msg.text()}`);
      } else if (msg.type() === "warn") {
        console.log(`🟡 Browser console warning: ${msg.text()}`);
      }
    });

    // Handle page errors
    page.on("pageerror", (error) => {
      console.log(`🔴 Page error: ${error.message}`);
    });

    // Handle request failures
    page.on("requestfailed", (request) => {
      console.log(
        `🔴 Request failed: ${request.url()} - ${request.failure()?.errorText}`
      );
    });

    console.log("🔑 Logging in...");

    await retryOperation(
      async () => {
        await page.goto("/login");
        await page.waitForLoadState("networkidle");

        // Verify login page loaded
        await expect(
          page.getByRole("textbox", { name: "Username" })
        ).toBeVisible({
          timeout: RETRY_CONFIG.timeout,
        });

        // Fill login credentials with retry
        await fillTextInput(page, "Username", "ter");
        await fillTextInput(page, "Password", "9517538624");

        // Click login button
        const loginButton = page.getByRole("button", { name: "تسجيل الدخول" });
        await loginButton.waitFor({
          state: "visible",
          timeout: RETRY_CONFIG.timeout,
        });
        await expect(loginButton).toBeEnabled({
          timeout: RETRY_CONFIG.shortTimeout,
        });
        await loginButton.click();

        // Wait for successful login and redirect
        await page.waitForURL("/", { timeout: RETRY_CONFIG.longTimeout });
        await expect(page).toHaveURL("/");

        console.log("✅ Successfully logged in");
      },
      RETRY_CONFIG.maxRetries,
      "login process"
    );
  });

  test.afterEach(async ({ page }) => {
    // Ensure the user is logged out after each test
    await logout(page);
  });
  test("should create a new listing", async ({ page }) => {
    console.log("🧪 Running test: Create new listing with payment");

    try {
      await fillCreateListingForm(page);

      // Select highlight with retry
      await retryOperation(
        async () => {
          const highlightCheckbox = page.getByRole("checkbox", {
            name: "تمييز الإعلان - usd",
          });
          await highlightCheckbox.waitFor({
            state: "visible",
            timeout: RETRY_CONFIG.timeout,
          });
          await highlightCheckbox.click();

          // Verify checkbox is checked
          await expect(highlightCheckbox).toBeChecked({
            timeout: RETRY_CONFIG.shortTimeout,
          });
          console.log("✅ Highlight option selected");
        },
        RETRY_CONFIG.maxRetries,
        "select highlight option"
      );

      // Submit form with retry
      await retryOperation(
        async () => {
          const submitButton = page.getByRole("button", {
            name: "نشر السيارة",
          });
          await submitButton.waitFor({
            state: "visible",
            timeout: RETRY_CONFIG.timeout,
          });
          await expect(submitButton).toBeEnabled({
            timeout: RETRY_CONFIG.shortTimeout,
          });
          await submitButton.click();
          console.log("✅ Form submitted");
        },
        RETRY_CONFIG.maxRetries,
        "submit form"
      );

      // Handle payment flow
      await fillStripePayment(page);

      await retryOperation(
        async () => {
          const payButton = page.getByRole("button", { name: "دفع" });
          await payButton.waitFor({
            state: "visible",
            timeout: RETRY_CONFIG.timeout,
          });
          await expect(payButton).toBeEnabled({
            timeout: RETRY_CONFIG.shortTimeout,
          });
          await payButton.click();
          console.log("✅ Payment button clicked");
        },
        RETRY_CONFIG.maxRetries,
        "click payment button"
      );

      // Wait for payment processing with extended timeout
      await page.waitForTimeout(10000);

      // Wait for the payment page with retry
      await retryOperation(
        async () => {
          await page.waitForURL(/\/payment/, {
            timeout: RETRY_CONFIG.longTimeout,
          });
          await expect(page).toHaveURL(/\/payment/);
          console.log("✅ Redirected to payment page");
        },
        RETRY_CONFIG.maxRetries,
        "redirect to payment page"
      );

      // Verify payment success
      await retryOperation(
        async () => {
          const successMessage = page.getByText("تم الدفع بنجاح!");
          await successMessage.waitFor({
            state: "visible",
            timeout: RETRY_CONFIG.longTimeout,
          });
          await expect(successMessage).toBeVisible();
          console.log("✅ Payment success message displayed");
        },
        RETRY_CONFIG.maxRetries,
        "verify payment success"
      );

      console.log(
        "🎉 Test completed successfully: Create listing with payment"
      );
    } catch (error) {
      console.error("❌ Test failed:", error.message);

      // Take screenshot on failure for debugging
      await page.screenshot({
        path: `test-failure-payment-${Date.now()}.png`,
        fullPage: true,
      });

      throw error;
    }
  });
  test("should create a new listing for free", async ({ page }) => {
    console.log("🧪 Running test: Create free listing");

    try {
      await fillCreateListingForm(page);

      // Submit form with retry
      await retryOperation(
        async () => {
          const submitButton = page.getByRole("button", {
            name: "نشر السيارة",
          });
          await submitButton.waitFor({
            state: "visible",
            timeout: RETRY_CONFIG.timeout,
          });
          await expect(submitButton).toBeEnabled({
            timeout: RETRY_CONFIG.shortTimeout,
          });
          await submitButton.click();
          console.log("✅ Free listing form submitted");
        },
        RETRY_CONFIG.maxRetries,
        "submit free listing form"
      ); // Wait for listing creation success - free listings don't redirect, so check for success indicators
      await retryOperation(
        async () => {
          // Wait for form processing
          await page.waitForTimeout(3000);

          const currentUrl = page.url();
          console.log(`📍 Current URL: ${currentUrl}`);

          // Check for any error messages or validation issues first
          const errorSelectors = [
            ".ant-form-item-explain-error",
            ".ant-message-error",
            ".ant-notification-notice-error",
            ".error-message",
            '[role="alert"]',
          ];

          for (const selector of errorSelectors) {
            const errorElements = await page.locator(selector).all();
            for (const errorElement of errorElements) {
              if (await errorElement.isVisible()) {
                const errorText = await errorElement.textContent();
                console.log(`🔴 Found error: ${errorText}`);
                throw new Error(`Form validation error: ${errorText}`);
              }
            }
          }

          // For free listings, we expect to stay on create-listing page
          // Look for success indicators like success messages or form reset
          const possibleSuccessElements = [
            page.getByText(/تم إنشاء الإعلان بنجاح/i),
            page.getByText(/تم النشر بنجاح/i),
            page.getByText(/نجح/i), // Generic success in Arabic
            page.locator(".ant-message-success"),
            page.locator(".ant-notification-notice-success"),
          ];

          let foundSuccess = false;
          for (const element of possibleSuccessElements) {
            if (await element.isVisible({ timeout: 2000 })) {
              foundSuccess = true;
              console.log("✅ Success message found");
              break;
            }
          }

          // Alternative: Check if form was reset (title field is empty)
          if (!foundSuccess) {
            try {
              const titleInput = page.getByRole("textbox", {
                name: "عنوان الإعلان",
              });
              const titleValue = await titleInput.inputValue();
              if (titleValue === "") {
                foundSuccess = true;
                console.log("✅ Form appears to be reset (success indication)");
              }
            } catch {
              // Ignore if we can't check the title field
            }
          }

          if (!foundSuccess) {
            throw new Error(
              "No success indicators found after form submission"
            );
          }

          console.log("✅ Free listing created successfully");
        },
        RETRY_CONFIG.maxRetries,
        "verify free listing creation success"
      );
      console.log("🎉 Test completed successfully: Create free listing");
    } catch (error) {
      console.error("❌ Test failed:", error.message);

      // Take screenshot on failure for debugging
      await page.screenshot({
        path: `test-failure-free-listing-${Date.now()}.png`,
        fullPage: true,
      });

      throw error;
    }
  });
});
