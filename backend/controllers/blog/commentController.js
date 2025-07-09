/**
 * Comment Controller
 *
 * Handles all blog comment-related operations including CRUD operations,
 * comment moderation, and comment management. Implements SOLID principles
 * with single responsibility for comments.
 */

const blogService = require('../../service/blog/index');
const logger = require('../../utils/logger');

/**
 * Public Comment Controllers
 */

/**
 * Get comments for a specific blog post
 */
const getPostComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await blogService.getPostComments(postId, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error in getPostComments controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comments'
    });
  }
};

/**
 * User Comment Controllers (Authenticated users)
 */

/**
 * Add a comment to a blog post
 */
const addPostComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.id;
    const { content, parent_id } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const commentData = {
      post_id: postId,
      author_id: userId,
      content: content,
      parent_comment_id: parent_id || null
    };

    const comment = await blogService.addPostComment(commentData);

    logger.info('Comment added:', {
      commentId: comment.id,
      postId: postId,
      authorId: userId
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'تم إضافة التعليق بنجاح'
    });
  } catch (error) {
    logger.error('Error in addPostComment controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
};

/**
 * Reply to a comment
 */
const replyToComment = async (req, res) => {
  try {
    const { id: parentCommentId } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;

    const commentData = {
      content,
      author_id: authorId,
      parent_comment_id: parentCommentId,
      post_id: null // Will be set by the service
    };

    const reply = await blogService.replyToComment(commentData);

    logger.info('Comment reply created:', {
      replyId: reply.id,
      parentCommentId: parentCommentId,
      authorId: authorId
    });

    res.status(201).json({
      success: true,
      data: reply,
      message: 'تم إضافة الرد بنجاح'
    });
  } catch (error) {
    logger.error('Reply to comment error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إضافة الرد'
    });
  }
};

/**
 * Update a comment (User can only update their own comments)
 */
const updateComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check if user owns the comment
    const comment = await blogService.getCommentById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'التعليق غير موجود'
      });
    }

    if (comment.author_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'غير مسموح لك بتعديل هذا التعليق'
      });
    }

    const updatedComment = await blogService.updateComment(commentId, { content });

    logger.info('Comment updated:', {
      commentId: commentId,
      authorId: userId
    });

    res.json({
      success: true,
      data: updatedComment,
      message: 'تم تحديث التعليق بنجاح'
    });
  } catch (error) {
    logger.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في تحديث التعليق'
    });
  }
};

/**
 * Delete a comment (User can only delete their own comments)
 */
const deleteComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const userId = req.user.id;

    // Check if user owns the comment
    const comment = await blogService.getCommentById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'التعليق غير موجود'
      });
    }

    if (comment.author_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'غير مسموح لك بحذف هذا التعليق'
      });
    }

    await blogService.deleteComment(commentId);

    logger.info('Comment deleted:', {
      commentId: commentId,
      authorId: userId
    });

    res.json({
      success: true,
      message: 'تم حذف التعليق بنجاح'
    });
  } catch (error) {
    logger.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في حذف التعليق'
    });
  }
};

/**
 * Admin Comment Controllers (Admin only)
 */

/**
 * Get all comments for admin panel (Admin only)
 */
const getAllComments = async (req, res) => {
  try {
    const searchParams = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      postId: req.query.postId || '',
      authorId: req.query.authorId || '',
      sort: req.query.sort || 'latest'
    };

    const result = await blogService.getAllComments(searchParams);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Get all comments error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب التعليقات'
    });
  }
};

/**
 * Approve comment (Admin only)
 */
const approveComment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.approveComment(id);

    if (result.success) {
      logger.info('Comment approved:', {
        commentId: id,
        adminId: req.user.id
      });

      res.json({
        success: true,
        data: result.data,
        message: 'تم قبول التعليق بنجاح'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'التعليق غير موجود',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Approve comment error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في قبول التعليق'
    });
  }
};

/**
 * Disapprove comment (Admin only)
 */
const disapproveComment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.disapproveComment(id);

    if (result.success) {
      logger.info('Comment disapproved:', {
        commentId: id,
        adminId: req.user.id
      });

      res.json({
        success: true,
        data: result.data,
        message: 'تم رفض التعليق بنجاح'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'التعليق غير موجود',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Disapprove comment error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في رفض التعليق'
    });
  }
};

/**
 * Admin delete comment (Admin only)
 */
const adminDeleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.adminDeleteComment(id);

    if (result.success) {
      logger.info('Comment deleted by admin:', {
        commentId: id,
        adminId: req.user.id
      });

      res.json({
        success: true,
        message: 'تم حذف التعليق بنجاح'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'التعليق غير موجود',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Admin delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في حذف التعليق'
    });
  }
};

/**
 * Bulk moderate comments (Admin only)
 */
const bulkModerateComments = async (req, res) => {
  try {
    const { commentIds, action } = req.body; // action: 'approve', 'disapprove', 'delete'
    const adminId = req.user.id;

    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد التعليقات المراد إدارتها'
      });
    }

    if (!['approve', 'disapprove', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'إجراء غير صحيح'
      });
    }

    const result = await blogService.bulkModerateComments(commentIds, action, adminId);

    if (result.success) {
      logger.info('Bulk comment moderation:', {
        commentIds: commentIds,
        action: action,
        processedCount: result.processedCount,
        adminId: adminId
      });

      const actionText = {
        approve: 'قبول',
        disapprove: 'رفض',
        delete: 'حذف'
      };

      res.json({
        success: true,
        data: { processedCount: result.processedCount },
        message: `تم ${actionText[action]} ${result.processedCount} تعليق بنجاح`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Bulk moderate comments error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إدارة التعليقات'
    });
  }
};

// #TODO: Add comment analytics methods
// #TODO: Add advanced comment moderation features
// #TODO: Add comment spam detection methods

module.exports = {
  // Public comment controllers
  getPostComments,

  // User comment controllers
  addPostComment,
  replyToComment,
  updateComment,
  deleteComment,

  // Admin comment controllers
  getAllComments,
  approveComment,
  disapproveComment,
  adminDeleteComment,
  bulkModerateComments
};
