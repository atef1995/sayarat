/**
 * Blog Posts Service Module
 * 
 * Handles all post-related operations including CRUD operations,
 * pagination, search, and post management functionality.
 * Follows single responsibility principle.
 */

const db = require('../../config/database');
const logger = require('../../utils/logger');
const {
  generateSlug,
  validatePostData,
  formatPostData,
  parseFilters,
  buildSortOptions,
  handleError,
  formatResponse,
  buildPaginationMeta
} = require('./utils');

// #TODO: Migrate remaining post-related functions from blogService.js
// Functions still to migrate:
// - getPostsByAuthor
// - getPostsByCategory
// - getPostsByTag
// - searchPosts
// - bulkDeletePosts
// - publishPost
// - unpublishPost
// - schedulePost
// - toggleFeaturedPost
// - getFeaturedPosts
// - getTrendingPosts
// - getRecentPosts
// - getPostsByStatus

/**
 * Get blog posts with filtering and pagination using Knex
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} Posts with pagination info
 */
const getPosts = async searchParams => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      tag = '',
      author = '',
      sort = 'latest',
      featured,
      car_make = '',
      car_model = '',
      userId = null
    } = searchParams;

    const offset = (page - 1) * limit;

    // Build base query using Knex
    let query = db('blog_posts as bp')
      .select([
        'bp.id',
        'bp.title',
        'bp.slug',
        'bp.content',
        'bp.excerpt',
        'bp.featured_image',
        'bp.author_id',
        'u.username as author_name',
        'u.picture as author_avatar',
        'bp.category_id',
        'bc.name as category_name',
        'bc.slug as category_slug',
        'bc.color as category_color',
        'bp.status',
        'bp.is_featured',
        'bp.reading_time',
        'bp.views_count',
        'bp.likes_count',
        'bp.comments_count',
        'bp.created_at',
        'bp.updated_at',
        'bp.published_at',
        'bp.car_make',
        'bp.car_model',
        'bp.car_year',
        'bp.rating'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .leftJoin('blog_likes as bl', function () {
        this.on('bp.id', '=', 'bl.post_id');
        if (userId) {
          this.andOn('bl.user_id', '=', userId);
        }
      })
      .where('bp.status', 'published');

    // Add search conditions
    if (search) {
      query = query.where(function () {
        this.where('bp.title', 'ilike', `%${search}%`)
          .orWhere('bp.content', 'ilike', `%${search}%`)
          .orWhere('bp.excerpt', 'ilike', `%${search}%`);
      });
    }

    if (category) {
      query = query.where('bc.slug', category);
    }

    if (tag) {
      query = query.whereExists(function () {
        this.select('*')
          .from('blog_post_tags as bpt2')
          .join('blog_tags as bt2', 'bpt2.tag_id', 'bt2.id')
          .whereRaw('bpt2.post_id = bp.id')
          .where('bt2.slug', tag);
      });
    }

    if (author) {
      query = query.where('u.username', author);
    }

    if (featured !== undefined) {
      query = query.where('bp.is_featured', featured);
    }

    if (car_make) {
      query = query.where('bp.car_make', 'ilike', `%${car_make}%`);
    }

    if (car_model) {
      query = query.where('bp.car_model', 'ilike', `%${car_model}%`);
    }

    // Add user liked status
    if (userId) {
      query = query.select(db.raw('CASE WHEN bl.user_id IS NOT NULL THEN true ELSE false END as is_liked'));
    } else {
      query = query.select(db.raw('false as is_liked'));
    }

    // Add sorting
    switch (sort) {
      case 'latest':
        query = query.orderBy('bp.published_at', 'desc');
        break;
      case 'oldest':
        query = query.orderBy('bp.published_at', 'asc');
        break;
      case 'popular':
        query = query.orderBy('bp.views_count', 'desc');
        break;
      case 'trending':
        query = query.orderBy([
          { column: 'bp.likes_count', order: 'desc' },
          { column: 'bp.views_count', order: 'desc' }
        ]);
        break;
      default:
        query = query.orderBy('bp.published_at', 'desc');
    }

    // Clone query for count
    const countQuery = query.clone();

    // Add pagination to main query
    query = query.limit(limit).offset(offset);

    // Execute queries
    const [posts, countResult] = await Promise.all([query, countQuery.count('bp.id as total').first()]);

    // Get tags for each post
    const postIds = posts.map(post => post.id);
    let tagsQuery = [];

    if (postIds.length > 0) {
      tagsQuery = await db('blog_post_tags as bpt')
        .select('bpt.post_id', 'bt.id', 'bt.name', 'bt.slug')
        .join('blog_tags as bt', 'bpt.tag_id', 'bt.id')
        .whereIn('bpt.post_id', postIds);
    }

    // Group tags by post ID
    const tagsByPost = {};
    tagsQuery.forEach(tagData => {
      if (!tagsByPost[tagData.post_id]) {
        tagsByPost[tagData.post_id] = [];
      }
      tagsByPost[tagData.post_id].push({
        id: tagData.id,
        name: tagData.name,
        slug: tagData.slug
      });
    });

    // Add tags to posts
    const postsWithTags = posts.map(post => ({
      ...post,
      tags: tagsByPost[post.id] || []
    }));

    const total = parseInt(countResult.total, 10);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: postsWithTags,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    logger.error('Error in getPosts:', error);
    return {
      success: false,
      message: 'Failed to fetch blog posts',
      error: error.message
    };
  }
};

/**
 * Create a new blog post
 * @param {Object} postData - The post data
 * @returns {Promise<Object>} The created post
 */
const createPost = async (postData) => {
  // Validate input data
  const validation = validatePostData(postData);
  if (!validation.isValid) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    };
  }

  const trx = await db.transaction();

  try {
    const {
      title,
      content,
      excerpt,
      featured_image,
      author_id,
      category_id,
      status = 'draft',
      is_featured = false,
      reading_time,
      car_make,
      car_model,
      car_year,
      rating,
      steps,
      tags = []
    } = postData;

    // Generate slug from title
    const slug = generateSlug(title);

    // Check if slug exists and make it unique
    const existingPost = await trx('blog_posts').where('slug', slug).first();
    const finalSlug = existingPost ? `${slug}-${Date.now()}` : slug;

    // Insert the blog post
    const [newPost] = await trx('blog_posts')
      .insert({
        title,
        slug: finalSlug,
        content,
        excerpt,
        featured_image,
        author_id,
        category_id,
        status,
        is_featured,
        reading_time,
        car_make,
        car_model,
        car_year,
        rating,
        steps: steps ? JSON.stringify(steps) : null,
        published_at: status === 'published' ? new Date() : null
      })
      .returning('*');

    // Handle tags if provided
    if (tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        post_id: newPost.id,
        tag_id: tagId
      }));

      await trx('blog_post_tags').insert(tagInserts);
    }

    await trx.commit();

    return formatResponse(newPost, 'Blog post created successfully');
  } catch (error) {
    await trx.rollback();
    return handleError(error, 'create blog post');
  }
};

/**
 * Get a single blog post by ID or slug
 * @param {number|string} identifier - The post ID or slug
 * @returns {Promise<Object>} The post data
 */
const getPostById = async (identifier) => {
  try {
    const isNumeric = !isNaN(identifier);
    const whereField = isNumeric ? 'bp.id' : 'bp.slug';

    const post = await db('blog_posts as bp')
      .select([
        'bp.*',
        'u.username as author_name',
        'u.picture as author_avatar',
        'bc.name as category_name',
        'bc.slug as category_slug',
        'bc.color as category_color'
      ])
      .join('sellers as u', 'bp.author_id', 'u.id')
      .join('blog_categories as bc', 'bp.category_id', 'bc.id')
      .where(whereField, identifier)
      .where('bp.status', 'published')
      .first();

    if (!post) {
      return {
        success: false,
        message: 'Blog post not found'
      };
    }

    // Get tags for this post
    const tags = await db('blog_post_tags as bpt')
      .select('bt.id', 'bt.name', 'bt.slug')
      .join('blog_tags as bt', 'bpt.tag_id', 'bt.id')
      .where('bpt.post_id', post.id);

    post.tags = tags;

    return {
      success: true,
      data: post
    };
  } catch (error) {
    logger.error('Error in getPostById:', error);
    return {
      success: false,
      message: 'Failed to fetch blog post',
      error: error.message
    };
  }
};

/**
 * Update an existing post
 * @param {number} postId - The post ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} The updated post
 */
const updatePost = async (postId, updateData) => {
  const trx = await db.transaction();

  try {
    const {
      title,
      content,
      excerpt,
      featured_image,
      category_id,
      status,
      is_featured,
      reading_time,
      car_make,
      car_model,
      car_year,
      rating,
      steps,
      tags = []
    } = updateData;

    // Prepare update object
    const updateObj = {};

    if (title !== undefined) {
      updateObj.title = title;
      // Update slug if title changes
      updateObj.slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    if (content !== undefined) {
      updateObj.content = content;
    }
    if (excerpt !== undefined) {
      updateObj.excerpt = excerpt;
    }
    if (featured_image !== undefined) {
      updateObj.featured_image = featured_image;
    }
    if (category_id !== undefined) {
      updateObj.category_id = category_id;
    }
    if (status !== undefined) {
      updateObj.status = status;
      if (status === 'published') {
        updateObj.published_at = new Date();
      }
    }
    if (is_featured !== undefined) {
      updateObj.is_featured = is_featured;
    }
    if (reading_time !== undefined) {
      updateObj.reading_time = reading_time;
    }
    if (car_make !== undefined) {
      updateObj.car_make = car_make;
    }
    if (car_model !== undefined) {
      updateObj.car_model = car_model;
    }
    if (car_year !== undefined) {
      updateObj.car_year = car_year;
    }
    if (rating !== undefined) {
      updateObj.rating = rating;
    }
    if (steps !== undefined) {
      updateObj.steps = steps ? JSON.stringify(steps) : null;
    }

    // Update the post
    const [updatedPost] = await trx('blog_posts').where('id', postId).update(updateObj).returning('*');

    if (!updatedPost) {
      await trx.rollback();
      return {
        success: false,
        message: 'Blog post not found'
      };
    }

    // Handle tags update if provided
    if (tags.length >= 0) {
      // Remove existing tags
      await trx('blog_post_tags').where('post_id', postId).del();

      // Add new tags
      if (tags.length > 0) {
        const tagInserts = tags.map(tagId => ({
          post_id: postId,
          tag_id: tagId
        }));

        await trx('blog_post_tags').insert(tagInserts);
      }
    }

    await trx.commit();

    return {
      success: true,
      data: updatedPost,
      message: 'Blog post updated successfully'
    };
  } catch (error) {
    await trx.rollback();
    logger.error('Error in updatePost:', error);
    return {
      success: false,
      message: 'Failed to update blog post',
      error: error.message
    };
  }
};

/**
 * Delete a post
 * @param {number} postId - The post ID
 * @returns {Promise<Object>} Success status
 */
const deletePost = async (postId) => {
  const trx = await db.transaction();

  try {
    // Delete related records first
    await trx('blog_post_tags').where('post_id', postId).del();
    await trx('blog_likes').where('post_id', postId).del();
    await trx('blog_views').where('post_id', postId).del();
    await trx('blog_comments').where('post_id', postId).del();

    // Delete the post
    const deletedCount = await trx('blog_posts').where('id', postId).del();

    if (deletedCount === 0) {
      await trx.rollback();
      return {
        success: false,
        message: 'Blog post not found'
      };
    }

    await trx.commit();

    return {
      success: true,
      message: 'Blog post deleted successfully'
    };
  } catch (error) {
    await trx.rollback();
    logger.error('Error in deletePost:', error);
    return {
      success: false,
      message: 'Failed to delete blog post',
      error: error.message
    };
  }
};

/**
 * Get all posts with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of posts
 */
const getAllPosts = (...args) => {
  // Delegate to postManagement module
  const postManagement = require('./postManagement');
  return postManagement.getAllPosts(...args);
};

module.exports = {
  getPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getAllPosts
  // #TODO: Export other post-related functions after migration
};
