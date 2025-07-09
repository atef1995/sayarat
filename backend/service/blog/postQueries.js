/**
 * Blog Posts Queries Service Module
 * 
 * Handles specialized post queries like featured posts, trending posts,
 * and posts by category/tag/author. Extends the core posts functionality.
 */

const db = require('../../config/database');
const logger = require('../../utils/logger');
const { postgresInterval } = require('./queryUtils');
// const { handleError, formatResponse } = require('./utils'); // #TODO: Implement error handling utilities

/**
 * Get featured blog posts
 * @param {number} limit - Maximum number of posts to return
 * @returns {Promise<Array>} Array of featured posts
 */
const getFeaturedPosts = async (limit = 5) => {
  try {
    const posts = await db('blog_posts as bp')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.excerpt',
        'bp.featured_image',
        'bp.author_id',
        'u.username as author_name',
        'u.picture as author_avatar',
        'bp.category_id',
        'bc.name as category_name',
        'bc.slug as category_slug',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.created_at',
        'bp.published_at'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .where('bp.status', 'published')
      .where('bp.is_featured', true)
      .orderBy('bp.published_at', 'desc')
      .limit(limit);

    return posts;
  } catch (error) {
    logger.error('Error in getFeaturedPosts:', error);
    throw error;
  }
};

/**
 * Get trending blog posts
 * @param {number} limit - Maximum number of posts to return
 * @param {number} days - Number of days to consider for trending
 * @returns {Promise<Array>} Array of trending posts
 */
const getTrendingPosts = async (limit = 10, days = 7) => {
  try {
    const posts = await db('blog_posts as bp')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.excerpt',
        'bp.featured_image',
        'bp.author_id',
        'u.username as author_name',
        'u.picture as author_avatar',
        'bp.category_id',
        'bc.name as category_name',
        'bc.slug as category_slug',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.created_at',
        'bp.published_at'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .where('bp.status', 'published')
      .where('bp.published_at', '>=', postgresInterval(days, 'days'))
      .orderBy('bp.views_count', 'desc')
      .orderBy('bp.likes_count', 'desc')
      .limit(limit);

    return posts;
  } catch (error) {
    logger.error('Error in getTrendingPosts:', error);
    throw error;
  }
};

/**
 * Get recent blog posts
 * @param {number} limit - Maximum number of posts to return
 * @returns {Promise<Array>} Array of recent posts
 */
const getRecentPosts = async (limit = 5) => {
  try {
    const posts = await db('blog_posts as bp')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.excerpt',
        'bp.featured_image',
        'bp.author_id',
        'u.username as author_name',
        'u.picture as author_avatar',
        'bp.category_id',
        'bc.name as category_name',
        'bc.slug as category_slug',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.created_at',
        'bp.published_at'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .where('bp.status', 'published')
      .orderBy('bp.published_at', 'desc')
      .limit(limit);

    return posts;
  } catch (error) {
    logger.error('Error in getRecentPosts:', error);
    throw error;
  }
};

/**
 * Get posts by category
 * @param {string} slug - Category slug
 * @param {number} page - Page number
 * @param {number} limit - Posts per page
 * @returns {Promise<Object>} Posts with pagination
 */
const getPostsByCategory = async (slug, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;

    const posts = await db('blog_posts as bp')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.excerpt',
        'bp.featured_image',
        'bp.author_id',
        'u.username as author_name',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.created_at',
        'bp.published_at'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .where('bc.slug', slug)
      .where('bp.status', 'published')
      .orderBy('bp.published_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db('blog_posts as bp')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .where('bc.slug', slug)
      .where('bp.status', 'published')
      .count('bp.id as total');

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error in getPostsByCategory:', error);
    throw error;
  }
};

/**
 * Get posts by tag
 * @param {string} slug - Tag slug
 * @param {number} page - Page number
 * @param {number} limit - Posts per page
 * @returns {Promise<Object>} Posts with pagination
 */
const getPostsByTag = async (slug, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;

    const posts = await db('blog_posts as bp')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.excerpt',
        'bp.featured_image',
        'bp.author_id',
        'u.username as author_name',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.created_at',
        'bp.published_at'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_post_tags as bpt', 'bp.id', 'bpt.post_id')
      .join('blog_tags as bt', 'bpt.tag_id', 'bt.id')
      .where('bt.slug', slug)
      .where('bp.status', 'published')
      .orderBy('bp.published_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db('blog_posts as bp')
      .join('blog_post_tags as bpt', 'bp.id', 'bpt.post_id')
      .join('blog_tags as bt', 'bpt.tag_id', 'bt.id')
      .where('bt.slug', slug)
      .where('bp.status', 'published')
      .count('bp.id as total');

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error in getPostsByTag:', error);
    throw error;
  }
};

/**
 * Get posts by author
 * @param {string} username - Author username
 * @param {number} page - Page number
 * @param {number} limit - Posts per page
 * @returns {Promise<Object>} Posts with pagination
 */
const getPostsByAuthor = async (username, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;

    const posts = await db('blog_posts as bp')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.excerpt',
        'bp.featured_image',
        'bp.category_id',
        'bc.name as category_name',
        'bc.slug as category_slug',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.created_at',
        'bp.published_at'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .where('u.username', username)
      .where('bp.status', 'published')
      .orderBy('bp.published_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db('blog_posts as bp')
      .join('sellers as u', 'bp.author_id', 'u.id')
      .where('u.username', username)
      .where('bp.status', 'published')
      .count('bp.id as total');

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error in getPostsByAuthor:', error);
    throw error;
  }
};

/**
 * Get a single blog post by slug with complete details
 * @param {string} slug - The post slug
 * @param {number} userId - Optional user ID to check if post is liked by user
 * @returns {Promise<Object>} Complete post object with tags
 */
const getPostBySlug = async (slug, userId = null) => {
  try {
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
        'u.picture as author_avatar',
        'bp.category_id',
        'bc.name as category_name',
        'bc.slug as category_slug',
        'bc.color as category_color',
        'bp.status',
        'bp.is_featured',
        'bp.meta_title',
        'bp.meta_description',
        'bp.reading_time',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.created_at',
        'bp.updated_at',
        'bp.published_at',
        'bp.car_make',
        'bp.car_model',
        'bp.car_year',
        'bp.rating',
        'bp.price_when_reviewed',
        'bp.price_currency',
        'bp.pros',
        'bp.cons',
        'bp.specifications',
        'bp.steps'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .leftJoin('blog_likes as bl', function () {
        this.on('bp.id', '=', 'bl.post_id');
        if (userId) {
          this.andOn('bl.user_id', '=', userId);
        }
      })
      .where('bp.slug', slug)
      .where('bp.status', 'published')
      .first();

    // Add user liked status
    if (userId) {
      query = query.select(db.raw('CASE WHEN bl.user_id IS NOT NULL THEN true ELSE false END as is_liked'));
    } else {
      query = query.select(db.raw('false as is_liked'));
    }

    const post = await query;

    if (!post) {
      return null;
    }

    // Get tags for the post
    const tags = await db('blog_post_tags as bpt')
      .select('bt.id', 'bt.name', 'bt.slug')
      .join('blog_tags as bt', 'bpt.tag_id', 'bt.id')
      .where('bpt.post_id', post.id);

    // Parse JSON fields if they exist
    if (post.pros && typeof post.pros === 'string') {
      try {
        post.pros = JSON.parse(post.pros);
      } catch (e) {
        post.pros = [];
      }
    }

    if (post.cons && typeof post.cons === 'string') {
      try {
        post.cons = JSON.parse(post.cons);
      } catch (e) {
        post.cons = [];
      }
    }

    if (post.specifications && typeof post.specifications === 'string') {
      try {
        post.specifications = JSON.parse(post.specifications);
      } catch (e) {
        post.specifications = {};
      }
    }

    if (post.steps && typeof post.steps === 'string') {
      try {
        post.steps = JSON.parse(post.steps);
      } catch (e) {
        post.steps = [];
      }
    }

    return {
      ...post,
      tags: tags || []
    };
  } catch (error) {
    logger.error('Error in getPostBySlug:', error);
    throw error;
  }
};

module.exports = {
  getFeaturedPosts,
  getTrendingPosts,
  getRecentPosts,
  getPostsByCategory,
  getPostsByTag,
  getPostsByAuthor,
  getPostBySlug
};
