/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "./",
    plugins: [react()],
    envPrefix: ["VITE_", "REACT_APP_"], // Prefix for environment variables
    build: {
      // Explicitly exclude test files from build
      rollupOptions: {
        external: (id) => {
          // Exclude test files during production build
          if (command === "build") {
            if (
              id.includes(".test.") ||
              id.includes(".spec.") ||
              id.includes("__tests__") ||
              id.includes("/test/") ||
              id.includes("/tests/") ||
              id.includes("setupTests")
            ) {
              return true;
            }
          }
          return false;
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/setupTests.ts",
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV || "development"),
    },
  };
});
