/**
 * Blog Likes Service Module
 * 
 * Handles all like-related operations including like/unlike functionality,
 * like counts, and user interaction tracking.
 * Follows single responsibility principle.
 */

const db = require('../../config/database');
const logger = require('../../utils/logger');

// #TODO: Migrate remaining like-related functions from blogService.js
// Functions still to migrate:
// - getMostLikedPosts
// - getLikeAnalytics

/**
 * Toggle post like (like/unlike)
 * @param {number} postId - The post ID
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} Like status and count
 */
const togglePostLike = async (postId, userId) => {
  try {
    // Check if user already liked this post
    const existingLike = await db('blog_likes').where('post_id', postId).where('user_id', userId).first();

    if (existingLike) {
      // Remove like
      await db('blog_likes').where('post_id', postId).where('user_id', userId).del();

      // Update likes count
      await db('blog_posts').where('id', postId).decrement('likes_count', 1);

      const [{ likes_count }] = await db('blog_posts').select('likes_count').where('id', postId);

      return {
        liked: false,
        likes_count: likes_count
      };
    } else {
      // Add like
      await db('blog_likes').insert({
        post_id: postId,
        user_id: userId,
        created_at: new Date()
      });

      // Update likes count
      await db('blog_posts').where('id', postId).increment('likes_count', 1);

      const [{ likes_count }] = await db('blog_posts').select('likes_count').where('id', postId);

      return {
        liked: true,
        likes_count: likes_count
      };
    }
  } catch (error) {
    logger.error('Error in togglePostLike:', error);
    throw error;
  }
};

/**
 * Like a post
 * @param {number} postId - The post ID
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} The like record
 */
const likePost = async (postId, userId) => {
  try {
    // Check if already liked
    const existingLike = await db('blog_likes').where('post_id', postId).where('user_id', userId).first();

    if (existingLike) {
      return { success: false, message: 'Post already liked' };
    }

    // Add like
    await db('blog_likes').insert({
      post_id: postId,
      user_id: userId,
      created_at: new Date()
    });

    // Update likes count
    await db('blog_posts').where('id', postId).increment('likes_count', 1);

    return { success: true, message: 'Post liked successfully' };
  } catch (error) {
    logger.error('Error in likePost:', error);
    throw error;
  }
};

/**
 * Unlike a post
 * @param {number} postId - The post ID
 * @param {number} userId - The user ID
 * @returns {Promise<boolean>} Success status
 */
const unlikePost = async (postId, userId) => {
  try {
    const deletedCount = await db('blog_likes').where('post_id', postId).where('user_id', userId).del();

    if (deletedCount > 0) {
      // Update likes count
      await db('blog_posts').where('id', postId).decrement('likes_count', 1);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error in unlikePost:', error);
    throw error;
  }
};

/**
 * Get like count for a post
 * @param {number} postId - The post ID
 * @returns {Promise<number>} The like count
 */
const getLikeCount = async (postId) => {
  try {
    const [{ likes_count }] = await db('blog_posts').select('likes_count').where('id', postId);
    return likes_count || 0;
  } catch (error) {
    logger.error('Error in getLikeCount:', error);
    throw error;
  }
};

/**
 * Check if post is liked by user
 * @param {number} postId - The post ID
 * @param {number} userId - The user ID
 * @returns {Promise<boolean>} Whether the post is liked by user
 */
const isPostLikedByUser = async (postId, userId) => {
  try {
    const like = await db('blog_likes').where('post_id', postId).where('user_id', userId).first();
    return !!like;
  } catch (error) {
    logger.error('Error in isPostLikedByUser:', error);
    throw error;
  }
};

/**
 * Get user's liked posts
 * @param {number} userId - The user ID
 * @returns {Promise<Array>} Array of liked posts
 */
const getUserLikes = async (userId) => {
  try {
    const likes = await db('blog_likes as bl')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.excerpt',
        'bp.featured_image',
        'bl.created_at as liked_at'
      ])
      .join('blog_posts as bp', 'bl.post_id', 'bp.id')
      .where('bl.user_id', userId)
      .where('bp.status', 'published')
      .orderBy('bl.created_at', 'desc');

    return likes;
  } catch (error) {
    logger.error('Error in getUserLikes:', error);
    throw error;
  }
};

module.exports = {
  togglePostLike,
  likePost,
  unlikePost,
  getLikeCount,
  isPostLikedByUser,
  getUserLikes
  // #TODO: Export other like-related functions after migration
};
