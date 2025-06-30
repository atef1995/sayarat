import { PlaywrightTestConfig } from "@playwright/test";

/**
 * Subscription-specific test configuration
 * Run with: npx playwright test --config=subscription.config.ts
 */
const config: PlaywrightTestConfig = {
  testDir: "./tests",
  testMatch: [
    "**/basic-auth-flow.spec.ts",
    "**/subscription-modal.spec.ts",
    "**/subscription-pages.spec.ts",
    "**/ai-premium-integration.spec.ts",
  ],
  timeout: 45000, // Longer timeout for subscription flows
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: "http://localhost:5173",
    actionTimeout: 15000,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 20000,
  },
  projects: [
    {
      name: "Subscription Desktop Chrome",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 720 },
        contextOptions: {
          permissions: ["clipboard-read", "clipboard-write"],
        },
      },
    },
    {
      name: "Subscription Mobile Chrome",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "Subscription Tablet",
      use: {
        browserName: "chromium",
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  retries: 2,
  workers: 1, // Run subscription tests sequentially to avoid conflicts
  reporter: [
    ["html", { outputFolder: "test-results/subscription-reports" }],
    ["json", { outputFile: "test-results/subscription-results.json" }],
    ["list"],
  ],
  outputDir: "test-results/subscription-artifacts",

  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
};

export default config;
