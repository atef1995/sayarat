/**
 * Blog Comments Service Module
 * 
 * Handles all comment-related operations including CRUD operations,
 * comment moderation, threading, and analytics. Follows single responsibility
 * principle and implements proper error handling.
 */

const db = require('../../config/database');
const logger = require('../../utils/logger');
const { isValidUUID } = require('./views'); // Reuse UUID validation from views service

/**
 * Public Comment Operations
 */

/**
 * Get comments for a specific blog post with pagination and threading
 * @param {number} postId - The post ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Comments per page (default: 20)
 * @returns {Promise<Object>} Comments with pagination info
 */
const getPostComments = async (postId, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;

    // Get top-level comments first
    const comments = await db('blog_comments as bc')
      .select([
        'bc.id',
        'bc.post_id',
        'bc.author_id',
        'bc.parent_id',
        'bc.content',
        'bc.status',
        'bc.likes_count',
        'bc.replies_count',
        'bc.created_at',
        'bc.updated_at',
        's.username as author_name',
        's.picture as author_avatar'
      ])
      .join('sellers as s', 'bc.author_id', 's.id')
      .where('bc.post_id', postId)
      .where('bc.parent_id', null) // Only top-level comments
      .where('bc.status', 'approved')
      .orderBy('bc.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get replies for each comment
    const commentIds = comments.map(comment => comment.id);
    let replies = [];

    if (commentIds.length > 0) {
      replies = await db('blog_comments as bc')
        .select([
          'bc.id',
          'bc.post_id',
          'bc.author_id',
          'bc.parent_id',
          'bc.content',
          'bc.status',
          'bc.likes_count',
          'bc.replies_count',
          'bc.created_at',
          'bc.updated_at',
          's.username as author_name',
          's.picture as author_avatar'
        ])
        .join('sellers as s', 'bc.author_id', 's.id')
        .whereIn('bc.parent_id', commentIds)
        .where('bc.status', 'approved')
        .orderBy('bc.created_at', 'asc');
    }

    // Group replies by parent comment
    const repliesMap = {};
    replies.forEach(reply => {
      if (!repliesMap[reply.parent_id]) {
        repliesMap[reply.parent_id] = [];
      }
      repliesMap[reply.parent_id].push(reply);
    });

    // Attach replies to their parent comments
    const commentsWithReplies = comments.map(comment => ({
      ...comment,
      replies: repliesMap[comment.id] || []
    }));

    // Get total count for pagination
    const [{ total }] = await db('blog_comments')
      .where('post_id', postId)
      .where('parent_id', null)
      .where('status', 'approved')
      .count('id as total');

    return {
      data: commentsWithReplies,
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error in getPostComments:', error);
    throw error;
  }
};

/**
 * User Comment Operations (Authenticated users)
 */

/**
 * Add a comment to a blog post
 * @param {Object} commentData - Comment data
 * @param {number} commentData.post_id - Post ID
 * @param {string} commentData.author_id - Author UUID
 * @param {string} commentData.content - Comment content
 * @param {number} commentData.parent_comment_id - Parent comment ID (optional)
 * @returns {Promise<Object>} Created comment
 */
const addPostComment = async (commentData) => {
  try {
    // Validate author UUID
    if (!isValidUUID(commentData.author_id)) {
      throw new Error('Invalid author ID format - must be a valid UUID');
    }

    // Validate that the post exists
    const post = await db('blog_posts')
      .select('id', 'status')
      .where('id', commentData.post_id)
      .first();

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.status !== 'published') {
      throw new Error('Cannot comment on unpublished posts');
    }

    // Validate parent comment if provided
    if (commentData.parent_comment_id) {
      const parentComment = await db('blog_comments')
        .select('id', 'post_id')
        .where('id', commentData.parent_comment_id)
        .first();

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      if (parentComment.post_id !== commentData.post_id) {
        throw new Error('Parent comment does not belong to this post');
      }
    }

    // Insert comment
    const insertData = {
      post_id: commentData.post_id,
      author_id: commentData.author_id,
      parent_id: commentData.parent_comment_id || null,
      content: commentData.content,
      status: 'pending', // Comments need approval by default
      likes_count: 0,
      replies_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [commentId] = await db('blog_comments')
      .insert(insertData)
      .returning('id');

    // Update post comments count
    await db('blog_posts')
      .where('id', commentData.post_id)
      .increment('comments_count', 1);

    // Update parent comment replies count if it's a reply
    if (commentData.parent_comment_id) {
      await db('blog_comments')
        .where('id', commentData.parent_comment_id)
        .increment('replies_count', 1);
    }

    // Return the created comment with author info
    const comment = await db('blog_comments as bc')
      .select([
        'bc.id',
        'bc.post_id',
        'bc.author_id',
        'bc.parent_id',
        'bc.content',
        'bc.status',
        'bc.likes_count',
        'bc.replies_count',
        'bc.created_at',
        'bc.updated_at',
        's.username as author_name',
        's.picture as author_avatar'
      ])
      .join('sellers as s', 'bc.author_id', 's.id')
      .where('bc.id', commentId)
      .first();

    return comment;
  } catch (error) {
    logger.error('Error in addPostComment:', error);
    throw error;
  }
};

/**
 * Reply to a comment
 * @param {Object} replyData - Reply data
 * @param {string} replyData.content - Reply content
 * @param {string} replyData.author_id - Author UUID
 * @param {number} replyData.parent_comment_id - Parent comment ID
 * @returns {Promise<Object>} Created reply
 */
const replyToComment = async (replyData) => {
  try {
    // Get parent comment to determine post_id
    const parentComment = await db('blog_comments')
      .select('id', 'post_id')
      .where('id', replyData.parent_comment_id)
      .first();

    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    // Create reply with post_id from parent comment
    const commentData = {
      post_id: parentComment.post_id,
      author_id: replyData.author_id,
      content: replyData.content,
      parent_comment_id: replyData.parent_comment_id
    };

    return await addPostComment(commentData);
  } catch (error) {
    logger.error('Error in replyToComment:', error);
    throw error;
  }
};

/**
 * Get a specific comment by ID
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object>} Comment object
 */
const getCommentById = async (commentId) => {
  try {
    const comment = await db('blog_comments as bc')
      .select([
        'bc.id',
        'bc.post_id',
        'bc.author_id',
        'bc.parent_id',
        'bc.content',
        'bc.status',
        'bc.likes_count',
        'bc.replies_count',
        'bc.created_at',
        'bc.updated_at',
        's.username as author_name',
        's.picture as author_avatar'
      ])
      .join('sellers as s', 'bc.author_id', 's.id')
      .where('bc.id', commentId)
      .first();

    return comment;
  } catch (error) {
    logger.error('Error in getCommentById:', error);
    throw error;
  }
};

/**
 * Update a comment
 * @param {number} commentId - Comment ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated comment
 */
const updateComment = async (commentId, updateData) => {
  try {
    const updateFields = {
      ...updateData,
      updated_at: new Date()
    };

    await db('blog_comments')
      .where('id', commentId)
      .update(updateFields);

    return await getCommentById(commentId);
  } catch (error) {
    logger.error('Error in updateComment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise<void>}
 */
const deleteComment = async (commentId) => {
  try {
    const comment = await getCommentById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Delete the comment
    await db('blog_comments')
      .where('id', commentId)
      .del();

    // Update post comments count
    await db('blog_posts')
      .where('id', comment.post_id)
      .decrement('comments_count', 1);

    // Update parent comment replies count if it's a reply
    if (comment.parent_id) {
      await db('blog_comments')
        .where('id', comment.parent_id)
        .decrement('replies_count', 1);
    }

    logger.info('Comment deleted successfully:', { commentId });
  } catch (error) {
    logger.error('Error in deleteComment:', error);
    throw error;
  }
};

/**
 * Admin Comment Operations
 */

/**
 * Get all comments for admin panel with filtering and pagination
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} Comments with pagination
 */
const getAllComments = async (searchParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      postId = '',
      authorId = '',
      sort = 'latest'
    } = searchParams;

    const offset = (page - 1) * limit;

    // Build base query
    let query = db('blog_comments as bc')
      .select([
        'bc.id',
        'bc.post_id',
        'bc.author_id',
        'bc.parent_id',
        'bc.content',
        'bc.status',
        'bc.likes_count',
        'bc.replies_count',
        'bc.created_at',
        'bc.updated_at',
        's.username as author_name',
        's.picture as author_avatar',
        'bp.title as post_title',
        'bp.slug as post_slug'
      ])
      .join('sellers as s', 'bc.author_id', 's.id')
      .join('blog_posts as bp', 'bc.post_id', 'bp.id');

    // Apply filters
    if (search) {
      query = query.where('bc.content', 'ilike', `%${search}%`);
    }

    if (status) {
      query = query.where('bc.status', status);
    }

    if (postId) {
      query = query.where('bc.post_id', postId);
    }

    if (authorId) {
      query = query.where('bc.author_id', authorId);
    }

    // Apply sorting
    switch (sort) {
      case 'latest':
        query = query.orderBy('bc.created_at', 'desc');
        break;
      case 'oldest':
        query = query.orderBy('bc.created_at', 'asc');
        break;
      case 'most_liked':
        query = query.orderBy('bc.likes_count', 'desc');
        break;
      default:
        query = query.orderBy('bc.created_at', 'desc');
    }

    // Get paginated results
    const comments = await query
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery = db('blog_comments as bc')
      .join('sellers as s', 'bc.author_id', 's.id')
      .join('blog_posts as bp', 'bc.post_id', 'bp.id');

    // Apply same filters for count
    if (search) {
      countQuery = countQuery.where('bc.content', 'ilike', `%${search}%`);
    }

    if (status) {
      countQuery = countQuery.where('bc.status', status);
    }

    if (postId) {
      countQuery = countQuery.where('bc.post_id', postId);
    }

    if (authorId) {
      countQuery = countQuery.where('bc.author_id', authorId);
    }

    const [{ total }] = await countQuery.count('bc.id as total');

    return {
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error in getAllComments:', error);
    return {
      success: false,
      message: 'Failed to fetch comments'
    };
  }
};

/**
 * Approve a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object>} Result object
 */
const approveComment = async (commentId) => {
  try {
    const comment = await getCommentById(commentId);
    if (!comment) {
      return {
        success: false,
        message: 'Comment not found'
      };
    }

    await db('blog_comments')
      .where('id', commentId)
      .update({
        status: 'approved',
        updated_at: new Date()
      });

    const updatedComment = await getCommentById(commentId);

    return {
      success: true,
      data: updatedComment
    };
  } catch (error) {
    logger.error('Error in approveComment:', error);
    return {
      success: false,
      message: 'Failed to approve comment'
    };
  }
};

/**
 * Disapprove a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object>} Result object
 */
const disapproveComment = async (commentId) => {
  try {
    const comment = await getCommentById(commentId);
    if (!comment) {
      return {
        success: false,
        message: 'Comment not found'
      };
    }

    await db('blog_comments')
      .where('id', commentId)
      .update({
        status: 'rejected',
        updated_at: new Date()
      });

    const updatedComment = await getCommentById(commentId);

    return {
      success: true,
      data: updatedComment
    };
  } catch (error) {
    logger.error('Error in disapproveComment:', error);
    return {
      success: false,
      message: 'Failed to disapprove comment'
    };
  }
};

/**
 * Admin delete comment
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object>} Result object
 */
const adminDeleteComment = async (commentId) => {
  try {
    const comment = await getCommentById(commentId);
    if (!comment) {
      return {
        success: false,
        message: 'Comment not found'
      };
    }

    await deleteComment(commentId);

    return {
      success: true
    };
  } catch (error) {
    logger.error('Error in adminDeleteComment:', error);
    return {
      success: false,
      message: 'Failed to delete comment'
    };
  }
};

/**
 * Bulk moderate comments
 * @param {Array} commentIds - Array of comment IDs
 * @param {string} action - Action to perform ('approve', 'disapprove', 'delete')
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>} Result object
 */
const bulkModerateComments = async (commentIds, action, _adminId) => {
  try {
    let processedCount = 0;

    for (const commentId of commentIds) {
      try {
        switch (action) {
          case 'approve':
            const approveResult = await approveComment(commentId);
            if (approveResult.success) processedCount++;
            break;

          case 'disapprove':
            const disapproveResult = await disapproveComment(commentId);
            if (disapproveResult.success) processedCount++;
            break;

          case 'delete':
            const deleteResult = await adminDeleteComment(commentId);
            if (deleteResult.success) processedCount++;
            break;

          default:
            throw new Error('Invalid action');
        }
      } catch (error) {
        logger.error(`Error processing comment ${commentId}:`, error);
        // Continue processing other comments
      }
    }

    return {
      success: true,
      processedCount
    };
  } catch (error) {
    logger.error('Error in bulkModerateComments:', error);
    return {
      success: false,
      message: 'Failed to bulk moderate comments'
    };
  }
};

// #TODO: Add comment likes functionality
// #TODO: Add comment reporting functionality
// #TODO: Add comment analytics
// #TODO: Add comment spam detection
// #TODO: Add comment threading limits
// #TODO: Add comment editing history
// #TODO: Add comment notifications

module.exports = {
  // Public comment operations
  getPostComments,

  // User comment operations
  addPostComment,
  replyToComment,
  getCommentById,
  updateComment,
  deleteComment,

  // Admin comment operations
  getAllComments,
  approveComment,
  disapproveComment,
  adminDeleteComment,
  bulkModerateComments
};
