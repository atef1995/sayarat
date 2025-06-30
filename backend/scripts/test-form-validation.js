/**
 * Test Script: Company Form Validation
 *
 * This script tests various validation scenarios for the company signup form
 * to ensure proper error handling and user feedback.
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Test data scenarios
const testScenarios = [
  {
    name: 'Valid Company Data',
    data: {
      companyName: 'شركة السيارات المتحدة',
      companyDescription:
        'نحن شركة متخصصة في بيع وشراء السيارات المستعملة والجديدة، نقدم خدمات متنوعة تشمل التمويل والصيانة والضمان',
      companyAddress: 'شارع الثورة، مبنى رقم 123، الطابق الثاني',
      companyCity: 'دمشق',
      taxId: '123456789',
      website: 'https://carsunited.com',
      firstName: 'أحمد',
      lastName: 'محمد',
      email: 'ahmed@carsunited.com',
      username: 'ahmed_cars',
      phone: '0991234567',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      accountType: 'company'
    },
    expectValid: true
  },
  {
    name: 'Short Description (Less than 10 chars)',
    data: {
      companyName: 'شركة السيارات',
      companyDescription: 'قصير',
      companyAddress: 'دمشق',
      companyCity: 'دمشق',
      taxId: '123456789',
      firstName: 'أحمد',
      lastName: 'محمد',
      email: 'test@test.com',
      username: 'testuser',
      phone: '0991234567',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      accountType: 'company'
    },
    expectValid: false,
    expectedError: 'النص يجب أن يكون بين 10 و 1000 حرف'
  },
  {
    name: 'Short Address (Less than 5 chars)',
    data: {
      companyName: 'شركة السيارات',
      companyDescription: 'وصف مفصل للشركة ونشاطها التجاري في مجال السيارات',
      companyAddress: 'دمشق',
      companyCity: 'دمشق',
      taxId: '123456789',
      firstName: 'أحمد',
      lastName: 'محمد',
      email: 'test2@test.com',
      username: 'testuser2',
      phone: '0991234567',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      accountType: 'company'
    },
    expectValid: false,
    expectedError: 'يجب أن يكون بين 5 و 200 حرف'
  },
  {
    name: 'Invalid Email Format',
    data: {
      companyName: 'شركة السيارات',
      companyDescription: 'وصف مفصل للشركة ونشاطها التجاري في مجال السيارات',
      companyAddress: 'شارع الثورة، مبنى رقم 123',
      companyCity: 'دمشق',
      taxId: '123456789',
      firstName: 'أحمد',
      lastName: 'محمد',
      email: 'invalid-email',
      username: 'testuser3',
      phone: '0991234567',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      accountType: 'company'
    },
    expectValid: false,
    expectedError: 'البريد الإلكتروني غير صالح'
  }
];

async function testValidation(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log('='.repeat(50));

  try {
    const response = await fetch(`${API_URL}/api/auth/validate-company-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testCase.data)
    });

    const result = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Expected Valid: ${testCase.expectValid}`);
    console.log(`Actually Valid: ${response.ok}`);

    if (testCase.expectValid) {
      if (response.ok) {
        console.log('✅ PASS: Valid data accepted correctly');
      } else {
        console.log('❌ FAIL: Valid data was rejected');
        console.log(`Error: ${result.error}`);
      }
    } else if (!response.ok) {
      console.log('✅ PASS: Invalid data rejected correctly');
      console.log(`Error: ${result.error}`);

      if (testCase.expectedError && result.error.includes(testCase.expectedError)) {
        console.log('✅ PASS: Error message matches expected');
      } else if (testCase.expectedError) {
        console.log("⚠️  WARNING: Error message doesn't match expected");
        console.log(`Expected: ${testCase.expectedError}`);
        console.log(`Got: ${result.error}`);
      }
    } else {
      console.log('❌ FAIL: Invalid data was accepted');
    }
  } catch (error) {
    console.log('❌ ERROR: Request failed');
    console.log(error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Company Form Validation Tests');
  console.log(`API URL: ${API_URL}`);

  for (const testCase of testScenarios) {
    await testValidation(testCase);
  }

  console.log('\n🎯 Test Summary');
  console.log('================');
  console.log('Tests completed. Check results above for validation behavior.');
  console.log('\nKey validation rules:');
  console.log('- Company description: 10-1000 characters');
  console.log('- Company address: 5-200 characters');
  console.log('- Email: Valid format required');
  console.log('- Password: 8+ chars with uppercase, lowercase, numbers, symbols');
}

// Run tests if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testScenarios, testValidation, runTests };
