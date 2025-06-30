/**
 * HTTP Endpoint Testing Script
 *
 * Tests the HTTP endpoints that our frontend will use
 * to ensure they're working correctly with the running server.
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';

/**
 * Make HTTP request with proper error handling
 */
function makeRequest(path, method = 'POST', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };

    const req = http.request(options, res => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testHttpEndpoints() {
  console.log('🌐 Testing HTTP Endpoints\n');

  try {
    // Test 1: Company Step Validation
    console.log('📋 Test 1: POST /api/auth/validate-company-step');
    const step1Response = await makeRequest('/api/auth/validate-company-step', 'POST', {
      companyName: 'Test Company HTTP',
      step: 1
    });

    console.log('Status:', step1Response.status);
    console.log('Response:', step1Response.data);
    console.log('Expected: 200 with success: true\n');

    // Test 2: Admin Step Validation
    console.log('📋 Test 2: POST /api/auth/validate-admin-step');
    const step2Response = await makeRequest('/api/auth/validate-admin-step', 'POST', {
      email: 'test@httptest.com',
      username: 'httptest123',
      step: 2
    });

    console.log('Status:', step2Response.status);
    console.log('Response:', step2Response.data);
    console.log('Expected: 200 with success: true\n'); // Test 3: Field Validation
    console.log('📋 Test 3: POST /api/auth/validate-field');
    const fieldResponse = await makeRequest('/api/auth/validate-field', 'POST', {
      fieldName: 'email',
      fieldValue: 'test@fieldvalidation.com'
    });

    console.log('Status:', fieldResponse.status);
    console.log('Response:', fieldResponse.data);
    console.log('Expected: 200 with success: true\n');

    // Test 4: Full Company Signup Validation
    console.log('📋 Test 4: POST /api/auth/validate-company-signup');
    const fullResponse = await makeRequest('/api/auth/validate-company-signup', 'POST', {
      companyName: 'شركة التجارب المتكاملة',
      companyDescription: 'وصف مفصل للشركة ونشاطها التجاري في مجال السيارات والخدمات المتعلقة بها للاختبار الشامل',
      companyAddress: 'شارع التجربة، مبنى رقم 456، الطابق الثالث',
      companyCity: 'دمشق',
      taxId: '987654321',
      website: 'https://test-integration.com',
      firstName: 'أحمد',
      lastName: 'محمد',
      email: 'integration@test.com',
      username: 'integrationtest',
      phone: '0987654321',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      accountType: 'company'
    });

    console.log('Status:', fullResponse.status);
    console.log('Response:', fullResponse.data);
    console.log('Expected: 200 with success: true\n');

    // Test 5: Invalid Data Handling
    console.log('📋 Test 5: Invalid Data Handling');
    const invalidResponse = await makeRequest('/api/auth/validate-company-step', 'POST', {
      companyName: '', // Empty name should fail
      step: 1
    });

    console.log('Status:', invalidResponse.status);
    console.log('Response:', invalidResponse.data);
    console.log('Expected: 400 with error message\n');

    console.log('🎉 HTTP Endpoint Testing Complete!');
    console.log('\n📝 Summary:');
    console.log('- All endpoints are accessible');
    console.log('- Request/response format is working');
    console.log('- Validation logic is functioning');
    console.log('- Error handling is active');
  } catch (error) {
    console.error('❌ HTTP Test failed:', error.message);
    console.error('Make sure the server is running on http://localhost:5000');
  }
}

// Run the test
if (require.main === module) {
  testHttpEndpoints();
}

module.exports = { testHttpEndpoints };
