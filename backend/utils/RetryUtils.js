const { getConnectionManager } = require('./ConnectionManager');
const RetryManager = require('./RetryManager');

/**
 * Enhanced database utilities with retry logic
 * Provides higher-level database operations with built-in retry capabilities
 */
class DatabaseUtils {
  constructor(knexInstance) {
    this.knex = knexInstance;
    this.connectionManager = getConnectionManager();
  }

  /**
   * Execute a query with retry logic
   * @param {Function} queryBuilder - Function that builds and returns a query
   * @param {string} operationName - Name for logging purposes
   * @returns {Promise} - Query result
   */
  async executeQuery(queryBuilder, operationName = 'Database Query') {
    return this.connectionManager.executeDbOperation(
      this.knex,
      queryBuilder,
      operationName
    );
  }

  /**
   * Execute a transaction with retry logic
   * @param {Function} transactionCallback - Function that performs transaction operations
   * @param {string} operationName - Name for logging purposes
   * @returns {Promise} - Transaction result
   */
  async executeTransaction(transactionCallback, operationName = 'Database Transaction') {
    return this.connectionManager.executeDbOperation(
      this.knex,
      async (knex) => {
        return knex.transaction(transactionCallback);
      },
      operationName
    );
  }

  /**
   * Execute multiple queries in parallel with retry logic
   * @param {Array<Function>} queryBuilders - Array of query builder functions
   * @param {string} operationName - Name for logging purposes
   * @returns {Promise<Array>} - Array of query results
   */
  async executeParallelQueries(queryBuilders, operationName = 'Parallel Database Queries') {
    const queries = queryBuilders.map((queryBuilder, index) =>
      this.executeQuery(queryBuilder, `${operationName} - Query ${index + 1}`)
    );

    return Promise.all(queries);
  }

  /**
   * Check if database is healthy
   * @returns {Promise<boolean>} - True if healthy
   */
  async isHealthy() {
    return this.connectionManager.checkDatabaseHealth(this.knex);
  }
}

/**
 * Enhanced Redis utilities with retry logic
 * Provides higher-level Redis operations with built-in retry capabilities
 */
class RedisUtils {
  constructor(redisClient) {
    this.redis = redisClient;
    this.connectionManager = getConnectionManager();
  }

  /**
   * Execute a Redis command with retry logic
   * @param {Function} commandCallback - Function that executes Redis commands
   * @param {string} operationName - Name for logging purposes
   * @returns {Promise} - Command result
   */
  async executeCommand(commandCallback, operationName = 'Redis Command') {
    return this.connectionManager.executeRedisOperation(
      this.redis,
      commandCallback,
      operationName
    );
  }

  /**
   * Set a value with retry logic
   * @param {string} key - Redis key
   * @param {*} value - Value to set
   * @param {Object} options - Set options (ex, px, etc.)
   * @returns {Promise} - Set result
   */
  async set(key, value, options = {}) {
    return this.executeCommand(
      async (client) => {
        if (options.ex) {
          return client.setEx(key, options.ex, value);
        } else if (options.px) {
          return client.pSetEx(key, options.px, value);
        } else {
          return client.set(key, value);
        }
      },
      `Redis SET ${key}`
    );
  }

  /**
   * Get a value with retry logic
   * @param {string} key - Redis key
   * @returns {Promise} - Retrieved value
   */
  async get(key) {
    return this.executeCommand(
      async (client) => client.get(key),
      `Redis GET ${key}`
    );
  }

  /**
   * Delete keys with retry logic
   * @param {string|Array<string>} keys - Key(s) to delete
   * @returns {Promise} - Number of deleted keys
   */
  async del(keys) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    return this.executeCommand(
      async (client) => client.del(keyArray),
      `Redis DEL ${keyArray.join(', ')}`
    );
  }

  /**
   * Execute multiple Redis commands in a pipeline with retry logic
   * @param {Function} pipelineCallback - Function that builds pipeline commands
   * @param {string} operationName - Name for logging purposes
   * @returns {Promise<Array>} - Pipeline results
   */
  async executePipeline(pipelineCallback, operationName = 'Redis Pipeline') {
    return this.executeCommand(
      async (client) => {
        const pipeline = client.multi();
        await pipelineCallback(pipeline);
        return pipeline.exec();
      },
      operationName
    );
  }

  /**
   * Check if Redis is healthy
   * @returns {Promise<boolean>} - True if healthy
   */
  async isHealthy() {
    return this.connectionManager.checkRedisHealth(this.redis);
  }
}

/**
 * API call utilities with retry logic
 * Provides retry capabilities for external API calls
 */
class ApiUtils {
  constructor(options = {}) {
    this.retryManager = new RetryManager({
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 10000,
      backoffMultiplier: options.backoffMultiplier || 2,
      retryConditions: [
        // HTTP-specific retry conditions
        (error) => {
          // Retry on network errors
          if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return true;
          }

          // Retry on specific HTTP status codes
          const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
          if (error.response && retryableStatusCodes.includes(error.response.status)) {
            return true;
          }

          return false;
        }
      ],
      ...options
    });
  }

  /**
   * Make an HTTP request with retry logic
   * @param {Function} requestCallback - Function that makes the HTTP request
   * @param {string} operationName - Name for logging purposes
   * @returns {Promise} - Response data
   */
  async makeRequest(requestCallback, operationName = 'API Request') {
    return this.retryManager.executeWithRetry(
      requestCallback,
      operationName
    );
  }

  /**
   * Make a GET request with retry logic
   * @param {string} url - URL to request
   * @param {Object} config - Request configuration
   * @returns {Promise} - Response data
   */
  async get(url, config = {}) {
    const axios = require('axios');
    return this.makeRequest(
      () => axios.get(url, config),
      `GET ${url}`
    );
  }

  /**
   * Make a POST request with retry logic
   * @param {string} url - URL to request
   * @param {*} data - Request data
   * @param {Object} config - Request configuration
   * @returns {Promise} - Response data
   */
  async post(url, data, config = {}) {
    const axios = require('axios');
    return this.makeRequest(
      () => axios.post(url, data, config),
      `POST ${url}`
    );
  }
}

/**
 * File operation utilities with retry logic
 * Provides retry capabilities for file system operations
 */
class FileUtils {
  constructor(options = {}) {
    this.retryManager = new RetryManager({
      maxRetries: options.maxRetries || 2,
      baseDelay: options.baseDelay || 500,
      maxDelay: options.maxDelay || 5000,
      retryConditions: [
        // File system retry conditions
        (error) => {
          const retryableErrors = ['EBUSY', 'EMFILE', 'ENFILE', 'ENOENT'];
          return retryableErrors.includes(error.code);
        }
      ],
      ...options
    });
  }

  /**
   * Read file with retry logic
   * @param {string} filePath - Path to file
   * @param {Object} options - Read options
   * @returns {Promise} - File contents
   */
  async readFile(filePath, options = {}) {
    const fs = require('fs').promises;
    return this.retryManager.executeWithRetry(
      () => fs.readFile(filePath, options),
      `Read file ${filePath}`
    );
  }

  /**
   * Write file with retry logic
   * @param {string} filePath - Path to file
   * @param {*} data - Data to write
   * @param {Object} options - Write options
   * @returns {Promise} - Write result
   */
  async writeFile(filePath, data, options = {}) {
    const fs = require('fs').promises;
    return this.retryManager.executeWithRetry(
      () => fs.writeFile(filePath, data, options),
      `Write file ${filePath}`
    );
  }

  /**
   * Delete file with retry logic
   * @param {string} filePath - Path to file
   * @returns {Promise} - Delete result
   */
  async deleteFile(filePath) {
    const fs = require('fs').promises;
    return this.retryManager.executeWithRetry(
      () => fs.unlink(filePath),
      `Delete file ${filePath}`
    );
  }
}

module.exports = {
  DatabaseUtils,
  RedisUtils,
  ApiUtils,
  FileUtils
};
