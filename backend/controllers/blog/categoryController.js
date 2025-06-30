/**
 * Category Controller
 *
 * Handles all blog category-related operations including CRUD operations,
 * category management, and status toggling. Implements SOLID principles
 * with single responsibility for categories.
 */

const blogService = require('../../service/blogService');
const { generateSlug } = require('../../middleware/blogValidation');
const logger = require('../../utils/logger');

/**
 * Public Category Controllers
 */

/**
 * Get all categories
 */
const getCategories = async(req, res) => {
  try {
    const result = await blogService.getCategories();

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
    logger.error('Error in getCategories controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
};

/**
 * Get single category by ID or slug
 */
const getCategory = async(req, res) => {
  try {
    const { identifier } = req.params; // Can be ID or slug
    const result = await blogService.getCategory(identifier);

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
    logger.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب التصنيف'
    });
  }
};

/**
 * Admin Category Controllers
 */

/**
 * Create new category (Admin only)
 */
const createCategory = async(req, res) => {
  try {
    const categoryData = {
      ...req.body,
      slug: generateSlug(req.body.name)
    };

    const category = await blogService.createCategory(categoryData);

    logger.info('Blog category created:', {
      categoryId: category.id,
      name: category.name,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'تم إنشاء التصنيف بنجاح'
    });
  } catch (error) {
    logger.error('Create category error:', error);

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
 * Update category (Admin only)
 */
const updateCategory = async(req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body
    };

    // Generate new slug if name is being updated
    if (updateData.name) {
      updateData.slug = generateSlug(updateData.name);
    }

    const result = await blogService.updateCategory(id, updateData);

    if (result.success) {
      logger.info('Blog category updated:', {
        categoryId: id,
        adminId: req.user.id
      });

      res.json({
        success: true,
        data: result.data,
        message: 'تم تحديث التصنيف بنجاح'
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Update category error:', error);

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
 * Delete category (Admin only)
 */
const deleteCategory = async(req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.deleteCategory(id);

    if (result.success) {
      logger.info('Blog category deleted:', {
        categoryId: id,
        adminId: req.user.id
      });

      res.json({
        success: true,
        message: 'تم حذف التصنيف بنجاح'
      });
    } else {
      const statusCode = result.code === 'CATEGORY_HAS_POSTS' ? 409 : 404;
      res.status(statusCode).json({
        success: false,
        error: result.message,
        code: result.code
      });
    }
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في حذف التصنيف'
    });
  }
};

/**
 * Toggle category active status (Admin only)
 */
const toggleCategoryActive = async(req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.toggleCategoryActive(id);

    if (result.success) {
      const action = result.data.is_active ? 'تفعيل' : 'إلغاء تفعيل';

      logger.info('Blog category status toggled:', {
        categoryId: id,
        isActive: result.data.is_active,
        adminId: req.user.id
      });

      res.json({
        success: true,
        data: result.data,
        message: `تم ${action} التصنيف بنجاح`
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Toggle category active error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في تغيير حالة التصنيف'
    });
  }
};

/**
 * Get category statistics (Admin only)
 */
const getCategoryStats = async(req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.getCategoryStats(id);

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
    logger.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب إحصائيات التصنيف'
    });
  }
};

// #TODO: Add category-specific analytics methods
// #TODO: Add category content moderation methods
// #TODO: Add category SEO optimization methods

module.exports = {
  // Public category controllers
  getCategories,
  getCategory,

  // Admin category controllers
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  getCategoryStats
};
