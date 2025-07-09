/**
 * Blog Tags Service Module
 * 
 * Handles all tag-related operations including CRUD operations,
 * tag management, and tag associations with posts.
 * Follows single responsibility principle.
 */

const db = require('../../config/database');
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
 * Create a new tag
 * @param {Object} tagData - The tag data
 * @param {string} tagData.name - Tag name
 * @param {string} [tagData.description] - Tag description
 * @param {string} [tagData.slug] - Custom slug (auto-generated if not provided)
 * @returns {Promise<Object>} The created tag
 */
const createTag = async (tagData) => {
  try {
    const { name, description, slug } = tagData;

    if (!name || name.trim().length === 0) {
      throw new Error('Tag name is required');
    }

    // Generate slug if not provided
    const tagSlug = slug || generateSlug(name);

    // Check if tag with same name or slug already exists
    const existingTag = await db('blog_tags')
      .where('name', name.trim())
      .orWhere('slug', tagSlug)
      .first();

    if (existingTag) {
      throw new Error('Tag with this name or slug already exists');
    }

    // Create the tag
    const [newTag] = await db('blog_tags')
      .insert({
        name: name.trim(),
        slug: tagSlug,
        description: description?.trim() || null,
        posts_count: 0
      })
      .returning('*');

    logger.info(`Tag created: ${newTag.name} (ID: ${newTag.id})`);
    return newTag;
  } catch (error) {
    logger.error('Error creating tag:', error);
    throw error;
  }
};

/**
 * Get tag by ID
 * @param {number} tagId - The tag ID
 * @returns {Promise<Object>} The tag data
 */
const getTagById = async (tagId) => {
  try {
    const tag = await db('blog_tags')
      .select('*')
      .where('id', tagId)
      .first();

    if (!tag) {
      throw new Error('Tag not found');
    }

    return tag;
  } catch (error) {
    logger.error(`Error getting tag by ID ${tagId}:`, error);
    throw error;
  }
};

/**
 * Get tag by slug
 * @param {string} slug - The tag slug
 * @returns {Promise<Object>} The tag data
 */
const getTagBySlug = async (slug) => {
  try {
    const tag = await db('blog_tags')
      .select('*')
      .where('slug', slug)
      .first();

    if (!tag) {
      throw new Error('Tag not found');
    }

    return tag;
  } catch (error) {
    logger.error(`Error getting tag by slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Update an existing tag
 * @param {number} tagId - The tag ID
 * @param {Object} updateData - The data to update
 * @param {string} [updateData.name] - Updated tag name
 * @param {string} [updateData.description] - Updated description
 * @param {string} [updateData.slug] - Updated slug
 * @returns {Promise<Object>} The updated tag
 */
const updateTag = async (tagId, updateData) => {
  try {
    const { name, description, slug } = updateData;

    // Check if tag exists
    const existingTag = await getTagById(tagId);

    const updateFields = {};

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new Error('Tag name cannot be empty');
      }
      updateFields.name = name.trim();
    }

    if (description !== undefined) {
      updateFields.description = description?.trim() || null;
    }

    if (slug !== undefined) {
      if (!slug || slug.trim().length === 0) {
        throw new Error('Tag slug cannot be empty');
      }
      updateFields.slug = slug.trim();
    }

    // If name is being updated and no custom slug provided, generate new slug
    if (updateFields.name && !slug) {
      updateFields.slug = generateSlug(updateFields.name);
    }

    // Check for conflicts with other tags
    if (updateFields.name || updateFields.slug) {
      const conflictQuery = db('blog_tags').where('id', '!=', tagId);

      if (updateFields.name) {
        conflictQuery.andWhere('name', updateFields.name);
      }
      if (updateFields.slug && updateFields.slug !== existingTag.slug) {
        conflictQuery.orWhere('slug', updateFields.slug);
      }

      const conflictingTag = await conflictQuery.first();
      if (conflictingTag) {
        throw new Error('Tag with this name or slug already exists');
      }
    }

    updateFields.updated_at = db.fn.now();

    // Update the tag
    const [updatedTag] = await db('blog_tags')
      .where('id', tagId)
      .update(updateFields)
      .returning('*');

    logger.info(`Tag updated: ${updatedTag.name} (ID: ${updatedTag.id})`);
    return updatedTag;
  } catch (error) {
    logger.error(`Error updating tag ${tagId}:`, error);
    throw error;
  }
};

/**
 * Delete a tag
 * @param {number} tagId - The tag ID
 * @returns {Promise<boolean>} Success status
 */
const deleteTag = async (tagId) => {
  try {
    // Check if tag exists
    const tag = await getTagById(tagId);

    // Check if tag is associated with any posts
    const postCount = await db('blog_post_tags')
      .where('tag_id', tagId)
      .count('* as count')
      .first();

    if (parseInt(postCount.count) > 0) {
      throw new Error('Cannot delete tag that is associated with posts. Remove tag from all posts first.');
    }

    // Delete the tag
    const deleted = await db('blog_tags')
      .where('id', tagId)
      .del();

    if (deleted === 0) {
      throw new Error('Tag not found or already deleted');
    }

    logger.info(`Tag deleted: ${tag.name} (ID: ${tagId})`);
    return true;
  } catch (error) {
    logger.error(`Error deleting tag ${tagId}:`, error);
    throw error;
  }
};

/**
 * Get all tags with optional pagination and filtering
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=50] - Items per page
 * @param {string} [options.search] - Search term
 * @param {string} [options.orderBy='name'] - Order by field
 * @param {string} [options.order='asc'] - Order direction
 * @returns {Promise<Object>} Tags with pagination info
 */
const getAllTags = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      orderBy = 'name',
      order = 'asc'
    } = options;

    const offset = (page - 1) * limit;

    // Build query
    let query = db('blog_tags');

    // Apply search filter
    if (search && search.trim()) {
      query = query.where(function () {
        this.where('name', 'ilike', `%${search.trim()}%`)
          .orWhere('description', 'ilike', `%${search.trim()}%`);
      });
    }

    // Get total count
    const totalQuery = query.clone();
    const totalResult = await totalQuery.count('* as count').first();
    const total = parseInt(totalResult.count);

    // Apply pagination and ordering
    const tags = await query
      .select('*')
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    logger.error('Error getting all tags:', error);
    throw error;
  }
};

/**
 * Get popular tags based on post count
 * @param {number} [limit=10] - Number of tags to return
 * @returns {Promise<Array>} Array of popular tags
 */
const getPopularTags = async (limit = 10) => {
  try {
    const tags = await db('blog_tags')
      .select('*')
      .where('posts_count', '>', 0)
      .orderBy('posts_count', 'desc')
      .orderBy('name', 'asc')
      .limit(limit);

    return tags;
  } catch (error) {
    logger.error('Error getting popular tags:', error);
    throw error;
  }
};

/**
 * Get tags for a specific post
 * @param {number} postId - The post ID
 * @returns {Promise<Array>} Array of tags associated with the post
 */
const getTagsForPost = async (postId) => {
  try {
    const tags = await db('blog_tags as bt')
      .select('bt.*')
      .join('blog_post_tags as bpt', 'bt.id', 'bpt.tag_id')
      .where('bpt.post_id', postId)
      .orderBy('bt.name', 'asc');

    return tags;
  } catch (error) {
    logger.error(`Error getting tags for post ${postId}:`, error);
    throw error;
  }
};

/**
 * Add tag to a post
 * @param {number} postId - The post ID
 * @param {number} tagId - The tag ID
 * @returns {Promise<boolean>} Success status
 */
const addTagToPost = async (postId, tagId) => {
  try {
    // Check if association already exists
    const existing = await db('blog_post_tags')
      .where({ post_id: postId, tag_id: tagId })
      .first();

    if (existing) {
      throw new Error('Tag is already associated with this post');
    }

    // Add the association
    await db('blog_post_tags').insert({
      post_id: postId,
      tag_id: tagId
    });

    // Update tag posts count
    await db('blog_tags')
      .where('id', tagId)
      .increment('posts_count', 1);

    logger.info(`Tag ${tagId} added to post ${postId}`);
    return true;
  } catch (error) {
    logger.error(`Error adding tag ${tagId} to post ${postId}:`, error);
    throw error;
  }
};

/**
 * Remove tag from a post
 * @param {number} postId - The post ID
 * @param {number} tagId - The tag ID
 * @returns {Promise<boolean>} Success status
 */
const removeTagFromPost = async (postId, tagId) => {
  try {
    // Remove the association
    const deleted = await db('blog_post_tags')
      .where({ post_id: postId, tag_id: tagId })
      .del();

    if (deleted === 0) {
      throw new Error('Tag association not found');
    }

    // Update tag posts count
    await db('blog_tags')
      .where('id', tagId)
      .decrement('posts_count', 1);

    logger.info(`Tag ${tagId} removed from post ${postId}`);
    return true;
  } catch (error) {
    logger.error(`Error removing tag ${tagId} from post ${postId}:`, error);
    throw error;
  }
};

/**
 * Update posts count for a tag
 * @param {number} tagId - The tag ID
 * @returns {Promise<boolean>} Success status
 */
const updateTagPostsCount = async (tagId) => {
  try {
    const countResult = await db('blog_post_tags')
      .where('tag_id', tagId)
      .count('* as count')
      .first();

    const postsCount = parseInt(countResult.count);

    await db('blog_tags')
      .where('id', tagId)
      .update({ posts_count: postsCount });

    return true;
  } catch (error) {
    logger.error(`Error updating posts count for tag ${tagId}:`, error);
    throw error;
  }
};

module.exports = {
  createTag,
  getTagById,
  getTagBySlug,
  updateTag,
  deleteTag,
  getAllTags,
  getPopularTags,
  getTagsForPost,
  addTagToPost,
  removeTagFromPost,
  updateTagPostsCount
};
