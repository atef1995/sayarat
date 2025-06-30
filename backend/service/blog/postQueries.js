/**
 * Blog Posts Queries Service Module
 * 
 * Handles specialized post queries like featured posts, trending posts,
 * and posts by category/tag/author. Extends the core posts functionality.
 */

const db = require('../../config/database');
const logger = require('../../utils/logger');
const { handleError, formatResponse } = require('./utils');

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
        'u.avatar as author_avatar',
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
        'u.avatar as author_avatar',
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
      .where('bp.published_at', '>=', db.raw('NOW() - INTERVAL ? DAY', [days]))
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
        'u.avatar as author_avatar',
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

module.exports = {
  getFeaturedPosts,
  getTrendingPosts,
  getRecentPosts,
  getPostsByCategory,
  getPostsByTag,
  getPostsByAuthor
};
