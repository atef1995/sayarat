/**
 * Blog Utilities Service Module
 * 
 * Contains shared utility functions for the blog service including
 * validation, formatting, and common helper functions.
 * Implements DRY principle and reusable patterns.
 */

const logger = require('../../utils/logger');

/**
 * Validate post data
 * @param {Object} postData - The post data to validate
 * @returns {Object} Validation result with errors if any
 */
const validatePostData = (postData) => {
  const errors = [];

  if (!postData.title || typeof postData.title !== 'string' || postData.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!postData.content || typeof postData.content !== 'string' || postData.content.trim().length === 0) {
    errors.push('Content is required and must be a non-empty string');
  }

  if (!postData.author_id || typeof postData.author_id !== 'string') {
    errors.push('Author ID is required and must be a valid identifier');
  }

  if (!postData.category_id || typeof postData.category_id !== 'number') {
    errors.push('Category ID is required and must be a number');
  }

  if (postData.status && !['draft', 'published', 'scheduled'].includes(postData.status)) {
    errors.push('Status must be one of: draft, published, scheduled');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize HTML content
 * @param {string} content - The content to sanitize
 * @returns {string} The sanitized content
 */
const sanitizeContent = (content) => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Basic HTML sanitization - remove script tags and dangerous attributes
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Calculate reading time based on content
 * @param {string} content - The content to analyze
 * @returns {number} Reading time in minutes
 */
const calculateReadingTime = (content) => {
  if (!content || typeof content !== 'string') {
    return 0;
  }

  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Format post data for response
 * @param {Object} postData - The raw post data
 * @returns {Object} The formatted post data
 */
const formatPostData = (postData) => {
  if (!postData) {
    return null;
  }

  const excerpt = postData.excerpt || (postData.content ? `${postData.content.substring(0, 200)}...` : '');

  return {
    ...postData,
    content: sanitizeContent(postData.content),
    excerpt,
    reading_time: postData.reading_time || calculateReadingTime(postData.content),
    tags: postData.tags || []
  };
};

/**
 * Parse and validate filters
 * @param {Object} filters - The filters to parse
 * @returns {Object} The parsed and validated filters
 */
const parseFilters = (filters) => {
  const defaultFilters = {
    page: 1,
    limit: 10,
    search: '',
    category: '',
    tag: '',
    author: '',
    sort: 'latest',
    status: 'published'
  };

  const parsed = { ...defaultFilters, ...filters };

  // Validate and sanitize
  parsed.page = Math.max(1, parseInt(parsed.page, 10) || 1);
  parsed.limit = Math.min(100, Math.max(1, parseInt(parsed.limit, 10) || 10));
  parsed.search = typeof parsed.search === 'string' ? parsed.search.trim() : '';
  parsed.category = typeof parsed.category === 'string' ? parsed.category.trim() : '';
  parsed.tag = typeof parsed.tag === 'string' ? parsed.tag.trim() : '';
  parsed.author = typeof parsed.author === 'string' ? parsed.author.trim() : '';

  // Validate sort options
  const validSortOptions = ['latest', 'oldest', 'popular', 'trending', 'views', 'likes'];
  if (!validSortOptions.includes(parsed.sort)) {
    parsed.sort = 'latest';
  }

  return parsed;
};

/**
 * Build SQL sort options
 * @param {string} sortOption - The sort option
 * @returns {Array} Array of sort objects for Knex
 */
const buildSortOptions = (sortOption) => {
  switch (sortOption) {
    case 'latest':
      return [{ column: 'published_at', order: 'desc' }];
    case 'oldest':
      return [{ column: 'published_at', order: 'asc' }];
    case 'popular':
      return [{ column: 'views_count', order: 'desc' }];
    case 'trending':
      return [
        { column: 'likes_count', order: 'desc' },
        { column: 'views_count', order: 'desc' }
      ];
    case 'views':
      return [{ column: 'views_count', order: 'desc' }];
    case 'likes':
      return [{ column: 'likes_count', order: 'desc' }];
    default:
      return [{ column: 'published_at', order: 'desc' }];
  }
};

/**
 * Standard error response formatter
 * @param {Error} error - The error object
 * @param {string} context - The context where error occurred
 * @returns {Object} Formatted error response
 */
const handleError = (error, context) => {
  logger.error(`Error in ${context}:`, error);

  return {
    success: false,
    message: `Failed to ${context}`,
    error: error.message || 'Unknown error occurred'
  };
};

/**
 * Standard success response formatter
 * @param {*} data - The data to include in response
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata (pagination, etc.)
 * @returns {Object} Formatted success response
 */
const formatResponse = (data, message = 'Operation successful', meta = {}) => {
  const response = {
    success: true,
    data,
    message
  };

  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return response;
};

/**
 * Build pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  validatePostData,
  sanitizeContent,
  formatPostData,
  calculateReadingTime,
  parseFilters,
  buildSortOptions,
  handleError,
  formatResponse,
  buildPaginationMeta
};

module.exports = {
  validatePostData,
  sanitizeContent,
  formatPostData,
  parseFilters,
  buildSortOptions,
  handleError,
  formatResponse
  // #TODO: Export other utility functions after migration
};
