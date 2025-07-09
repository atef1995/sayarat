/**
 * Simple test for getPostBySlug function
 * 
 * #TODO: Migrate to proper Jest test suite
 */

const { getPostBySlug } = require('../../service/blog/postQueries');

async function testGetPostBySlug() {
  try {
    console.log('Testing getPostBySlug function...');

    // Test with a non-existent slug
    const nonExistentPost = await getPostBySlug('non-existent-slug');
    console.log('Non-existent post result:', nonExistentPost);

    // Test with a valid slug (this would need actual data)
    // const validPost = await getPostBySlug('valid-slug');
    // console.log('Valid post result:', validPost);

    console.log('getPostBySlug tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run test if called directly
if (require.main === module) {
  testGetPostBySlug();
}

module.exports = testGetPostBySlug;
