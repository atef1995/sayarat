/**
 * Blog Categories Service Module
 * 
 * Handles all category-related operations including CRUD operations
 * and category management functionality.
 * Follows single responsibility principle.
 */

const db = require('../../config/database');
const logger = require('../../utils/logger');

// #TODO: Migrate remaining category-related functions from blogService.js
// Functions still to migrate:
// - getCategoryBySlug
// - getCategoriesWithPostCount

/**
 * Get all blog categories
 * @returns {Promise<Object>} Categories data
 */
const getAllCategories = async () => {
  try {
    const categories = await db('blog_categories').select('*').where('is_active', true).orderBy('name');

    return {
      success: true,
      data: categories
    };
  } catch (error) {
    logger.error('Error in getAllCategories:', error);
    return {
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    };
  }
};

/**
 * Create a new category
 * @param {Object} categoryData - The category data
 * @returns {Promise<Object>} The created category
 */
const createCategory = async (categoryData) => {
  try {
    const { name, description, color, icon } = categoryData;

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const [newCategory] = await db('blog_categories')
      .insert({
        name,
        slug,
        description,
        color,
        icon
      })
      .returning('*');

    return {
      success: true,
      data: newCategory,
      message: 'Category created successfully'
    };
  } catch (error) {
    logger.error('Error in createCategory:', error);
    return {
      success: false,
      message: 'Failed to create category',
      error: error.message
    };
  }
};

/**
 * Get category by ID
 * @param {number} categoryId - The category ID
 * @returns {Promise<Object>} The category data
 */
const getCategoryById = async (categoryId) => {
  try {
    const category = await db('blog_categories').where('id', categoryId).first();

    if (!category) {
      return {
        success: false,
        message: 'Category not found'
      };
    }

    return {
      success: true,
      data: category
    };
  } catch (error) {
    logger.error('Error in getCategoryById:', error);
    return {
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    };
  }
};

/**
 * Update an existing category
 * @param {number} categoryId - The category ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} The updated category
 */
const updateCategory = async (categoryId, updateData) => {
  try {
    const { name, description, color, icon, is_active } = updateData;

    // Prepare update object
    const updateObj = {};

    if (name !== undefined) {
      updateObj.name = name;
      // Update slug if name changes
      updateObj.slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    if (description !== undefined) {
      updateObj.description = description;
    }
    if (color !== undefined) {
      updateObj.color = color;
    }
    if (icon !== undefined) {
      updateObj.icon = icon;
    }
    if (is_active !== undefined) {
      updateObj.is_active = is_active;
    }

    updateObj.updated_at = new Date();

    const [updatedCategory] = await db('blog_categories').where('id', categoryId).update(updateObj).returning('*');

    if (!updatedCategory) {
      return {
        success: false,
        message: 'Category not found'
      };
    }

    return {
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    };
  } catch (error) {
    logger.error('Error in updateCategory:', error);
    return {
      success: false,
      message: 'Failed to update category',
      error: error.message
    };
  }
};

/**
 * Delete a category
 * @param {number} categoryId - The category ID
 * @returns {Promise<Object>} Success status
 */
const deleteCategory = async (categoryId) => {
  const trx = await db.transaction();

  try {
    // Check if category has posts
    const postsCount = await trx('blog_posts').where('category_id', categoryId).count('id as total').first();

    if (postsCount.total > 0) {
      await trx.rollback();
      return {
        success: false,
        message: 'Cannot delete category with existing posts'
      };
    }

    // Delete the category
    const deletedCount = await trx('blog_categories').where('id', categoryId).del();

    if (deletedCount === 0) {
      await trx.rollback();
      return {
        success: false,
        message: 'Category not found'
      };
    }

    await trx.commit();

    return {
      success: true,
      message: 'Category deleted successfully'
    };
  } catch (error) {
    await trx.rollback();
    logger.error('Error in deleteCategory:', error);
    return {
      success: false,
      message: 'Failed to delete category',
      error: error.message
    };
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory
  // #TODO: Export other category-related functions after migration
};
