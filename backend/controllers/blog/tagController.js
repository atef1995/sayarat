/**
 * Tag Controller
 *
 * Handles all blog tag-related operations including CRUD operations,
 * tag management, and tag statistics. Implements SOLID principles
 * with single responsibility for tags.
 */

const {
  getAllTags,
  getTagById,
  getTagBySlug,
  getPopularTags: getPopularTagsService,
  createTag: createTagService,
  updateTag: updateTagService,
  deleteTag: deleteTagService
} = require('../../service/blog/tags');
const logger = require('../../utils/logger');

/**
 * Generate slug from tag name
 * @param {string} name - Tag name
 * @returns {string} Generated slug
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Public Tag Controllers
 */

/**
 * Get all tags
 */
const getTags = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 50,
      search: req.query.search || '',
      orderBy: req.query.orderBy || 'name',
      order: req.query.order || 'asc'
    };

    const result = await getAllTags(options);

    return res.json(result);
  } catch (error) {
    logger.error('Error in getTags controller:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب العلامات'
    });
  }
};

/**
 * Get single tag by ID or slug
 */
const getTag = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Check if identifier is numeric (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);
    let tag;

    if (isNumeric) {
      tag = await getTagById(parseInt(identifier));
    } else {
      tag = await getTagBySlug(identifier);
    }

    return res.json(tag);
  } catch (error) {
    logger.error('Get tag error:', error);

    if (error.message === 'Tag not found') {
      return res.status(404).json({
        success: false,
        error: 'العلامة غير موجودة'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب العلامة'
    });
  }
};

/**
 * Admin/User Tag Controllers
 */

/**
 * Create new tag
 */
const createTag = async (req, res) => {
  try {
    const tagData = {
      ...req.body,
      slug: req.body.slug || generateSlug(req.body.name)
    };

    const newTag = await createTagService(tagData);

    logger.info('Tag created:', {
      tagId: newTag.id,
      name: newTag.name,
      createdBy: req.user?.id || 'system'
    });

    return res.status(201).json(newTag);
  } catch (error) {
    logger.error('Create tag error:', error);

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: 'اسم العلامة أو الرابط مستخدم بالفعل'
      });
    }

    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        error: 'اسم العلامة مطلوب'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في إنشاء العلامة'
    });
  }
};

/**
 * Update tag (Admin only)
 */
const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body
    };

    // Generate new slug if name is being updated and no custom slug provided
    if (updateData.name && !updateData.slug) {
      updateData.slug = generateSlug(updateData.name);
    }

    const updatedTag = await updateTagService(parseInt(id), updateData);

    logger.info('Tag updated:', {
      tagId: id,
      updatedBy: req.user?.id || 'system'
    });

    return res.json(updatedTag);
  } catch (error) {
    logger.error('Update tag error:', error);

    if (error.message === 'Tag not found') {
      return res.status(404).json({
        success: false,
        error: 'العلامة غير موجودة'
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: 'اسم العلامة أو الرابط مستخدم بالفعل'
      });
    }

    if (error.message.includes('cannot be empty')) {
      return res.status(400).json({
        success: false,
        error: 'اسم العلامة لا يمكن أن يكون فارغاً'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في تحديث العلامة'
    });
  }
};

/**
 * Delete tag (Admin only)
 */
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTagService(parseInt(id));

    logger.info('Tag deleted:', {
      tagId: id,
      deletedBy: req.user?.id || 'system'
    });

    return res.json({
      success: true,
      message: 'تم حذف العلامة بنجاح'
    });
  } catch (error) {
    logger.error('Delete tag error:', error);

    if (error.message === 'Tag not found') {
      return res.status(404).json({
        success: false,
        error: 'العلامة غير موجودة'
      });
    }

    if (error.message.includes('associated with posts')) {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن حذف العلامة لأنها مرتبطة بمقالات'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في حذف العلامة'
    });
  }
};

/**
 * Get popular tags
 */
const getPopularTags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const tags = await getPopularTagsService(limit);

    return res.json(tags);
  } catch (error) {
    logger.error('Get popular tags error:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب العلامات الشائعة'
    });
  }
};

// #TODO: Add tag statistics methods when implemented in service
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
  deleteTag
};
