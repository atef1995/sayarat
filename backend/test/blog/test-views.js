/**
 * Comprehensive test for blog views service
 * 
 * Tests all functions with proper error handling and validation
 * 
 * #TODO: Migrate to proper Jest test suite
 */

const {
  trackPostView,
  getViewCount,
  getViewsByPost,
  getViewsByUser,
  getMostViewedPosts,
  getViewAnalytics,
  validateViewParams,
  isValidUUID
} = require('../../service/blog/views');

async function testViewsService() {
  console.log('🧪 Testing Blog Views Service...\n');

  let testsPassed = 0;
  let testsTotal = 0;

  const runTest = async (testName, testFunction) => {
    testsTotal++;
    try {
      console.log(`Test ${testsTotal}: ${testName}`);
      await testFunction();
      console.log(`✅ ${testName} - PASSED\n`);
      testsPassed++;
    } catch (error) {
      console.error(`❌ ${testName} - FAILED`);
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error(`Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
      console.log('');
    }
  };

  // Test 0: Query utilities validation
  await runTest('Query utilities validation', async () => {
    const { postgresInterval, postgresDateFormat } = require('../../service/blog/queryUtils');

    // Test valid interval
    const interval = postgresInterval(7, 'days');
    console.log('   Valid interval created successfully');

    // Test invalid interval value
    try {
      postgresInterval(-1, 'days');
      throw new Error('Should have thrown error for negative value');
    } catch (error) {
      if (error.message.includes('Invalid interval value')) {
        console.log('   Negative interval validation passed');
      } else {
        throw error;
      }
    }

    // Test invalid unit
    try {
      postgresInterval(7, 'invalid');
      throw new Error('Should have thrown error for invalid unit');
    } catch (error) {
      if (error.message.includes('Invalid time unit')) {
        console.log('   Invalid unit validation passed');
      } else {
        throw error;
      }
    }

    // Test date format
    const dateFormat = postgresDateFormat('created_at', 'date');
    console.log('   Valid date format created successfully');

    // Test invalid column name
    try {
      postgresDateFormat('invalid; DROP TABLE users; --', 'date');
      throw new Error('Should have thrown error for invalid column name');
    } catch (error) {
      if (error.message.includes('Invalid column name')) {
        console.log('   SQL injection protection passed');
      } else {
        throw error;
      }
    }
  });

  // Test 0.1: UUID validation
  await runTest('UUID validation', async () => {
    // Test valid UUIDs
    const validUUIDs = [
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    ];

    for (const uuid of validUUIDs) {
      if (!isValidUUID(uuid)) {
        throw new Error(`Valid UUID ${uuid} was rejected`);
      }
    }
    console.log('   Valid UUID validation passed');

    // Test invalid UUIDs
    const invalidUUIDs = [
      'some-user-id',
      'invalid-uuid',
      '123456789',
      '',
      null,
      undefined,
      '550e8400-e29b-41d4-a716-44665544000', // too short
      '550e8400-e29b-41d4-a716-446655440000x' // too long
    ];

    for (const uuid of invalidUUIDs) {
      if (isValidUUID(uuid)) {
        throw new Error(`Invalid UUID ${uuid} was accepted`);
      }
    }
    console.log('   Invalid UUID validation passed');
  });

  // Test 1: Parameter validation
  await runTest('Parameter validation', async () => {
    // Test with invalid post ID
    try {
      await validateViewParams(99999);
      throw new Error('Should have thrown error for invalid post ID');
    } catch (error) {
      if (error.message.includes('Post not found')) {
        console.log('   Invalid post ID validation passed');
      } else {
        throw error;
      }
    }

    // Test with invalid user UUID
    try {
      await validateViewParams(1, 'invalid-user-id');
      throw new Error('Should have thrown error for invalid user UUID');
    } catch (error) {
      if (error.message.includes('Invalid user ID format')) {
        console.log('   Invalid user UUID validation passed');
      } else {
        throw error;
      }
    }
  });

  // Test 2: Track a post view
  await runTest('Track post view', async () => {
    await trackPostView(1, null, '127.0.0.1', 'Test User Agent', 'http://example.com');
    console.log('   Post view tracked successfully');
  });

  // Test 2.1: Track a post view with valid user UUID
  await runTest('Track post view with user UUID', async () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    try {
      await trackPostView(1, validUUID, '127.0.0.1', 'Test User Agent', 'http://example.com');
      console.log('   Post view with UUID tracked successfully');
    } catch (error) {
      if (error.message.includes('User not found')) {
        console.log('   Skipping UUID test (user does not exist in database)');
        return;
      }
      throw error;
    }
  });

  // Test 3: Get view count
  await runTest('Get view count', async () => {
    const viewCount = await getViewCount(1);
    console.log(`   View count retrieved: ${viewCount}`);
    if (typeof viewCount !== 'number' || viewCount < 0) {
      throw new Error('Invalid view count returned');
    }
  });

  // Test 4: Get views by post
  await runTest('Get views by post', async () => {
    const views = await getViewsByPost(1, 10);
    console.log(`   Views by post retrieved: ${views.length} records`);
    if (!Array.isArray(views)) {
      throw new Error('Views by post should return an array');
    }
  });

  // Test 5: Get most viewed posts
  await runTest('Get most viewed posts', async () => {
    const mostViewed = await getMostViewedPosts(5);
    console.log(`   Most viewed posts retrieved: ${mostViewed.length} posts`);
    if (!Array.isArray(mostViewed)) {
      throw new Error('Most viewed posts should return an array');
    }
  });

  // Test 6: Get most viewed posts with date filter
  await runTest('Get most viewed posts (7 days)', async () => {
    const mostViewed = await getMostViewedPosts(5, 7);
    console.log(`   Most viewed posts (7 days) retrieved: ${mostViewed.length} posts`);
    if (!Array.isArray(mostViewed)) {
      throw new Error('Most viewed posts should return an array');
    }
  });

  // Test 7: Get view analytics
  await runTest('Get view analytics', async () => {
    const analytics = await getViewAnalytics(1);
    console.log(`   View analytics retrieved:`, {
      total_views: analytics.total_views,
      unique_viewers: analytics.unique_viewers,
      views_by_day_count: analytics.views_by_day.length
    });

    if (typeof analytics.total_views !== 'number' ||
      typeof analytics.unique_viewers !== 'number' ||
      !Array.isArray(analytics.views_by_day)) {
      throw new Error('Invalid analytics structure returned');
    }
  });

  // Test 8: Get views by user (with valid UUID)
  await runTest('Get views by user', async () => {
    // Use a valid UUID format for testing
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    try {
      const views = await getViewsByUser(validUUID, 10);
      console.log(`   Views by user retrieved: ${views.length} records`);
      if (!Array.isArray(views)) {
        throw new Error('Views by user should return an array');
      }
    } catch (error) {
      if (error.message.includes('invalid input syntax')) {
        console.log('   Skipping user views test (no valid user UUID)');
        return;
      }
      throw error;
    }
  });

  // Summary
  console.log('📊 Test Summary:');
  console.log(`   Tests passed: ${testsPassed}/${testsTotal}`);
  console.log(`   Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);

  if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run test if called directly
if (require.main === module) {
  testViewsService();
}

module.exports = testViewsService;
