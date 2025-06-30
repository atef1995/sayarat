import { chromium } from "@playwright/test";
import { AuthTestUtils, TestUser } from "./authTestUtils";

/**
 * Global setup for subscription tests
 * This runs once before all tests to prepare test environment
 */
async function globalSetup(): Promise<void> {
  console.log("🔧 Setting up test environment...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const authUtils = new AuthTestUtils(page);

    // Ensure test users exist by attempting to create them
    console.log("👤 Setting up test users...");

    for (const [userType, userData] of Object.entries(
      AuthTestUtils.TEST_USERS
    )) {
      try {
        console.log(
          `  Creating ${userType} user: ${(userData as TestUser).email}`
        );

        // Try to register the user (will fail if already exists, which is fine)
        await authUtils.registerTestUser(
          userType as keyof typeof AuthTestUtils.TEST_USERS
        );
        console.log(`  ✅ ${userType} user created successfully`);
      } catch {
        // User might already exist, try to login to verify
        try {
          await authUtils.login(
            (userData as TestUser).email,
            (userData as TestUser).password
          );
          console.log(`  ✅ ${userType} user already exists and is accessible`);
          await authUtils.logout();
        } catch (loginError) {
          console.log(`  ⚠️  ${userType} user setup failed: ${loginError}`);
        }
      }
    }

    // Clean up any auth state
    await authUtils.clearAuth();

    console.log("✅ Test environment setup complete");
  } catch (error) {
    console.error("❌ Test environment setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
