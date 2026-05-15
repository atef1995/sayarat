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

            if (id.includes("@ant-design/icons")) {
              return "vendor-ant-icons";
            }

            if (id.includes("rc-table") || id.includes("rc-pagination")) {
              return "vendor-antd-table";
            }

            if (
              id.includes("rc-picker") ||
              id.includes("rc-upload") ||
              id.includes("rc-select") ||
              id.includes("rc-input") ||
              id.includes("rc-input-number") ||
              id.includes("rc-textarea") ||
              id.includes("rc-mentions") ||
              id.includes("rc-cascader") ||
              id.includes("rc-tree-select") ||
              id.includes("rc-checkbox") ||
              id.includes("rc-switch") ||
              id.includes("rc-slider") ||
              id.includes("rc-rate") ||
              id.includes("rc-field-form")
            ) {
              return "vendor-antd-form";
            }

            if (
              id.includes("rc-dialog") ||
              id.includes("rc-drawer") ||
              id.includes("rc-dropdown") ||
              id.includes("rc-menu") ||
              id.includes("rc-tooltip") ||
              id.includes("rc-notification") ||
              id.includes("rc-motion") ||
              id.includes("@rc-component/trigger") ||
              id.includes("@rc-component/tour") ||
              id.includes("@rc-component/portal")
            ) {
              return "vendor-antd-overlay";
            }

            if (
              id.includes("rc-resize-observer") ||
              id.includes("rc-util") ||
              id.includes("rc-overflow") ||
              id.includes("rc-virtual-list") ||
              id.includes("rc-image") ||
              id.includes("rc-segmented") ||
              id.includes("rc-steps") ||
              id.includes("rc-progress") ||
              id.includes("rc-collapse") ||
              id.includes("rc-tree") ||
              id.includes("@rc-component/context")
            ) {
              return "vendor-antd-common";
            }

            if (
              id.includes("/antd/") ||
              id.includes("/rc-") ||
              id.includes("@rc-component") ||
              id.includes("/@ant-design/")
            ) {
              return "vendor-antd-core";
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
