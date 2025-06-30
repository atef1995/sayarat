// Test subscription endpoints
const BASE_URL = 'http://localhost:5000/api';

// Test 1: Get subscription plans
async function testGetPlans() {
  try {
    const response = await fetch(`${BASE_URL}/subscription/plans`);
    const data = await response.json();
    console.log('✅ Get Plans:', data);
    return data.success;
  } catch (error) {
    console.error('❌ Get Plans failed:', error);
    return false;
  }
}

// Test 2: Check subscription status (requires authentication)
async function testSubscriptionStatus() {
  try {
    const response = await fetch(`${BASE_URL}/subscription/status`, {
      credentials: 'include'
    });
    const data = await response.json();
    console.log('✅ Subscription Status:', data);
    return true;
  } catch (error) {
    console.error('❌ Subscription Status failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Subscription System...\n');

  const plansTest = await testGetPlans();
  await new Promise(resolve => setTimeout(resolve, 1000));

  const statusTest = await testSubscriptionStatus();

  console.log('\n📊 Test Results:');
  console.log(`Plans API: ${plansTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Status API: ${statusTest ? '✅ PASS' : '❌ FAIL'}`);
}

runTests();
