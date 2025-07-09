const { getAllPosts: getAllPostsService } = require('../../service/blog/index');
const { generateSlug } = require('../../middleware/blogValidation');


/**
 * Admin Post Controllers
 */

/**
 * Get all posts (including drafts) - Admin only
 */
const getAllPosts = async (req, res) => {
  try {
    const searchParams = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      search: req.query.search || '',
      status: req.query.status || '',
      author: req.query.author || '',
      category: req.query.category || '',
      sort: req.query.sort || 'latest'
    };

    const result = await getAllPostsService(searchParams);

    if (result.success) {
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Get all posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب المقالات'
    });
  }
};

/**
 * Create new blog post
 */
const createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      author_id: req.user.id,
      slug: generateSlug(req.body.title),
      featured_image: req.file ? req.file.filename : null
    };

    const post = await blogService.createPost(postData);

    logger.info('Blog post created:', {
      postId: post.id,
      authorId: req.user.id,
      title: post.title
    });

    return res.status(201).json({
      success: true,
      data: post,
      message: 'تم إنشاء المقال بنجاح'
    });
  } catch (error) {
    logger.error('Create post error:', error);

    if (error.code === '23505' && error.constraint?.includes('slug')) {
      return res.status(400).json({
        success: false,
        error: 'عنوان المقال مستخدم بالفعل'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في إنشاء المقال'
    });
  }
};

/**
 * Update blog post
 */
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      slug: req.body.title ? generateSlug(req.body.title) : undefined
    };

    if (req.file) {
      updateData.featured_image = req.file.filename;
    }

    const post = await blogService.updatePost(id, updateData, req.user.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'المقال غير موجود أو ليس لديك صلاحية لتعديله'
      });
    }

    logger.info('Blog post updated:', {
      postId: id,
      userId: req.user.id
    });

    return res.json({
      success: true,
      data: post,
      message: 'تم تحديث المقال بنجاح'
    });
  } catch (error) {
    logger.error('Update post error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في تحديث المقال'
    });
  }
};

/**
 * Delete blog post
 */
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await blogService.deletePost(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'المقال غير موجود أو ليس لديك صلاحية لحذفه'
      });
    }

    logger.info('Blog post deleted:', {
      postId: id,
      userId: req.user.id
    });

    return res.json({
      success: true,
      message: 'تم حذف المقال بنجاح'
    });
  } catch (error) {
    logger.error('Delete post error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في حذف المقال'
    });
  }
};

/**
 * Bulk delete blog posts
 */
const bulkDeletePosts = async (req, res) => {
  try {
    const { postIds } = req.body;
    const adminId = req.user.id;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المقالات المراد حذفها'
      });
    }

    const result = await blogService.bulkDeletePosts(postIds, adminId);

    if (result.success) {
      logger.info('Bulk delete posts:', {
        postIds: postIds,
        deletedCount: result.deletedCount,
        adminId: adminId
      });

      return res.json({
        success: true,
        data: { deletedCount: result.deletedCount },
        message: `تم حذف ${result.deletedCount} مقال بنجاح`
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Bulk delete posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في حذف المقالات'
    });
  }
};

/**
 * Publish a draft post
 */
const publishPost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.publishPost(id, req.user.id);

    if (result.success) {
      logger.info('Post published:', {
        postId: id,
        publishedBy: req.user.id
      });

      return res.json({
        success: true,
        data: result.data,
        message: 'تم نشر المقال بنجاح'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'المقال غير موجود أو ليس لديك صلاحية لنشره',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Publish post error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في نشر المقال'
    });
  }
};

/**
 * Unpublish a post (convert to draft)
 */
const unpublishPost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.unpublishPost(id, req.user.id);

    if (result.success) {
      logger.info('Post unpublished:', {
        postId: id,
        unpublishedBy: req.user.id
      });

      return res.json({
        success: true,
        data: result.data,
        message: 'تم إلغاء نشر المقال بنجاح'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'المقال غير موجود أو ليس لديك صلاحية لإلغاء نشره',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Unpublish post error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في إلغاء نشر المقال'
    });
  }
};

/**
 * Schedule a post
 */
const schedulePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_at } = req.body;

    if (!scheduled_at) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد تاريخ النشر'
      });
    }

    const result = await blogService.schedulePost(id, scheduled_at, req.user.id);

    if (result.success) {
      logger.info('Post scheduled:', {
        postId: id,
        scheduledAt: scheduled_at,
        scheduledBy: req.user.id
      });

      return res.json({
        success: true,
        data: result.data,
        message: 'تم جدولة المقال بنجاح'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'المقال غير موجود أو ليس لديك صلاحية لجدولته',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Schedule post error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جدولة المقال'
    });
  }
};

/**
 * Feature/unfeature a post
 */
const toggleFeaturedPost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.toggleFeaturedPost(id, req.user.id);

    if (result.success) {
      const action = result.data.is_featured ? 'تمييز' : 'إلغاء تمييز';

      logger.info('Post featured status toggled:', {
        postId: id,
        isFeatured: result.data.is_featured,
        toggledBy: req.user.id
      });

      return res.json({
        success: true,
        data: result.data,
        message: `تم ${action} المقال بنجاح`
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'المقال غير موجود أو ليس لديك صلاحية لتمييزه',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Toggle featured post error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في تمييز المقال'
    });
  }
};

module.exports = {
  // Admin post controllers
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  bulkDeletePosts,
  publishPost,
  unpublishPost,
  schedulePost,
  toggleFeaturedPost,
}