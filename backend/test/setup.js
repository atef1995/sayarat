/**
 * Jest Test Setup
 *
 * Global setup for all tests
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Helper to create mock payment intent
  createMockPaymentIntent: (overrides = {}) => ({
    id: `pi_test_${Math.random().toString(36).substring(7)}`,
    amount: 15000,
    currency: 'usd',
    metadata: {
      name: 'Test User',
      email: 'test@example.com',
      listingType: 'إعلان مميز',
      ...overrides.metadata
    },
    ...overrides
  }),

  // Helper to create mock admin data
  createMockAdminData: (overrides = {}) => ({
    email: 'admin@test.com',
    firstName: 'أحمد',
    lastName: 'محمد',
    ...overrides
  }),

  // Helper to create mock company data
  createMockCompanyData: (overrides = {}) => ({
    name: 'شركة الاختبار',
    city: 'دمشق',
    address: 'شارع الاختبار، مبنى رقم 123',
    ...overrides
  }),

  // Helper to generate unique request ID
  generateRequestId: (prefix = 'test') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
};

// Mock console methods to reduce noise in tests
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});
