import { Page, expect } from "@playwright/test";

export interface TestUser {
  email: string;
  password: string;
  type: "regular" | "premium" | "company";
}

export class AuthTestUtils {
  constructor(private page: Page) {}
  /**
   * Test users for different scenarios
   */
  static readonly TEST_USERS: Record<string, TestUser> = {
    regular: {
      email: "ter", // Use the working credentials from create-listing.spec.ts
      password: "9517538624",
      type: "regular",
    },
    premium: {
      email: "ter", // Use same working credentials for now
      password: "9517538624",
      type: "premium",
    },
    company: {
      email: "ter", // Use same working credentials for now
      password: "9517538624",
      type: "company",
    },
  };

  /**
   * Login with a test user
   */
  async loginAs(userType: keyof typeof AuthTestUtils.TEST_USERS) {
    const user = AuthTestUtils.TEST_USERS[userType];
    await this.login(user.email, user.password);
  }
  /**
   * Login with custom credentials
   */
  async login(email: string, password: string) {
    // Navigate to login page
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");

    // Verify login page loaded
    await expect(
      this.page.getByRole("textbox", { name: "Username" })
    ).toBeVisible({ timeout: 10000 });

    // Fill login credentials using the same method as create-listing.spec.ts
    await this.fillTextInput("Username", email);
    await this.fillTextInput("Password", password);

    // Click login button
    const loginButton = this.page.getByRole("button", { name: "تسجيل الدخول" });
    await loginButton.waitFor({ state: "visible", timeout: 10000 });
    await expect(loginButton).toBeEnabled({ timeout: 5000 });
    await loginButton.click();

    // Wait for successful login redirect
    await this.page.waitForURL("/", { timeout: 30000 });
    await expect(this.page).toHaveURL("/");

    console.log("✅ Successfully logged in");
  }

  /**
   * Enhanced text input filling with verification (from create-listing.spec.ts)
   */
  private async fillTextInput(inputName: string, value: string): Promise<void> {
    const input = this.page.getByRole("textbox", { name: inputName });

    // Wait for input to be visible and enabled
    await input.waitFor({ state: "visible", timeout: 10000 });
    await expect(input).toBeEnabled({ timeout: 5000 });

    // Clear existing value
    await input.clear();
    await this.page.waitForTimeout(200);

    // Fill the value
    await input.fill(value);
    await this.page.waitForTimeout(300);

    // Verify the value was set correctly
    const actualValue = await input.inputValue();
    if (actualValue !== value) {
      throw new Error(
        `Expected "${value}" but got "${actualValue}" for ${inputName}`
      );
    }

    console.log(`✅ Successfully filled ${inputName} with: ${value}`);
  }

  /**
   * Register a new test user
   */
  async registerTestUser(userType: keyof typeof AuthTestUtils.TEST_USERS) {
    const user = AuthTestUtils.TEST_USERS[userType];

    await this.page.goto("/signup");
    await this.page.waitForLoadState("networkidle");

    // Fill registration form
    await this.page
      .getByPlaceholder(/name|الاسم/i)
      .fill(`Test User ${userType}`);
    await this.page
      .getByPlaceholder(/email|البريد الإلكتروني/i)
      .fill(user.email);
    await this.page
      .getByPlaceholder(/password|كلمة المرور/i)
      .fill(user.password);
    await this.page
      .getByPlaceholder(/confirm.*password|تأكيد كلمة المرور/i)
      .fill(user.password);
    await this.page.getByPlaceholder(/phone|رقم الهاتف/i).fill("1234567890");

    // Submit registration
    await this.page.getByRole("button", { name: /register|تسجيل/i }).click();

    // Handle different registration flows based on user type
    if (userType === "company") {
      // Handle company registration flow if different
      await this.page.waitForURL("/company/**", { timeout: 10000 });
    } else {
      // Wait for email verification or direct login
      try {
        await this.page.waitForURL("/", { timeout: 5000 });
      } catch {
        await this.page.waitForURL("/verify-email", { timeout: 5000 });
      }
    }
  }
  /**
   * Logout current user (using pattern from create-listing.spec.ts)
   */
  async logout() {
    console.log("🚪 Logging out...");

    try {
      // Try to clear cookies and local storage first for a quick logout
      await this.page.context().clearCookies();
      await this.page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          // Ignore storage errors
        }
      });

      // Then navigate to home and verify logout
      await this.page.goto("/", { timeout: 5000 });
      console.log("✅ Successfully logged out");
    } catch (error) {
      console.log("Warning: Logout may have failed:", error.message);
      // Even if logout fails, continue with the test
    }
  }
  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Check for logout menu item which indicates user is logged in
      await this.page
        .getByRole("menuitem", { name: "logout تسجيل الخروج" })
        .waitFor({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure user is logged in, login if not
   */
  async ensureLoggedIn(
    userType: keyof typeof AuthTestUtils.TEST_USERS = "regular"
  ) {
    if (!(await this.isLoggedIn())) {
      await this.loginAs(userType);
    }
  }

  /**
   * Navigate to create listing page (requires login)
   */
  async navigateToCreateListing() {
    await this.ensureLoggedIn();
    await this.page.goto("/create-listing");
    await this.page.waitForLoadState("networkidle");

    // Verify we're on the create listing page
    await expect(
      this.page.getByRole("heading", {
        name: /إضافة سيارة جديدة|Add New Car|Create.*Listing/i,
      })
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Set user subscription status (mock for testing)
   */
  async mockSubscriptionStatus(
    isPremium: boolean = false,
    isCompany: boolean = false
  ) {
    // Inject subscription status into the page context
    await this.page.addInitScript(
      (subscription) => {
        window.localStorage.setItem(
          "mockSubscription",
          JSON.stringify(subscription)
        );
      },
      { isPremium, isCompany }
    );
  }
  /**
   * Clear all authentication and session data
   */
  async clearAuth() {
    try {
      // Clear cookies first
      await this.page.context().clearCookies();

      // Try to navigate to home page and clear storage
      await this.page.goto("/", { timeout: 5000 });

      // Clear localStorage and sessionStorage
      await this.page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          // Ignore storage errors
        }
      });
    } catch (error) {
      // If clearing fails, that's okay - we'll proceed anyway
      console.log(
        "Warning: Could not clear auth state completely:",
        error.message
      );
    }
  }
}
