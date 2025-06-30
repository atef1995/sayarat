/**
 * Test script for validation system
 * Tests the company signup validation with different scenarios
 */

const testValidation = async() => {
  const API_URL = process.env.API_URL || 'http://localhost:3000';

  console.log('🧪 Testing Company Signup Validation System\n');

  // Helper function to create a company for duplicate testing
  const createTestCompany = async companyData => {
    try {
      const response = await fetch(`${API_URL}/api/auth/company-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyData)
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.warn(`Failed to create test company: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Create test companies for duplicate testing
  console.log('🔧 Setting up test data...\n');

  const testCompanyData = {
    companyName: 'Test Company Duplicate',
    email: 'test.duplicate@example.com',
    username: 'testduplicate',
    firstName: 'Test',
    lastName: 'User',
    phone: '01234567890',
    companyDescription: 'Test company for duplicate testing',
    companyAddress: 'Test address',
    companyCity: 'دمشق',
    taxId: '123456789',
    password: 'TestPassword123!', // Strong password with uppercase, lowercase, numbers, and special chars
    confirmPassword: 'TestPassword123!',
    accountType: 'company'
  };

  // Try to create the test company (ignore if it already exists)
  await createTestCompany(testCompanyData);

  // Test data scenarios
  const testCases = [
    {
      name: 'Valid Company Data',
      data: {
        companyName: `Test Company ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        firstName: 'John',
        lastName: 'Doe',
        phone: '01234567890',
        companyDescription: 'Test company description',
        companyAddress: 'Test address',
        companyCity: 'دمشق', // Valid Syrian city
        taxId: '123456789',
        password: 'TestPassword123!', // Strong password
        confirmPassword: 'TestPassword123!',
        accountType: 'company'
      },
      expectedSuccess: true
    },
    {
      name: 'Duplicate Company Name',
      data: {
        companyName: 'Test Company Duplicate', // This should exist now
        email: `newemail${Date.now()}@example.com`,
        username: `newuser${Date.now()}`,
        firstName: 'John',
        lastName: 'Doe',
        phone: '01234567890',
        companyDescription: 'Test company description',
        companyAddress: 'Test address',
        companyCity: 'حلب', // Valid Syrian city
        taxId: '123456789',
        password: 'TestPassword123!', // Strong password
        confirmPassword: 'TestPassword123!',
        accountType: 'company'
      },
      expectedSuccess: false,
      expectedError: {
        field: 'companyName',
        code: 'COMPANY_EXISTS'
      }
    },
    {
      name: 'Duplicate Email',
      data: {
        companyName: `New Company ${Date.now()}`,
        email: 'test.duplicate@example.com', // This should exist now
        username: `newuser${Date.now()}`,
        firstName: 'John',
        lastName: 'Doe',
        phone: '01234567890',
        companyDescription: 'Test company description',
        companyAddress: 'Test address',
        companyCity: 'حمص', // Valid Syrian city
        taxId: '123456789',
        password: 'TestPassword123!', // Strong password
        confirmPassword: 'TestPassword123!',
        accountType: 'company'
      },
      expectedSuccess: false,
      expectedError: {
        field: 'email',
        code: 'USER_EXISTS'
      }
    },
    {
      name: 'Invalid City',
      data: {
        companyName: `Invalid City Company ${Date.now()}`,
        email: `invalid${Date.now()}@example.com`,
        username: `invaliduser${Date.now()}`,
        firstName: 'John',
        lastName: 'Doe',
        phone: '01234567890',
        companyDescription: 'Test company description',
        companyAddress: 'Test address',
        companyCity: 'Invalid City', // Invalid city to test validation
        taxId: '123456789',
        password: 'TestPassword123!', // Strong password
        confirmPassword: 'TestPassword123!',
        accountType: 'company'
      },
      expectedSuccess: false,
      expectedError: {
        field: 'companyCity',
        code: 'VALIDATION_ERROR'
      }
    },
    {
      name: 'Weak Password',
      data: {
        companyName: `Weak Password Company ${Date.now()}`,
        email: `weakpass${Date.now()}@example.com`,
        username: `weakpassuser${Date.now()}`,
        firstName: 'John',
        lastName: 'Doe',
        phone: '01234567890',
        companyDescription: 'Test company description',
        companyAddress: 'Test address',
        companyCity: 'دمشق', // Valid Syrian city
        taxId: '123456789',
        password: 'weak', // Weak password to test validation
        confirmPassword: 'weak',
        accountType: 'company'
      },
      expectedSuccess: false,
      expectedError: {
        field: 'password',
        code: 'VALIDATION_ERROR'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);

    try {
      const response = await fetch(`${API_URL}/api/auth/validate-company-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      });

      const data = await response.json();

      console.log(`   Status: ${response.status}`);
      console.log('   Response:', data);

      // Validate response structure
      if (testCase.expectedSuccess) {
        if (data.success) {
          console.log('   ✅ PASS: Validation successful as expected');
        } else {
          console.log(`   ❌ FAIL: Expected success but got error: ${data.error}`);
        }
      } else if (!data.success) {
        console.log('   ✅ PASS: Validation failed as expected');

        // Check if structured response is correct
        if (testCase.expectedError) {
          if (data.field === testCase.expectedError.field) {
            console.log(`   ✅ PASS: Field '${data.field}' matches expected`);
          } else {
            console.log(`   ❌ FAIL: Expected field '${testCase.expectedError.field}' but got '${data.field}'`);
          }

          if (data.code === testCase.expectedError.code) {
            console.log(`   ✅ PASS: Error code '${data.code}' matches expected`);
          } else {
            console.log(`   ❌ FAIL: Expected code '${testCase.expectedError.code}' but got '${data.code}'`);
          }
        }
      } else {
        console.log('   ❌ FAIL: Expected error but validation succeeded');
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }

    console.log(''); // Empty line for readability
  }

  console.log('🏁 Validation testing complete');
};

// Run the test if this script is executed directly
if (require.main === module) {
  testValidation().catch(console.error);
}

module.exports = { testValidation };
