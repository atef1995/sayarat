/**
 * Post Controller
 *
 * Handles all blog post-related operations including CRUD operations,
 * interactions (likes, views), and post management features.
 * Implements SOLID principles with single responsibility for posts.
 */

const logger = require('../../utils/logger');
const blogService = require('../../service/blog/index');

/**
 * Public Post Controllers
 */

/**
 * Get all published blog posts with filtering and pagination
 */
const getPosts = async (req, res) => {
  try {
    const searchParams = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search || '',
      category: req.query.category || '',
      tag: req.query.tag || '',
      author: req.query.author || '',
      sort: req.query.sort || 'latest',
      featured: req.query.featured === 'true' ? true : undefined,
      car_make: req.query.car_make || '',
      car_model: req.query.car_model || ''
    };

    const result = await blogService.getPosts(searchParams);

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Get posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب المقالات'
    });
  }
};

/**
 * Get featured blog posts
 */
const getFeaturedPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const posts = await blogService.getFeaturedPosts(limit);

    return res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get featured posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب المقالات المميزة'
    });
  }
};

/**
 * Get trending/popular blog posts
 */
const getTrendingPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const days = parseInt(req.query.days, 10) || 7;

    const posts = await blogService.getTrendingPosts(limit, days);

    return res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get trending posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب المقالات الرائجة'
    });
  }
};

/**
 * Get recent blog posts
 */
const getRecentPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const posts = await blogService.getRecentPosts(limit);

    return res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get recent posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب المقالات الحديثة'
    });
  }
};

/**
 * Get single blog post by slug
 */
const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id || null;

    const post = await blogService.getPostBySlug(slug, userId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'المقال غير موجود'
      });
    }

    return res.json({
      success: true,
      data: post
    });
  } catch (error) {
    logger.error('Get post by slug error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب المقال'
    });
  }
};

/**
 * Get posts by category
 */
const getPostsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await blogService.getPostsByCategory(slug, page, limit);

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Get posts by category error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب مقالات التصنيف'
    });
  }
};

/**
 * Get posts by tag
 */
const getPostsByTag = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await blogService.getPostsByTag(slug, page, limit);

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Get posts by tag error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب مقالات العلامة'
    });
  }
};

/**
 * Get posts by author
 */
const getPostsByAuthor = async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await blogService.getPostsByAuthor(username, page, limit);

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Get posts by author error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب مقالات المؤلف'
    });
  }
};

/**
 * Search blog posts
 */
const searchPosts = async (req, res) => {
  try {
    const searchParams = {
      query: req.query.q || '',
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      category: req.query.category || '',
      tag: req.query.tag || '',
      car_make: req.query.car_make || '',
      car_model: req.query.car_model || ''
    };

    const result = await blogService.searchPosts(searchParams);

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Search posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في البحث'
    });
  }
};

/**
 * Post Interaction Controllers
 */

/**
 * Toggle post like
 */
const togglePostLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await blogService.togglePostLike(id, userId);

    return res.json({
      success: true,
      data: {
        liked: result.liked,
        likes_count: result.likes_count
      }
    });
  } catch (error) {
    logger.error('Toggle post like error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في تسجيل الإعجاب'
    });
  }
};

/**
 * Track post view
 */
const trackPostView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    const referrer = req.get('Referer');

    await blogService.trackPostView(id, userId, ipAddress, userAgent, referrer);

    return res.json({
      success: true
    });
  } catch (error) {
    logger.error('Track post view error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في تسجيل المشاهدة'
    });
  }
};

// #TODO: Add post analytics methods
// #TODO: Add post SEO optimization methods
// #TODO: Add post content moderation methods

module.exports = {
  // Public post controllers
  getPosts,
  getFeaturedPosts,
  getTrendingPosts,
  getRecentPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  getPostsByAuthor,
  searchPosts,

  // Post interaction controllers
  togglePostLike,
  trackPostView
};
