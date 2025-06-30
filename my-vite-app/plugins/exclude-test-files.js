/**
 * Vite plugin to exclude test files from production builds
 */
export function excludeTestFiles() {
  return {
    name: 'exclude-test-files',
    configResolved(config) {
      // Only apply in build mode
      if (config.command === 'build') {
        // Add test patterns to build.rollupOptions.external if not already configured
        if (!config.build.rollupOptions) {
          config.build.rollupOptions = {};
        }

        // Ensure external is an array
        if (!Array.isArray(config.build.rollupOptions.external)) {
          config.build.rollupOptions.external = [];
        }

        const testPatterns = [
          /\.test\./,
          /\.spec\./,
          /__tests__/,
          /\/tests?\//,
          /test-utils/,
          /setupTests/
        ];

        // Add test patterns to external dependencies
        config.build.rollupOptions.external.push(...testPatterns);
      }
    },
    resolveId(id) {
      // Exclude test files during build
      if (this.meta?.rollupVersion && this.getModuleInfo) {
        const testPatterns = [
          /\.test\.[jt]sx?$/,
          /\.spec\.[jt]sx?$/,
          /__tests__/,
          /\/tests?\//,
          /test-utils/,
          /setupTests/
        ];

        if (testPatterns.some(pattern => pattern.test(id))) {
          return { id, external: true };
        }
      }
    }
  };
}
