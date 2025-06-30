/**
 * Jest Environment Setup
 *
 * Sets up environment variables for testing
 */

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || 'test-api-key-12345';
process.env.CLIENT_URL = 'https://test.carsbids.com';
process.env.SUPPORT_URL = 'https://support.carsbids.com';
process.env.TEST_EMAIL = process.env.TEST_EMAIL || 'test@carsbids.com';

// Disable console warnings in tests unless DEBUG is set
if (!process.env.DEBUG) {
  console.warn = jest.fn();
}
