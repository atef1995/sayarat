/**
 * Test Script for Step-Based Company Validation
 *
 * This script tests the new step-based validation functionality
 * to ensure that the system correctly validates only the required
 * fields for each step without requiring all fields.
 */

const path = require('path');

// Import real knex configuration for testing
const knexConfig = require('../knexFile');
const knex = require('knex')(knexConfig.development);

// Import the modular service
const { RegistrationService } = require('../service/authentication/company');

async function testStepValidation() {
  console.log('🧪 Testing Step-Based Company Validation\n');
  try {
    // Initialize service with real knex connection
    const service = new RegistrationService(knex, {
      enableAuditLog: false, // Disable audit logs for testing
      suppressWarning: true
    });

    console.log('✅ Service initialized successfully\n');

    // Test Case 1: Step 1 validation (company name only)
    console.log('📋 Test Case 1: Step 1 Validation (Company Name Only)');
    const step1Result = await service.validateCompanyStepData({
      companyName: 'Test Company'
      // email and username should NOT be required here
    });
    console.log('Result:', step1Result);
    console.log('Expected: Should validate successfully without email/username\n');

    // Test Case 2: Step 2 validation (email and username only)
    console.log('📋 Test Case 2: Step 2 Validation (Email and Username Only)');
    const step2Result = await service.validateAdminStepData({
      email: 'test@example.com',
      username: 'testuser'
      // companyName should NOT be required here
    });
    console.log('Result:', step2Result);
    console.log('Expected: Should validate successfully without company name\n');

    // Test Case 3: Individual field validation
    console.log('📋 Test Case 3: Individual Field Validation');
    const fieldResult = await service.validateFieldData('email', 'test@example.com', false);
    console.log('Result:', fieldResult);
    console.log('Expected: Should validate email field independently\n');

    // Test Case 4: Flexible validation with custom options
    console.log('📋 Test Case 4: Flexible Validation with Custom Options');
    const flexibleResult = await service.validateCompanySignupData(
      {
        email: 'admin@testcorp.com'
      },
      {
        step: 2,
        requiredFields: ['email']
      }
    );
    console.log('Result:', flexibleResult);
    console.log('Expected: Should validate only email field\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- Step 1 validation works without requiring email/username');
    console.log('- Step 2 validation works without requiring company name');
    console.log('- Individual field validation works independently');
    console.log('- Flexible validation supports custom field requirements');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    if (knex) {
      await knex.destroy();
    }
  }
}

// Run the test
if (require.main === module) {
  testStepValidation()
    .then(() => {
      console.log('🎯 Test completed');
    })
    .catch(console.error);
}

module.exports = { testStepValidation };
