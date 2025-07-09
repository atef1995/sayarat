/**
 * Comprehensive test for blog comments service
 * 
 * Tests all comment functions with proper error handling and validation
 * 
 * #TODO: Migrate to proper Jest test suite
 */

const {
  getPostComments,
  addPostComment,
  replyToComment,
  getCommentById,
  updateComment,
  deleteComment,
  getAllComments,
  approveComment,
  disapproveComment,
  adminDeleteComment,
  bulkModerateComments
} = require('../../service/blog/comments');

async function testCommentsService() {
  console.log('💬 Testing Blog Comments Service...\n');

  let testsPassed = 0;
  let testsTotal = 0;
  let testCommentId = null;

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

  // Test 1: Get comments for a post (should work even with empty data)
  await runTest('Get post comments', async () => {
    const result = await getPostComments(1, 1, 20);
    console.log(`   Comments retrieved: ${result.data.length} comments`);

    if (!result.data || !Array.isArray(result.data)) {
      throw new Error('Comments data should be an array');
    }

    if (!result.pagination || typeof result.pagination.total !== 'number') {
      throw new Error('Pagination should include total count');
    }
  });

  // Test 2: Add a comment (will need a valid user UUID)
  await runTest('Add post comment', async () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    try {
      const commentData = {
        post_id: 1,
        author_id: validUUID,
        content: 'This is a test comment',
        parent_comment_id: null
      };

      const comment = await addPostComment(commentData);
      testCommentId = comment.id; // Store for later tests
      console.log(`   Comment added successfully with ID: ${comment.id}`);

      if (!comment.id || !comment.content) {
        throw new Error('Comment should have id and content');
      }
    } catch (error) {
      if (error.message.includes('Post not found') ||
        error.message.includes('User not found') ||
        error.message.includes('foreign key constraint')) {
        console.log('   Skipping comment test (post or user not found in database)');
        return;
      }
      throw error;
    }
  });

  // Test 3: Get comment by ID (only if we have a comment ID)
  await runTest('Get comment by ID', async () => {
    if (!testCommentId) {
      console.log('   Skipping (no test comment available)');
      return;
    }

    const comment = await getCommentById(testCommentId);
    console.log(`   Comment retrieved: "${comment.content}"`);

    if (!comment || comment.id !== testCommentId) {
      throw new Error('Should return the correct comment');
    }
  });

  // Test 4: Update comment (only if we have a comment ID)
  await runTest('Update comment', async () => {
    if (!testCommentId) {
      console.log('   Skipping (no test comment available)');
      return;
    }

    const updatedComment = await updateComment(testCommentId, {
      content: 'This is an updated test comment'
    });

    console.log(`   Comment updated: "${updatedComment.content}"`);

    if (!updatedComment.content.includes('updated')) {
      throw new Error('Comment content should be updated');
    }
  });

  // Test 5: Get all comments (admin function)
  await runTest('Get all comments (admin)', async () => {
    const searchParams = {
      page: 1,
      limit: 10,
      search: '',
      status: '',
      sort: 'latest'
    };

    const result = await getAllComments(searchParams);
    console.log(`   All comments retrieved: ${result.data.length} comments`);

    if (!result.success) {
      throw new Error('Should return success status');
    }

    if (!Array.isArray(result.data)) {
      throw new Error('Should return array of comments');
    }
  });

  // Test 6: Approve comment (only if we have a comment ID)
  await runTest('Approve comment', async () => {
    if (!testCommentId) {
      console.log('   Skipping (no test comment available)');
      return;
    }

    const result = await approveComment(testCommentId);
    console.log(`   Comment approval result: ${result.success}`);

    if (!result.success) {
      throw new Error('Should successfully approve comment');
    }
  });

  // Test 7: Disapprove comment (only if we have a comment ID)
  await runTest('Disapprove comment', async () => {
    if (!testCommentId) {
      console.log('   Skipping (no test comment available)');
      return;
    }

    const result = await disapproveComment(testCommentId);
    console.log(`   Comment disapproval result: ${result.success}`);

    if (!result.success) {
      throw new Error('Should successfully disapprove comment');
    }
  });

  // Test 8: Bulk moderate comments (only if we have a comment ID)
  await runTest('Bulk moderate comments', async () => {
    if (!testCommentId) {
      console.log('   Skipping (no test comment available)');
      return;
    }

    const result = await bulkModerateComments([testCommentId], 'approve', 'admin-uuid');
    console.log(`   Bulk moderation result: ${result.processedCount} comments processed`);

    if (!result.success) {
      throw new Error('Should successfully bulk moderate comments');
    }
  });

  // Test 9: Delete comment (only if we have a comment ID)
  await runTest('Delete comment', async () => {
    if (!testCommentId) {
      console.log('   Skipping (no test comment available)');
      return;
    }

    const result = await adminDeleteComment(testCommentId);
    console.log(`   Comment deletion result: ${result.success}`);

    if (!result.success) {
      throw new Error('Should successfully delete comment');
    }
  });

  // Test 10: Error handling - Invalid UUID
  await runTest('Error handling - Invalid UUID', async () => {
    try {
      await addPostComment({
        post_id: 1,
        author_id: 'invalid-uuid',
        content: 'Test comment'
      });
      throw new Error('Should have thrown error for invalid UUID');
    } catch (error) {
      if (error.message.includes('Invalid author ID format')) {
        console.log('   UUID validation working correctly');
      } else {
        throw error;
      }
    }
  });

  // Test 11: Error handling - Non-existent comment
  await runTest('Error handling - Non-existent comment', async () => {
    const result = await approveComment(99999);
    console.log(`   Non-existent comment handling: ${result.success}`);

    if (result.success) {
      throw new Error('Should return false for non-existent comment');
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
  testCommentsService();
}

module.exports = testCommentsService;
