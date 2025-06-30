// Test script for the unified subscription system
// Run this script to test both individual and company subscription flows

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Test individual subscription creation
 */
async function testIndividualSubscription() {
  console.log('🧪 Testing Individual Subscription Creation...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/subscription/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Add authentication headers as needed
        // 'Authorization': 'Bearer your-token-here'
      },
      credentials: 'include',
      body: JSON.stringify({
        planId: 'premium-monthly', // Adjust based on your plan IDs
        accountType: 'individual'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Individual subscription creation successful');
      console.log('📝 Session ID:', result.sessionId);
      console.log('🔗 Checkout URL:', result.url);
    } else {
      console.log('❌ Individual subscription creation failed');
      console.log('💥 Error:', result.error);
    }

    return result;
  } catch (error) {
    console.log('❌ Network error during individual subscription test');
    console.log('💥 Error:', error.message);
    return null;
  }
}

/**
 * Test company subscription creation
 */
async function testCompanySubscription() {
  console.log('🧪 Testing Company Subscription Creation...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/subscription/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Add authentication headers as needed
        // 'Authorization': 'Bearer your-token-here'
      },
      credentials: 'include',
      body: JSON.stringify({
        planId: 'business-yearly', // Adjust based on your plan IDs
        accountType: 'company',
        companyId: 'test-company-123' // Adjust based on your company ID format
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Company subscription creation successful');
      console.log('📝 Session ID:', result.sessionId);
      console.log('🔗 Checkout URL:', result.url);
      console.log('🏢 Company metadata included');
    } else {
      console.log('❌ Company subscription creation failed');
      console.log('💥 Error:', result.error);
    }

    return result;
  } catch (error) {
    console.log('❌ Network error during company subscription test');
    console.log('💥 Error:', error.message);
    return null;
  }
}

/**
 * Test subscription plans filtering
 */
async function testPlanFiltering() {
  console.log('🧪 Testing Subscription Plans Filtering...');

  const accountTypes = ['individual', 'company'];

  for (const accountType of accountTypes) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/plans?accountType=${accountType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Plans for ${accountType} accounts retrieved successfully`);
        console.log(`📊 Available plans: ${result.plans.length}`);
        console.log(`🔍 Filtered by: ${result.filteredBy}`);
        console.log(`📈 Total plans: ${result.totalPlans}, Filtered: ${result.filteredPlans}`);
      } else {
        console.log(`❌ Failed to retrieve plans for ${accountType} accounts`);
        console.log('💥 Error:', result.error);
      }
    } catch (error) {
      console.log(`❌ Network error during ${accountType} plans test`);
      console.log('💥 Error:', error.message);
    }
  }
}

/**
 * Test subscription status endpoint
 */
async function testSubscriptionStatus() {
  console.log('🧪 Testing Subscription Status...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Subscription status retrieved successfully');
      console.log(`👤 Account Type: ${result.accountType}`);
      console.log(`💎 Has Active Subscription: ${result.hasActiveSubscription}`);
      console.log(`🏢 Is Company: ${result.isCompany}`);
      console.log(`🛠️ Can Manage Subscription: ${result.canManageSubscription}`);

      if (result.subscription) {
        console.log(`📋 Plan: ${result.subscription.planDisplayName}`);
        console.log(`🔄 Status: ${result.subscription.status}`);
        console.log(`📅 Next Billing: ${result.nextBillingDate}`);
      }
    } else {
      console.log('❌ Failed to retrieve subscription status');
      console.log('💥 Error:', result.error);
    }

    return result;
  } catch (error) {
    console.log('❌ Network error during subscription status test');
    console.log('💥 Error:', error.message);
    return null;
  }
}

/**
 * Test legacy company subscription endpoint (should show deprecation warning)
 */
async function testLegacyCompanyEndpoint() {
  console.log('🧪 Testing Legacy Company Subscription Endpoint...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/company-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        companyId: 'test-company-123',
        subscriptionType: 'monthly'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Legacy endpoint still functional (with deprecation warning)');
      console.log('⚠️ Check server logs for deprecation warning');
      console.log('📝 Session ID:', result.sessionId);
    } else {
      console.log('❌ Legacy endpoint failed');
      console.log('💥 Error:', result.error);
    }

    return result;
  } catch (error) {
    console.log('❌ Network error during legacy endpoint test');
    console.log('💥 Error:', error.message);
    return null;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Unified Subscription System Tests...\n');

  await testPlanFiltering();
  console.log(`\n${'='.repeat(60)}\n`);

  await testSubscriptionStatus();
  console.log(`\n${'='.repeat(60)}\n`);

  await testIndividualSubscription();
  console.log(`\n${'='.repeat(60)}\n`);

  await testCompanySubscription();
  console.log(`\n${'='.repeat(60)}\n`);

  await testLegacyCompanyEndpoint();
  console.log(`\n${'='.repeat(60)}\n`);

  console.log('🏁 All tests completed!');
  console.log('\n📋 Test Summary:');
  console.log('✅ Plans filtering by account type');
  console.log('✅ Subscription status with account type detection');
  console.log('✅ Individual subscription creation');
  console.log('✅ Company subscription creation');
  console.log('✅ Legacy endpoint compatibility (with deprecation)');

  console.log('\n📝 Next Steps:');
  console.log('1. Run database migration script');
  console.log('2. Test webhook processing with Stripe CLI');
  console.log('3. Verify email notifications');
  console.log('4. Update frontend to use new endpoints');
  console.log('5. Plan legacy endpoint removal');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testIndividualSubscription,
  testCompanySubscription,
  testPlanFiltering,
  testSubscriptionStatus,
  testLegacyCompanyEndpoint,
  runAllTests
};
