/**
 * Blog Views Service Module
 * 
 * Handles all view-related operations including view tracking,
 * view counts, and analytics functionality.
 * Follows single responsibility principle.
 */

const db = require('../../config/database');
const logger = require('../../utils/logger');
const { postgresInterval, postgresDateFormat } = require('./queryUtils');

// UUID validation helper
const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// #TODO: Migrate remaining view-related functions from blogService.js
// Functions still to migrate:
// - getViewsByPost
// - getViewsByUser
// - getMostViewedPosts
// - getViewAnalytics

/**
 * Track post view and increment view count
 * @param {number} postId - The post ID
 * @param {number} userId - The user ID (optional)
 * @param {string} ipAddress - The IP address (optional)
 * @param {string} userAgent - The user agent (optional)
 * @param {string} referrer - The referrer URL (optional)
 * @returns {Promise<void>}
 */
const trackPostView = async (postId, userId = null, ipAddress = null, userAgent = null, referrer = null) => {
  try {
    // Validate parameters
    await validateViewParams(postId, userId);

    logger.debug('Tracking post view:', { postId, userId, ipAddress, userAgent, referrer });

    // Prepare insert data with only existing columns
    const insertData = {
      post_id: postId,
      user_id: userId,
      ip_address: ipAddress,
      created_at: new Date()
    };

    // #TODO: Remove this check after running migration 20250709000001_add_blog_views_columns.js
    // Check if user_agent and referrer columns exist before inserting
    try {
      const columnInfo = await db('blog_views').columnInfo();
      if (columnInfo.user_agent) {
        insertData.user_agent = userAgent;
      }
      if (columnInfo.referrer) {
        insertData.referrer = referrer;
      }
    } catch (columnError) {
      logger.debug('Column check failed, using basic schema:', columnError.message);
    }

    // Insert view record
    await db('blog_views').insert(insertData);

    // Update views count
    await db('blog_posts').where('id', postId).increment('views_count', 1);

    logger.info('Post view tracked successfully:', { postId, userId });
  } catch (error) {
    logger.error('Error in trackPostView:', error);
    throw error;
  }
};

/**
 * Increment view count for a post (alias for trackPostView)
 * @param {number} postId - The post ID
 * @param {number} userId - The user ID (optional)
 * @returns {Promise<Object>} The view record
 */
const incrementViewCount = async (postId, userId = null) => {
  try {
    await trackPostView(postId, userId);
    return { success: true };
  } catch (error) {
    logger.error('Error in incrementViewCount:', error);
    throw error;
  }
};

/**
 * Get view count for a post
 * @param {number} postId - The post ID
 * @returns {Promise<number>} The view count
 */
const getViewCount = async (postId) => {
  try {
    const result = await db('blog_posts')
      .select('views_count')
      .where('id', postId)
      .first();

    return result ? result.views_count : 0;
  } catch (error) {
    logger.error('Error in getViewCount:', error);
    throw error;
  }
};

/**
 * Get views for a specific post
 * @param {number} postId - The post ID
 * @param {number} limit - Maximum number of views to return
 * @param {number} offset - Number of views to skip
 * @returns {Promise<Array>} Array of view records
 */
const getViewsByPost = async (postId, limit = 100, offset = 0) => {
  try {
    const views = await db('blog_views')
      .select([
        'bv.id',
        'bv.post_id',
        'bv.user_id',
        'bv.ip_address',
        'bv.created_at',
        'u.username as user_name'
      ])
      .from('blog_views as bv')
      .leftJoin('sellers as u', 'bv.user_id', 'u.id')
      .where('bv.post_id', postId)
      .orderBy('bv.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return views;
  } catch (error) {
    logger.error('Error in getViewsByPost:', error);
    throw error;
  }
};

/**
 * Get views by a specific user
 * @param {number} userId - The user ID
 * @param {number} limit - Maximum number of views to return
 * @param {number} offset - Number of views to skip
 * @returns {Promise<Array>} Array of view records with post details
 */
const getViewsByUser = async (userId, limit = 100, offset = 0) => {
  try {
    const views = await db('blog_views')
      .select([
        'bv.id',
        'bv.post_id',
        'bv.user_id',
        'bv.ip_address',
        'bv.created_at',
        'bp.title as post_title',
        'bp.slug as post_slug',
        'bp.featured_image as post_image'
      ])
      .from('blog_views as bv')
      .join('blog_posts as bp', 'bv.post_id', 'bp.id')
      .where('bv.user_id', userId)
      .orderBy('bv.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return views;
  } catch (error) {
    logger.error('Error in getViewsByUser:', error);
    throw error;
  }
};

/**
 * Get most viewed posts
 * @param {number} limit - Number of posts to return
 * @param {number} days - Number of days to consider (0 for all time)
 * @returns {Promise<Array>} Array of most viewed posts
 */
const getMostViewedPosts = async (limit = 10, days = 0) => {
  try {
    let query = db('blog_posts as bp')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.excerpt',
        'bp.featured_image',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.published_at',
        'u.username as author_name',
        'bc.name as category_name',
        'bc.slug as category_slug'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .where('bp.status', 'published')
      .orderBy('bp.views_count', 'desc')
      .limit(limit);

    // If days is specified, filter by date - Using utility function
    if (days > 0) {
      query = query.where('bp.published_at', '>=', postgresInterval(days, 'days'));
    }

    const posts = await query;

    return posts;
  } catch (error) {
    logger.error('Error in getMostViewedPosts:', error);
    throw error;
  }
};

/**
 * Validate view tracking parameters
 * @param {number} postId - The post ID
 * @param {number} userId - The user ID (optional)
 * @returns {Promise<boolean>} True if valid, throws error if invalid
 */
const validateViewParams = async (postId, userId = null) => {
  try {
    // Check if post exists and is published
    const post = await db('blog_posts')
      .select('id', 'status')
      .where('id', postId)
      .first();

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.status !== 'published') {
      throw new Error('Cannot track views for unpublished posts');
    }

    // Check if user exists (if userId is provided)
    if (userId) {
      // Validate UUID format
      if (!isValidUUID(userId)) {
        throw new Error('Invalid user ID format - must be a valid UUID');
      }

      const user = await db('sellers')
        .select('id')
        .where('id', userId)
        .first();

      if (!user) {
        throw new Error('User not found');
      }
    }

    return true;
  } catch (error) {
    logger.error('Error in validateViewParams:', error);
    throw error;
  }
};

/**
 * Get view analytics for a post
 * @param {number} postId - The post ID
 * @returns {Promise<Object>} View analytics data
 */
const getViewAnalytics = async (postId) => {
  try {
    const [viewCount, uniqueViewers, viewsByDay] = await Promise.all([
      // Total view count
      db('blog_views').where('post_id', postId).count('id as total').first(),

      // Unique viewers count
      db('blog_views')
        .where('post_id', postId)
        .whereNotNull('user_id')
        .countDistinct('user_id as unique_users')
        .first(),

      // Views by day (last 7 days) - Using utility functions
      db('blog_views')
        .select(db.raw('DATE(created_at) as date, COUNT(*) as views'))
        .where('post_id', postId)
        .where('created_at', '>=', postgresInterval(7, 'days'))
        .groupBy(postgresDateFormat('created_at', 'date'))
        .orderBy('date', 'desc')
    ]);

    return {
      total_views: parseInt(viewCount.total),
      unique_viewers: parseInt(uniqueViewers.unique_users) || 0,
      views_by_day: viewsByDay
    };
  } catch (error) {
    logger.error('Error in getViewAnalytics:', error);
    throw error;
  }
};

module.exports = {
  trackPostView,
  incrementViewCount,
  getViewCount,
  getViewsByPost,
  getViewsByUser,
  getMostViewedPosts,
  validateViewParams,
  getViewAnalytics,
  isValidUUID
  // #TODO: Export other view-related functions after migration
};
