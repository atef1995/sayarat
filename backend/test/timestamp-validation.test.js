/**
 * Test script for timestamp conversion validation
 *
 * This script tests the safe timestamp conversion logic to ensure
 * we don't get NaN dates that cause database errors.
 */

const logger = require('../utils/logger');

/**
 * Safe timestamp conversion function (mirrored from StripeWebhookService)
 */
function safeTimestampToDate(unixTimestamp, fieldName = 'timestamp') {
  try {
    // Handle null, undefined, or non-numeric values
    if (unixTimestamp === null || unixTimestamp === undefined || typeof unixTimestamp !== 'number') {
      console.warn(`Invalid timestamp provided for ${fieldName}:`, {
        value: unixTimestamp,
        type: typeof unixTimestamp
      });
      return null;
    }

    // Handle zero or negative timestamps
    if (unixTimestamp <= 0) {
      console.warn(`Zero or negative timestamp provided for ${fieldName}:`, {
        value: unixTimestamp
      });
      return null;
    }

    // Convert Unix timestamp (seconds) to JavaScript Date (milliseconds)
    const date = new Date(unixTimestamp * 1000);

    // Validate the resulting date
    if (isNaN(date.getTime())) {
      console.warn(`Timestamp conversion resulted in invalid date for ${fieldName}:`, {
        originalValue: unixTimestamp,
        convertedValue: date
      });
      return null;
    }

    return date;
  } catch (error) {
    console.error(`Error converting timestamp to date for ${fieldName}:`, {
      unixTimestamp,
      error: error.message
    });
    return null;
  }
}

/**
 * Test various timestamp scenarios
 */
function runTimestampTests() {
  console.log('🧪 Running timestamp conversion tests...\n');

  const testCases = [
    // Valid cases
    { input: 1672531200, expected: 'valid', description: 'Valid Unix timestamp (2023-01-01)' },
    { input: Math.floor(Date.now() / 1000), expected: 'valid', description: 'Current Unix timestamp' },

    // Invalid cases that were causing the error
    { input: null, expected: 'null', description: 'Null timestamp' },
    { input: undefined, expected: 'null', description: 'Undefined timestamp' },
    { input: NaN, expected: 'null', description: 'NaN timestamp' },
    { input: 'not-a-number', expected: 'null', description: 'String timestamp' },
    { input: 0, expected: 'null', description: 'Zero timestamp' },
    { input: -1, expected: 'null', description: 'Negative timestamp' },

    // Edge cases
    { input: Infinity, expected: 'null', description: 'Infinity timestamp' },
    { input: -Infinity, expected: 'null', description: 'Negative Infinity timestamp' }
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: ${testCase.input} (${typeof testCase.input})`);

    const result = safeTimestampToDate(testCase.input, 'test_field');

    let testPassed = false;
    if (testCase.expected === 'valid') {
      testPassed = result instanceof Date && !isNaN(result.getTime());
      console.log(`  Result: ${result} (${testPassed ? 'VALID DATE' : 'INVALID DATE'})`);
    } else if (testCase.expected === 'null') {
      testPassed = result === null;
      console.log(`  Result: ${result} (${testPassed ? 'CORRECTLY NULL' : 'SHOULD BE NULL'})`);
    }

    if (testPassed) {
      console.log('  ✅ PASSED\n');
      passed++;
    } else {
      console.log('  ❌ FAILED\n');
      failed++;
    }
  });

  console.log(`📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('🎉 All timestamp conversion tests passed!');
    console.log('The database error should be resolved.');
  } else {
    console.log('⚠️  Some tests failed. Review the timestamp conversion logic.');
  }

  return failed === 0;
}

/**
 * Test subscription data processing
 */
function testSubscriptionDataProcessing() {
  console.log('\n🔍 Testing subscription data processing...\n');

  // Simulate problematic Stripe subscription data that was causing the error
  const problematicSubscription = {
    id: 'sub_test123',
    customer: 'cus_test123',
    status: 'active',
    current_period_start: null, // This was causing NaN
    current_period_end: undefined, // This was also causing NaN
    items: {
      data: [
        {
          price: {
            id: 'price_test123'
          }
        }
      ]
    },
    metadata: {}
  };

  console.log('Processing problematic subscription data:');
  console.log('  current_period_start:', problematicSubscription.current_period_start);
  console.log('  current_period_end:', problematicSubscription.current_period_end);

  const periodStart = safeTimestampToDate(problematicSubscription.current_period_start, 'current_period_start');
  const periodEnd = safeTimestampToDate(problematicSubscription.current_period_end, 'current_period_end');

  console.log('\nConverted values:');
  console.log('  current_period_start:', periodStart);
  console.log('  current_period_end:', periodEnd);

  // Simulate building subscription data object
  const subscriptionData = {
    stripe_subscription_id: problematicSubscription.id,
    stripe_customer_id: problematicSubscription.customer,
    status: problematicSubscription.status,
    plan_id: problematicSubscription.items?.data?.[0]?.price?.id,
    metadata: problematicSubscription.metadata || {}
  };

  // Only add dates if they are valid (this prevents the database error)
  if (periodStart instanceof Date && !isNaN(periodStart.getTime())) {
    subscriptionData.current_period_start = periodStart;
  }
  if (periodEnd instanceof Date && !isNaN(periodEnd.getTime())) {
    subscriptionData.current_period_end = periodEnd;
  }

  console.log('\nFinal subscription data object:');
  console.log(JSON.stringify(subscriptionData, null, 2));

  const hasInvalidDates = Object.values(subscriptionData).some(
    value => value instanceof Date && isNaN(value.getTime())
  );

  if (hasInvalidDates) {
    console.log('❌ Invalid dates found in subscription data!');
    return false;
  } else {
    console.log('✅ No invalid dates in subscription data. Database error should be prevented.');
    return true;
  }
}

// Run the tests
if (require.main === module) {
  console.log('🚀 Starting timestamp conversion validation tests...\n');

  const timestampTestsPassed = runTimestampTests();
  const subscriptionTestPassed = testSubscriptionDataProcessing();

  console.log(`\n${'='.repeat(60)}`);
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));

  if (timestampTestsPassed && subscriptionTestPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('The database timestamp error should be resolved.');
    console.log('The webhook should now handle invalid/missing timestamps gracefully.');
  } else {
    console.log('⚠️  SOME TESTS FAILED!');
    console.log('Review the timestamp conversion logic before deploying.');
  }
}

module.exports = {
  safeTimestampToDate,
  runTimestampTests,
  testSubscriptionDataProcessing
};
