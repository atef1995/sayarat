/**
 * Blog Controller Index
 *
 * Main aggregation point for all blog-related controllers.
 * Imports and re-exports all modular controllers following the
 * Facade pattern for simplified access and dependency injection.
 */

const postController = require('./postController');
const adminPostController = require('./adminPostController');
const categoryController = require('./categoryController');
const tagController = require('./tagController');
const commentController = require('./commentController');
const analyticsController = require('./analyticsController');
const logger = require('../../utils/logger');

/**
 * Aggregated Blog Controller
 *
 * This follows the Facade pattern, providing a single entry point
 * for all blog-related operations while maintaining modularity.
 */
class BlogController {
  constructor() {
    // Initialize all controllers
    this.posts = postController;
    this.adminPosts = adminPostController;
    this.categories = categoryController;
    this.tags = tagController;
    this.comments = commentController;
    this.analytics = analyticsController;

    logger.info('Blog Controller initialized with modular architecture');
  }

  /**
   * Get controller instance by type
   * @param {string} type - Controller type (posts, categories, tags, comments, analytics)
   * @returns {Object} Controller instance
   */
  getController(type) {
    const controllers = {
      posts: this.posts,
      categories: this.categories,
      tags: this.tags,
      comments: this.comments,
      analytics: this.analytics
    };

    return controllers[type] || null;
  }

  /**
   * Health check for all controllers
   * @returns {Object} Health status of all controllers
   */
  healthCheck() {
    return {
      posts: !!this.posts,
      categories: !!this.categories,
      tags: !!this.tags,
      comments: !!this.comments,
      analytics: !!this.analytics,
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const blogControllerInstance = new BlogController();

// Export individual controller methods for backward compatibility
module.exports = {
  // Blog Controller Instance (Facade)
  blogController: blogControllerInstance,

  // Post Controllers
  getPosts: postController.getPosts,
  getAllPosts: adminPostController.getAllPosts,
  getFeaturedPosts: postController.getFeaturedPosts,
  getTrendingPosts: postController.getTrendingPosts,
  getRecentPosts: postController.getRecentPosts,
  getPopularPosts: postController.getPopularPosts,
  getPostBySlug: postController.getPostBySlug,
  getPostById: postController.getPostById,
  getPostsByCategory: postController.getPostsByCategory,
  getPostsByTag: postController.getPostsByTag,
  getPostsByAuthor: postController.getPostsByAuthor,
  searchPosts: postController.searchPosts,
  createPost: adminPostController.createPost,
  updatePost: adminPostController.updatePost,
  deletePost: adminPostController.deletePost,
  bulkDeletePosts: adminPostController.bulkDeletePosts,
  publishPost: adminPostController.publishPost,
  unpublishPost: adminPostController.unpublishPost,
  schedulePost: adminPostController.schedulePost,
  toggleFeaturedPost: adminPostController.toggleFeaturedPost,
  uploadBlogImage: adminPostController.uploadBlogImage,
  togglePostLike: postController.togglePostLike,
  trackPostView: postController.trackPostView,

  // Category Controllers
  getCategories: categoryController.getCategories,
  getCategory: categoryController.getCategory,
  createCategory: categoryController.createCategory,
  updateCategory: categoryController.updateCategory,
  deleteCategory: categoryController.deleteCategory,
  toggleCategoryActive: categoryController.toggleCategoryActive,
  getCategoryStats: categoryController.getCategoryStats,

  // Tag Controllers
  getTags: tagController.getTags,
  getTag: tagController.getTag,
  getPopularTags: tagController.getPopularTags,
  createTag: tagController.createTag,
  updateTag: tagController.updateTag,
  deleteTag: tagController.deleteTag,
  getTagStats: tagController.getTagStats,

  // Comment Controllers
  getPostComments: commentController.getPostComments,
  addPostComment: commentController.addPostComment,
  replyToComment: commentController.replyToComment,
  updateComment: commentController.updateComment,
  deleteComment: commentController.deleteComment,
  getAllComments: commentController.getAllComments,
  approveComment: commentController.approveComment,
  disapproveComment: commentController.disapproveComment,
  adminDeleteComment: commentController.adminDeleteComment,
  bulkModerateComments: commentController.bulkModerateComments,

  // Analytics Controllers
  getBlogStats: analyticsController.getBlogStats,
  getBlogAnalytics: analyticsController.getBlogAnalytics,
  getPostAnalytics: analyticsController.getPostAnalytics,
  getTopPosts: analyticsController.getTopPosts,
  getSearchAnalytics: analyticsController.getSearchAnalytics,
  getUserEngagementAnalytics: analyticsController.getUserEngagementAnalytics,
  getCategoryAnalytics: analyticsController.getCategoryAnalytics,
  getTagAnalytics: analyticsController.getTagAnalytics,
  getRealTimeStats: analyticsController.getRealTimeStats,
  exportAnalytics: analyticsController.exportAnalytics,

  // Health check
  healthCheck: blogControllerInstance.healthCheck.bind(blogControllerInstance)
};

// #TODO: Add controller-level middleware for cross-cutting concerns
// #TODO: Add controller-level error handling and recovery
// #TODO: Add controller-level caching strategies
// #TODO: Add controller-level rate limiting
// #TODO: Add controller-level request/response transformation
