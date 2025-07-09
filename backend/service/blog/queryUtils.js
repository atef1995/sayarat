/**
 * Database Query Utilities
 * 
 * Common utility functions for database queries, including PostgreSQL-specific
 * syntax helpers and reusable query builders.
 * 
 * Follows DRY principles and provides consistent database interaction patterns.
 */

const db = require('../../config/database');

/**
 * PostgreSQL interval helper
 * Creates a proper PostgreSQL interval expression for date calculations
 * 
 * @param {number} value - The interval value (e.g., 7 for 7 days)
 * @param {string} unit - The time unit ('days', 'hours', 'minutes', 'months', 'years')
 * @returns {object} Knex raw expression for PostgreSQL interval
 * 
 * @example
 * // Get posts from last 7 days
 * .where('created_at', '>=', postgresInterval(7, 'days'))
 * 
 * // Get posts from last 30 days
 * .where('created_at', '>=', postgresInterval(30, 'days'))
 */
const postgresInterval = (value, unit = 'days') => {
  const validUnits = ['days', 'hours', 'minutes', 'months', 'years', 'weeks'];

  if (!validUnits.includes(unit)) {
    throw new Error(`Invalid time unit: ${unit}. Valid units: ${validUnits.join(', ')}`);
  }

  // Validate value is a positive number to prevent SQL injection
  const numValue = parseInt(value, 10);
  if (isNaN(numValue) || numValue < 0 || numValue > 10000) {
    throw new Error(`Invalid interval value: ${value}. Must be a positive integer between 0 and 10000.`);
  }

  // Use proper PostgreSQL interval syntax with validated inputs
  return db.raw(`NOW() - INTERVAL '${numValue} ${unit}'`);
};

/**
 * PostgreSQL date formatting helper
 * Creates a proper PostgreSQL date formatting expression
 * 
 * @param {string} column - The column name to format
 * @param {string} format - The date format ('date', 'month', 'year', 'hour')
 * @returns {object} Knex raw expression for PostgreSQL date formatting
 * 
 * @example
 * // Group by date
 * .groupBy(postgresDateFormat('created_at', 'date'))
 * 
 * // Group by month
 * .groupBy(postgresDateFormat('created_at', 'month'))
 */
const postgresDateFormat = (column, format = 'date') => {
  // Validate column name to prevent SQL injection
  if (!column || typeof column !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(column)) {
    throw new Error(`Invalid column name: ${column}. Must be a valid SQL identifier.`);
  }

  const formatMap = {
    'date': `DATE(${column})`,
    'month': `DATE_TRUNC('month', ${column})`,
    'year': `DATE_TRUNC('year', ${column})`,
    'hour': `DATE_TRUNC('hour', ${column})`,
    'week': `DATE_TRUNC('week', ${column})`
  };

  if (!formatMap[format]) {
    throw new Error(`Invalid date format: ${format}. Valid formats: ${Object.keys(formatMap).join(', ')}`);
  }

  return db.raw(formatMap[format]);
};

/**
 * Common pagination query builder
 * Builds standardized pagination queries with total count
 * 
 * @param {object} baseQuery - The base Knex query object
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Promise<object>} Object with data and pagination info
 * 
 * @example
 * const baseQuery = db('blog_posts').where('status', 'published');
 * const result = await paginateQuery(baseQuery, 1, 10);
 */
const paginateQuery = async (baseQuery, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  // Clone the query for count
  const countQuery = baseQuery.clone();

  // Execute both queries in parallel
  const [data, countResult] = await Promise.all([
    baseQuery.limit(limit).offset(offset),
    countQuery.count('* as total').first()
  ]);

  const total = parseInt(countResult.total, 10);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
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

/**
 * Build search conditions for full-text search
 * Creates PostgreSQL full-text search conditions
 * 
 * @param {string} searchTerm - The search term
 * @param {array} columns - Array of column names to search in
 * @param {string} _language - PostgreSQL text search language (reserved for future use)
 * @returns {function} Function to be used with Knex where()
 * 
 * @example
 * const searchCondition = buildSearchCondition('car review', ['title', 'content']);
 * query.where(searchCondition);
 */
const buildSearchCondition = (searchTerm, columns, _language = 'english') => {
  if (!searchTerm || !columns || columns.length === 0) {
    return () => { }; // Return empty condition
  }

  return function () {
    // Simple ILIKE search for each column
    columns.forEach((column, index) => {
      if (index === 0) {
        this.where(column, 'ilike', `%${searchTerm}%`);
      } else {
        this.orWhere(column, 'ilike', `%${searchTerm}%`);
      }
    });
  };
};

/**
 * Validate and sanitize sort parameters
 * Ensures sort parameters are safe and valid
 * 
 * @param {string} sortBy - The sort field
 * @param {string} sortOrder - The sort order ('asc' or 'desc')
 * @param {array} allowedFields - Array of allowed sort fields
 * @returns {object} Validated sort parameters
 * 
 * @example
 * const sortParams = validateSortParams('created_at', 'desc', ['created_at', 'title', 'views_count']);
 * query.orderBy(sortParams.field, sortParams.order);
 */
const validateSortParams = (sortBy, sortOrder = 'desc', allowedFields = []) => {
  const validOrders = ['asc', 'desc'];

  // Validate sort order
  if (!validOrders.includes(sortOrder.toLowerCase())) {
    throw new Error(`Invalid sort order: ${sortOrder}. Valid orders: ${validOrders.join(', ')}`);
  }

  // Validate sort field
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    throw new Error(`Invalid sort field: ${sortBy}. Allowed fields: ${allowedFields.join(', ')}`);
  }

  return {
    field: sortBy,
    order: sortOrder.toLowerCase()
  };
};

// #TODO: Add more utility functions as needed
// - buildFilterConditions
// - sanitizeInput
// - validateId
// - buildJoinConditions

module.exports = {
  postgresInterval,
  postgresDateFormat,
  paginateQuery,
  buildSearchCondition,
  validateSortParams,
  db
};
