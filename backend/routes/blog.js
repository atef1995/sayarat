/**
 * Blog Routes
 *
 * RESTful API routes for the blog system including posts, categories,
 * comments, and related functionality. Designed with modularity and
 * comprehensive car market content support.
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated, requireAdmin } = require('../middleware/auth');
const {
  validateBlogPost,
  validateBlogCategory,
  validateBlogTag,
  validateBlogComment
} = require('../middleware/blogValidation');
const blogController = require('../controllers/blog/index');
const upload = require('../middleware/upload');
const logger = require('../utils/logger');

// #TODO: Add rate limiting middleware for blog endpoints
// #TODO: Add caching middleware for frequently accessed content

/**
 * Public Blog Routes
 */

// Get all published blog posts with filtering and pagination
router.get('/posts', blogController.getAllPosts);

// Get featured blog posts
router.get('/posts/featured', blogController.getFeaturedPosts);

// Get trending/popular blog posts
router.get('/posts/trending', blogController.getTrendingPosts);

// Get recent blog posts
router.get('/posts/recent', blogController.getRecentPosts);

// Get popular blog posts
router.get('/posts/popular', blogController.getPopularPosts);

// Get single blog post by slug
router.get('/posts/:slug', blogController.getPostBySlug);

// Get posts by category
router.get('/category/:slug/posts', blogController.getPostsByCategory);

// Get posts by tag
router.get('/tag/:slug/posts', blogController.getPostsByTag);

// Get posts by author
router.get('/author/:username/posts', blogController.getPostsByAuthor);

// Search blog posts
router.get('/search', blogController.searchPosts);

// Get all categories
router.get('/categories', blogController.getCategories);

// Get all tags
router.get('/tags', blogController.getTags);

// Get blog statistics
router.get('/stats', blogController.getBlogStats);

// Get comments for a specific post
router.get('/posts/:id/comments', blogController.getPostComments);

/**
 * Authenticated User Routes
 */

// Like/unlike a blog post
router.post('/posts/:id/like', ensureAuthenticated, blogController.togglePostLike);

// Add a comment to a blog post
router.post('/posts/:id/comments', ensureAuthenticated, validateBlogComment, blogController.addPostComment);

// Reply to a comment
router.post('/comments/:id/reply', ensureAuthenticated, validateBlogComment, blogController.replyToComment);

// Update user's own comment
router.put('/comments/:id', ensureAuthenticated, validateBlogComment, blogController.updateComment);

// Delete user's own comment
router.delete('/comments/:id', ensureAuthenticated, blogController.deleteComment);

// Track blog post view
router.post('/posts/:id/view', blogController.trackPostView);

/**
 * Admin/Author Routes
 */

// Get all posts (including drafts) - Admin only
router.get('/admin/posts', requireAdmin, blogController.getAllPosts);

// Create new blog post
router.post('/posts', requireAdmin, upload.single('featured_image'), validateBlogPost, blogController.createPost);

// Upload blog image
router.post('/upload/image', requireAdmin, upload.single('image'), blogController.uploadBlogImage);

// Update blog post
router.put(
  '/posts/:id',
  requireAdmin,
  upload.single('featured_image'),
  validateBlogPost,
  blogController.updatePost
);

// Delete blog post
router.delete('/posts/:id', requireAdmin, blogController.deletePost);

// Bulk delete blog posts
router.delete('/posts', requireAdmin, blogController.bulkDeletePosts);

// Publish a draft post
router.patch('/posts/:id/publish', requireAdmin, blogController.publishPost);

// Unpublish a post (convert to draft)
router.patch('/posts/:id/unpublish', requireAdmin, blogController.unpublishPost);

// Schedule a post
router.patch('/posts/:id/schedule', requireAdmin, blogController.schedulePost);

// Feature/unfeature a post
router.patch('/posts/:id/feature', requireAdmin, blogController.toggleFeaturedPost);

/**
 * Category Management Routes (Admin Only)
 */

// Get single category by ID or slug
router.get('/categories/:identifier', blogController.getCategory);

// Create new category
router.post('/categories', ensureAuthenticated, requireAdmin, validateBlogCategory, blogController.createCategory);

// Update category
router.put('/categories/:id', ensureAuthenticated, requireAdmin, validateBlogCategory, blogController.updateCategory);

// Delete category
router.delete('/categories/:id', ensureAuthenticated, requireAdmin, blogController.deleteCategory);

// Toggle category active status
router.patch('/categories/:id/toggle-active', ensureAuthenticated, requireAdmin, blogController.toggleCategoryActive);

/**
 * Tag Management Routes
 */

// Get all tags
router.get('/tags', blogController.getTags);

// Get single tag by ID or slug
router.get('/tags/:identifier', blogController.getTag);

// Create new tag
router.post('/tags', requireAdmin, validateBlogTag, blogController.createTag);

// Update tag
router.put('/tags/:id', ensureAuthenticated, requireAdmin, validateBlogTag, blogController.updateTag);

// Delete tag
router.delete('/tags/:id', ensureAuthenticated, requireAdmin, blogController.deleteTag);

/**
 * Comment Management Routes (Admin Only)
 */

// Get all comments for admin panel
router.get('/admin/comments', ensureAuthenticated, requireAdmin, blogController.getAllComments);

// Approve comment
router.patch('/comments/:id/approve', ensureAuthenticated, requireAdmin, blogController.approveComment);

// Disapprove comment
router.patch('/comments/:id/disapprove', ensureAuthenticated, requireAdmin, blogController.disapproveComment);

// Admin delete comment
router.delete('/admin/comments/:id', ensureAuthenticated, requireAdmin, blogController.adminDeleteComment);

/**
 * Car-Specific Blog Routes
 */

// // Get car market news
// router.get('/car-news', blogController.getCarMarketNews);

// // Get car reviews
// router.get('/car-reviews', blogController.getCarReviews);

// // Get car guides
// router.get('/car-guides', blogController.getCarGuides);

// // Get posts related to specific car make/model
// router.get('/cars/:make/:model/posts', blogController.getPostsByCarModel);

// // Get market trends for specific car
// router.get('/cars/:make/:model/trends', blogController.getCarMarketTrends);

/**
 * Analytics Routes (Admin Only)
 */

// // Get blog analytics dashboard data
// router.get('/admin/analytics', ensureAuthenticated, requireAdmin, blogController.getBlogAnalytics);

// // Get post performance metrics
// router.get('/admin/posts/:id/analytics', ensureAuthenticated, requireAdmin, blogController.getPostAnalytics);

// // Get popular search terms
// router.get('/admin/search-analytics', ensureAuthenticated, requireAdmin, blogController.getSearchAnalytics);

/**
 * Import/Export Routes (Admin Only)
 */

// // Export blog data
// router.get('/admin/export', ensureAuthenticated, requireAdmin, blogController.exportBlogData);

// // Import blog data
// router.post('/admin/import', ensureAuthenticated, requireAdmin, upload.single('import_file'), blogController.importBlogData);

/**
 * RSS/Sitemap Routes
 */

// // RSS feed for blog posts
// router.get('/rss', blogController.getRSSFeed);

// // Blog sitemap
// router.get('/sitemap.xml', blogController.getBlogSitemap);

/**
 * Error handling middleware specific to blog routes
 */
router.use((error, req, res, next) => {
  logger.error('Blog API Error:', {
    error: error.message,
    stack: error.stack,
    endpoint: req.originalUrl,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle specific blog-related errors
  if (error.code === '23505') {
    // Unique constraint violation
    if (error.constraint?.includes('slug')) {
      return res.status(400).json({
        success: false,
        error: 'العنوان المختصر مستخدم بالفعل',
        message: 'Slug already exists'
      });
    }
  }

  if (error.code === '23503') {
    // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      error: 'البيانات المرجعية غير صحيحة',
      message: 'Invalid reference data'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'حدث خطأ في النظام',
    message: 'An error occurred in the blog system'
  });
});

module.exports = router;
