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
      chunkSizeWarningLimit: 900,
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
        output: {
          manualChunks: (id) => {
            if (!id.includes("node_modules")) {
              return;
            }

            if (
              id.includes("react-router") ||
              id.includes("react-dom") ||
              id.includes("/react/") ||
              id.includes("scheduler")
            ) {
              return "vendor-react";
            }

            if (id.includes("@tanstack/react-query-devtools")) {
              return "vendor-query-devtools";
            }

            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }

            if (id.includes("@stripe/")) {
              return "vendor-stripe";
            }

            if (
              // Keep Ant Design + rc ecosystem in one chunk to avoid cyclic chunk execution issues.
              id.includes("@ant-design/icons") ||
              id.includes("/antd/") ||
              id.includes("/rc-") ||
              id.includes("@rc-component") ||
              id.includes("/@ant-design/")
            ) {
              return "vendor-antd";
            }

            if (id.includes("dayjs")) {
              return "vendor-dayjs";
            }
          },
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
