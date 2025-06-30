import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./tests",
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: "http://localhost:5173",
    actionTimeout: 10000,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: "Chrome",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  retries: 1,
};

export default config;
