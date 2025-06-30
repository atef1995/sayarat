/**
 * Jest Configuration for Email Testing
 *
 * Configuration for running email service tests including
 * unit tests, integration tests, and delivery tests.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/test/**/*.test.js', '**/test/**/*.spec.js'],

  // Coverage configuration
  collectCoverageFrom: ['service/**/*.js', '!service/**/index.js', '!**/node_modules/**'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './service/brevoEmailService.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Test timeout for integration tests
  testTimeout: 30000,

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Module paths
  modulePaths: ['<rootDir>'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Test name patterns for different test types
  testNamePattern: process.env.TEST_NAME_PATTERN,

  // Environment variables for testing
  setupFiles: ['<rootDir>/test/env.setup.js']
};
