/**
 * Quick test for PostgreSQL interval syntax fix
 * 
 * This test specifically validates the interval syntax fix
 */

const { postgresInterval } = require('../../service/blog/queryUtils');
const { getMostViewedPosts } = require('../../service/blog/views');

async function testIntervalFix() {
  console.log('🔧 Testing PostgreSQL Interval Fix...\n');

  try {
    // Test 1: Utility function
    console.log('Test 1: Testing postgresInterval utility function...');
    const interval = postgresInterval(7, 'days');
    console.log('✅ Interval utility function works');

    // Test 2: getMostViewedPosts with date filter
    console.log('Test 2: Testing getMostViewedPosts with date filter...');
    const posts = await getMostViewedPosts(5, 7);
    console.log(`✅ getMostViewedPosts with 7-day filter returned ${posts.length} posts`);

    console.log('\n🎉 PostgreSQL interval syntax fix verified!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
  }
}

// Run test if called directly
if (require.main === module) {
  testIntervalFix();
}

module.exports = testIntervalFix;
