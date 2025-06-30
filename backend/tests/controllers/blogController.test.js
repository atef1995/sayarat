/**
 * Blog Controller Modular Architecture Test
 *
 * Tests to verify the modular blog controller structure works correctly
 * and all controllers are properly exported and accessible.
 */

const blogController = require('../controllers/index');

describe('Blog Controller Modular Architecture', () => {
  describe('Controller Exports', () => {
    test('should export all post controller methods', () => {
      expect(typeof blogController.getPosts).toBe('function');
      expect(typeof blogController.getAllPosts).toBe('function');
      expect(typeof blogController.createPost).toBe('function');
      expect(typeof blogController.updatePost).toBe('function');
      expect(typeof blogController.deletePost).toBe('function');
      expect(typeof blogController.publishPost).toBe('function');
      expect(typeof blogController.toggleFeaturedPost).toBe('function');
    });

    test('should export all category controller methods', () => {
      expect(typeof blogController.getCategories).toBe('function');
      expect(typeof blogController.getCategory).toBe('function');
      expect(typeof blogController.createCategory).toBe('function');
      expect(typeof blogController.updateCategory).toBe('function');
      expect(typeof blogController.deleteCategory).toBe('function');
      expect(typeof blogController.toggleCategoryActive).toBe('function');
    });

    test('should export all tag controller methods', () => {
      expect(typeof blogController.getTags).toBe('function');
      expect(typeof blogController.getTag).toBe('function');
      expect(typeof blogController.createTag).toBe('function');
      expect(typeof blogController.updateTag).toBe('function');
      expect(typeof blogController.deleteTag).toBe('function');
    });

    test('should export all comment controller methods', () => {
      expect(typeof blogController.getPostComments).toBe('function');
      expect(typeof blogController.addPostComment).toBe('function');
      expect(typeof blogController.replyToComment).toBe('function');
      expect(typeof blogController.updateComment).toBe('function');
      expect(typeof blogController.deleteComment).toBe('function');
      expect(typeof blogController.getAllComments).toBe('function');
      expect(typeof blogController.approveComment).toBe('function');
      expect(typeof blogController.disapproveComment).toBe('function');
      expect(typeof blogController.adminDeleteComment).toBe('function');
    });

    test('should export all analytics controller methods', () => {
      expect(typeof blogController.getBlogStats).toBe('function');
      expect(typeof blogController.getBlogAnalytics).toBe('function');
      expect(typeof blogController.getPostAnalytics).toBe('function');
      expect(typeof blogController.getSearchAnalytics).toBe('function');
      expect(typeof blogController.exportAnalytics).toBe('function');
    });
  });

  describe('Facade Pattern Implementation', () => {
    test('should provide access to blog controller instance', () => {
      expect(blogController.blogController).toBeDefined();
      expect(typeof blogController.blogController.getController).toBe('function');
      expect(typeof blogController.blogController.healthCheck).toBe('function');
    });

    test('should return correct controller instances', () => {
      const facade = blogController.blogController;

      expect(facade.getController('posts')).toBeDefined();
      expect(facade.getController('categories')).toBeDefined();
      expect(facade.getController('tags')).toBeDefined();
      expect(facade.getController('comments')).toBeDefined();
      expect(facade.getController('analytics')).toBeDefined();
      expect(facade.getController('nonexistent')).toBeNull();
    });

    test('should provide health check functionality', () => {
      const healthStatus = blogController.healthCheck();

      expect(healthStatus.posts).toBe(true);
      expect(healthStatus.categories).toBe(true);
      expect(healthStatus.tags).toBe(true);
      expect(healthStatus.comments).toBe(true);
      expect(healthStatus.analytics).toBe(true);
      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.timestamp).toBeDefined();
    });
  });

  describe('Controller Independence', () => {
    test('should have independent post controller', () => {
      const postController = blogController.blogController.getController('posts');
      expect(postController.getPosts).toBeDefined();
      expect(postController.createPost).toBeDefined();
    });

    test('should have independent category controller', () => {
      const categoryController = blogController.blogController.getController('categories');
      expect(categoryController.getCategories).toBeDefined();
      expect(categoryController.createCategory).toBeDefined();
    });

    test('should have independent tag controller', () => {
      const tagController = blogController.blogController.getController('tags');
      expect(tagController.getTags).toBeDefined();
      expect(tagController.createTag).toBeDefined();
    });

    test('should have independent comment controller', () => {
      const commentController = blogController.blogController.getController('comments');
      expect(commentController.getPostComments).toBeDefined();
      expect(commentController.addPostComment).toBeDefined();
    });

    test('should have independent analytics controller', () => {
      const analyticsController = blogController.blogController.getController('analytics');
      expect(analyticsController.getBlogStats).toBeDefined();
      expect(analyticsController.getBlogAnalytics).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain backward compatibility with direct method calls', () => {
      // Test that the old way of calling methods still works
      expect(typeof blogController.getPosts).toBe('function');
      expect(typeof blogController.getCategories).toBe('function');
      expect(typeof blogController.getTags).toBe('function');
      expect(typeof blogController.getPostComments).toBe('function');
      expect(typeof blogController.getBlogStats).toBe('function');
    });
  });
});

// #TODO: Add integration tests for cross-controller interactions
// #TODO: Add performance tests for controller instantiation
// #TODO: Add error handling tests for controller failures
