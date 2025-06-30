/**
 * Tag Controller
 *
 * Handles all blog tag-related operations including CRUD operations,
 * tag management, and tag statistics. Implements SOLID principles
 * with single responsibility for tags.
 */

const blogService = require('../../service/blogService');
const { generateSlug } = require('../../middleware/blogValidation');
const logger = require('../../utils/logger');

/**
 * Public Tag Controllers
 */

/**
 * Get all tags
 */
const getTags = async(req, res) => {
  try {
    const result = await blogService.getTags();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Error in getTags controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tags'
    });
  }
};

/**
 * Get single tag by ID or slug
 */
const getTag = async(req, res) => {
  try {
    const { identifier } = req.params;
    const result = await blogService.getTag(identifier);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'التصنيف غير موجود',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Get tag error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب التصنيف'
    });
  }
};

/**
 * Admin/User Tag Controllers
 */

/**
 * Create new tag
 */
const createTag = async(req, res) => {
  try {
    const tagData = {
      ...req.body,
      slug: generateSlug(req.body.name)
    };

    const result = await blogService.createTag(tagData);

    if (result.success) {
      logger.info('Tag created:', {
        tagId: result.data.id,
        name: result.data.name,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        data: result.data,
        message: 'تم إنشاء التصنيف بنجاح'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Create tag error:', error);

    if (error.code === '23505' && error.constraint?.includes('slug')) {
      return res.status(400).json({
        success: false,
        error: 'اسم التصنيف مستخدم بالفعل'
      });
    }

    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إنشاء التصنيف'
    });
  }
};

/**
 * Update tag (Admin only)
 */
const updateTag = async(req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body
    };

    // Generate new slug if name is being updated
    if (updateData.name) {
      updateData.slug = generateSlug(updateData.name);
    }

    const result = await blogService.updateTag(id, updateData);

    if (result.success) {
      logger.info('Tag updated:', {
        tagId: id,
        updatedBy: req.user.id
      });

      res.json({
        success: true,
        data: result.data,
        message: 'تم تحديث التصنيف بنجاح'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'التصنيف غير موجود',
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Update tag error:', error);

    if (error.code === '23505' && error.constraint?.includes('slug')) {
      return res.status(400).json({
        success: false,
        error: 'اسم التصنيف مستخدم بالفعل'
      });
    }

    res.status(500).json({
      success: false,
      error: 'حدث خطأ في تحديث التصنيف'
    });
  }
};

/**
 * Delete tag (Admin only)
 */
const deleteTag = async(req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.deleteTag(id);

    if (result.success) {
      logger.info('Tag deleted:', {
        tagId: id,
        deletedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'تم حذف التصنيف بنجاح'
      });
    } else {
      const statusCode = result.message.includes('being used') ? 400 : 404;
      const errorMessage = result.message.includes('being used')
        ? 'لا يمكن حذف التصنيف لأنه مستخدم في مقالات'
        : 'التصنيف غير موجود';

      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في حذف التصنيف'
    });
  }
};

/**
 * Get tag statistics (Admin only)
 */
const getTagStats = async(req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.getTagStats(id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Get tag stats error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب إحصائيات التصنيف'
    });
  }
};

/**
 * Get popular tags
 */
const getPopularTags = async(req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await blogService.getPopularTags(limit);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Get popular tags error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب التصنيفات الشائعة'
    });
  }
};

// #TODO: Add tag trending analytics methods
// #TODO: Add tag content moderation methods
// #TODO: Add tag SEO optimization methods

module.exports = {
  // Public tag controllers
  getTags,
  getTag,
  getPopularTags,

  // Admin/User tag controllers
  createTag,
  updateTag,
  deleteTag,
  getTagStats
};
