/**
 * Test the listing validation endpoint
 * Run with: npx dotenvx run -f .env.development -- node test/test-listing-validation.js
 */

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/listings/validate`;

/**
 * Test data for validation
 */
const validListingData = {
  dryRun: true,
  userId: 'test-user-123',
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  price: 25000,
  mileage: 30000,
  description: 'This is a well-maintained Toyota Camry with low mileage and excellent condition.',
  phone: '+1234567890',
  title: 'Toyota Camry 2020',
  car_type: 'سيدان',
  color: 'أبيض',
  transmission: 'اوتوماتيك',
  fuel: 'بنزين',
  currency: 'usd',
  location: 'Damascus',
  engine_cylinders: '4',
  engine_liters: 2.5,
  hp: 200
};

const invalidListingData = {
  dryRun: true,
  userId: 'test-user-123',
  make: '', // Missing required field
  model: 'Camry',
  year: 1800, // Invalid year
  price: -1000, // Negative price
  mileage: -500, // Negative mileage
  description: 'Too short', // Too short description
  phone: 'invalid-phone' // Invalid phone format
};

/**
 * Test validation with valid data
 */
async function testValidData() {
  try {
    logger.info('Testing with valid listing data...');

    const response = await axios.post(API_URL, validListingData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.valid) {
      logger.info('✅ Valid data test passed', {
        message: response.data.message,
        warnings: response.data.warnings
      });
    } else {
      logger.error('❌ Valid data test failed - should have been valid', {
        errors: response.data.errors
      });
    }
  } catch (error) {
    logger.error('❌ Valid data test failed with error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

/**
 * Test validation with invalid data
 */
async function testInvalidData() {
  try {
    logger.info('Testing with invalid listing data...');

    const response = await axios.post(API_URL, invalidListingData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.valid && response.data.errors && response.data.errors.length > 0) {
      logger.info('✅ Invalid data test passed - correctly rejected', {
        errors: response.data.errors
      });
    } else {
      logger.error('❌ Invalid data test failed - should have been rejected', {
        response: response.data
      });
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.errors) {
      logger.info('✅ Invalid data test passed - correctly rejected with 400', {
        errors: error.response.data.errors
      });
    } else {
      logger.error('❌ Invalid data test failed with unexpected error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
  }
}

/**
 * Test missing dryRun flag
 */
async function testMissingDryRun() {
  try {
    logger.info('Testing without dryRun flag...');

    const dataWithoutDryRun = { ...validListingData };
    delete dataWithoutDryRun.dryRun;

    const response = await axios.post(API_URL, dataWithoutDryRun, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    logger.error('❌ Missing dryRun test failed - should have been rejected', {
      response: response.data
    });
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.errors?.some(err => err.includes('dryRun'))) {
      logger.info('✅ Missing dryRun test passed - correctly rejected');
    } else {
      logger.error('❌ Missing dryRun test failed with unexpected error:', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
}

/**
 * Test endpoint health
 */
async function testEndpointHealth() {
  try {
    logger.info('Testing endpoint health...');

    // Try to reach the server
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    logger.info('✅ Server is responding', { status: response.status });

    return true;
  } catch (error) {
    logger.error('❌ Server health check failed:', {
      message: error.message,
      code: error.code
    });
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  logger.info('Starting listing validation endpoint tests...');

  // Check if server is running
  const isServerHealthy = await testEndpointHealth();
  if (!isServerHealthy) {
    logger.error('Server is not responding. Please start the server first.');
    process.exit(1);
  }

  // Run validation tests
  await testValidData();
  await testInvalidData();
  await testMissingDryRun();

  logger.info('All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logger.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testValidData, testInvalidData };
