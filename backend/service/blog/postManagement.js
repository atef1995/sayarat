/**
 * Blog Posts Management Service Module
 * 
 * Handles post management operations like publishing, scheduling,
 * and specialized queries. Extends the core posts functionality.
 */

const db = require('../../config/database');
const logger = require('../../utils/logger');
const { handleError, formatResponse } = require('./utils');

/**
 * Get all posts including drafts (Admin only)
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} Posts with pagination info
 */
const getAllPosts = async (searchParams = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
      author = '',
      sort = 'latest',
      includeDrafts = false
    } = searchParams;

    const offset = (page - 1) * limit;

    // Build base query
    let query = db('blog_posts as bp')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.content',
        'bp.excerpt',
        'bp.featured_image',
        'bp.author_id',
        'u.username as author_name',
        'u.avatar as author_avatar',
        'bp.category_id',
        'bc.name as category_name',
        'bc.slug as category_slug',
        'bp.status',
        'bp.is_featured',
        'bp.reading_time',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.created_at',
        'bp.updated_at',
        'bp.published_at',
        'bp.scheduled_at'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id');

    // Include drafts filter for admin
    if (!includeDrafts) {
      query = query.where('bp.status', 'published');
    } else if (status) {
      query = query.where('bp.status', status);
    }

    // Apply search filters
    if (search) {
      query = query.where(function () {
        this.where('bp.title', 'ilike', `%${search}%`)
          .orWhere('bp.content', 'ilike', `%${search}%`)
          .orWhere('bp.excerpt', 'ilike', `%${search}%`);
      });
    }

    if (category) {
      query = query.where('bc.slug', category);
    }

    if (author) {
      query = query.where('u.username', author);
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.orderBy('bp.created_at', 'asc');
        break;
      case 'views':
        query = query.orderBy('bp.views_count', 'desc');
        break;
      case 'likes':
        query = query.orderBy('bp.likes_count', 'desc');
        break;
      default:
        query = query.orderBy('bp.created_at', 'desc');
    }

    // Get total count for pagination
    const countQuery = query.clone().clearSelect().count('bp.id as total');
    const [{ total }] = await countQuery;

    // Get paginated posts
    const posts = await query.limit(limit).offset(offset);

    return formatResponse(posts, 'Posts retrieved successfully', {
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return handleError(error, 'get all posts');
  }
};

/**
 * Publish a draft post
 * @param {number} postId - The post ID
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} The published post
 */
const publishPost = async (postId, userId) => {
  try {
    const updatedPost = await db('blog_posts')
      .where('id', postId)
      .where('author_id', userId)
      .where('status', 'draft')
      .update({
        status: 'published',
        published_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    if (updatedPost.length === 0) {
      return {
        success: false,
        message: 'Post not found or already published'
      };
    }

    return formatResponse(updatedPost[0], 'Post published successfully');
  } catch (error) {
    return handleError(error, 'publish post');
  }
};

/**
 * Unpublish a post (convert to draft)
 * @param {number} postId - The post ID
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} The unpublished post
 */
const unpublishPost = async (postId, userId) => {
  try {
    const updatedPost = await db('blog_posts')
      .where('id', postId)
      .where('author_id', userId)
      .where('status', 'published')
      .update({
        status: 'draft',
        published_at: null,
        updated_at: new Date()
      })
      .returning('*');

    if (updatedPost.length === 0) {
      return {
        success: false,
        message: 'Post not found or already unpublished'
      };
    }

    return formatResponse(updatedPost[0], 'Post unpublished successfully');
  } catch (error) {
    return handleError(error, 'unpublish post');
  }
};

/**
 * Schedule a post for future publication
 * @param {number} postId - The post ID
 * @param {Date} scheduledDate - The scheduled publication date
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} The scheduled post
 */
const schedulePost = async (postId, scheduledDate, userId) => {
  try {
    const updatedPost = await db('blog_posts')
      .where('id', postId)
      .where('author_id', userId)
      .whereIn('status', ['draft', 'scheduled'])
      .update({
        status: 'scheduled',
        scheduled_at: scheduledDate,
        updated_at: new Date()
      })
      .returning('*');

    if (updatedPost.length === 0) {
      return {
        success: false,
        message: 'Post not found or cannot be scheduled'
      };
    }

    return formatResponse(updatedPost[0], 'Post scheduled successfully');
  } catch (error) {
    return handleError(error, 'schedule post');
  }
};

/**
 * Toggle featured status of a post (Admin only)
 * @param {number} postId - The post ID
 * @returns {Promise<Object>} The updated post
 */
const toggleFeaturedPost = async (postId) => {
  try {
    // Get current featured status
    const currentPost = await db('blog_posts').select('is_featured').where('id', postId).first();

    if (!currentPost) {
      return {
        success: false,
        message: 'Post not found'
      };
    }

    // Toggle the featured status
    const updatedPost = await db('blog_posts')
      .where('id', postId)
      .update({
        is_featured: !currentPost.is_featured,
        updated_at: new Date()
      })
      .returning('*');

    return formatResponse(updatedPost[0], 'Post featured status updated successfully');
  } catch (error) {
    return handleError(error, 'toggle featured post');
  }
};

/**
 * Bulk delete posts (Admin only)
 * @param {Array} postIds - Array of post IDs
 * @param {number} adminId - Admin user ID
 * @returns {Promise<number>} Number of deleted posts
 */
const bulkDeletePosts = async (postIds, adminId) => {
  const trx = await db.transaction();

  try {
    // Delete related data first
    await trx('blog_likes').whereIn('post_id', postIds).del();
    await trx('blog_views').whereIn('post_id', postIds).del();
    await trx('blog_comments').whereIn('post_id', postIds).del();
    await trx('blog_post_tags').whereIn('post_id', postIds).del();

    // Delete the posts
    const deletedCount = await trx('blog_posts').whereIn('id', postIds).del();

    await trx.commit();

    logger.info('Bulk delete posts completed:', {
      deletedCount,
      postIds,
      adminId
    });

    return deletedCount;
  } catch (error) {
    await trx.rollback();
    logger.error('Error in bulkDeletePosts:', error);
    throw error;
  }
};

module.exports = {
  getAllPosts,
  publishPost,
  unpublishPost,
  schedulePost,
  toggleFeaturedPost,
  bulkDeletePosts
};
