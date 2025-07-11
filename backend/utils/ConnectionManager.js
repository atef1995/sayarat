const RetryManager = require('./RetryManager');
const logger = require('./logger');

/**
 * Connection manager that provides retry logic for various connection types
 * Follows Single Responsibility Principle and Dependency Injection patterns
 */
class ConnectionManager {
  constructor() {
    // Initialize retry managers for different connection types
    this.dbRetryManager = RetryManager.forDatabase();
    this.redisRetryManager = RetryManager.forRedis();
    this.customRetryManager = new RetryManager(); // For general use
  }

  /**
   * Connect to database with retry logic
   * @param {Function} connectionFactory - Function that returns a database connection promise
   * @param {Object} options - Connection options
   * @returns {Promise} - Database connection
   */
  async connectToDatabase(connectionFactory, options = {}) {
    const operationName = options.name || 'Database Connection';
    const context = { type: 'database', ...options };

    return this.dbRetryManager.executeWithRetry(
      connectionFactory,
      operationName,
      context
    );
  }

  /**
   * Connect to Redis with retry logic
   * @param {Function} connectionFactory - Function that returns a Redis connection promise
   * @param {Object} options - Connection options
   * @returns {Promise} - Redis connection
   */
  async connectToRedis(connectionFactory, options = {}) {
    const operationName = options.name || 'Redis Connection';
    const context = { type: 'redis', ...options };

    return this.redisRetryManager.executeWithRetry(
      connectionFactory,
      operationName,
      context
    );
  }

  /**
   * Execute any operation with custom retry logic
   * @param {Function} operation - Operation to execute
   * @param {Object} retryOptions - Custom retry configuration
   * @param {string} operationName - Name for logging
   * @returns {Promise} - Operation result
   */
  async executeWithCustomRetry(operation, retryOptions = {}, operationName = 'Custom Operation') {
    const customManager = new RetryManager(retryOptions);
    return customManager.executeWithRetry(operation, operationName);
  }

  /**
   * Create a database connection factory for Knex
   * @param {Object} knexConfig - Knex configuration object
   * @returns {Function} - Connection factory function
   */
  createKnexConnectionFactory(knexConfig) {
    return async () => {
      const knex = require('knex')(knexConfig);

      // Test the connection
      await knex.raw('SELECT 1');

      logger.info('Database connection established successfully', {
        database: knexConfig.connection?.database || 'unknown'
      });

      return knex;
    };
  }

  /**
   * Create a Redis connection factory
   * @param {Object} redisConfig - Redis configuration object
   * @returns {Function} - Connection factory function
   */
  createRedisConnectionFactory(redisConfig) {
    return async () => {
      const { createClient } = require('redis');

      const client = createClient(redisConfig);

      // Connect and test
      await client.connect();
      await client.ping();

      logger.info('Redis connection established successfully', {
        url: redisConfig.url || 'default'
      });

      return client;
    };
  }

  /**
   * Execute database operation with retry logic
   * @param {Object} knexInstance - Knex database instance
   * @param {Function} operation - Database operation to execute
   * @param {string} operationName - Name for logging
   * @returns {Promise} - Operation result
   */
  async executeDbOperation(knexInstance, operation, operationName = 'Database Operation') {
    const dbOperation = async () => {
      try {
        return await operation(knexInstance);
      } catch (error) {
        // Check if it's a connection issue that requires reconnection
        if (this._isConnectionError(error)) {
          // Test connection and reconnect if needed
          await knexInstance.raw('SELECT 1');
        }
        throw error;
      }
    };

    return this.dbRetryManager.executeWithRetry(
      dbOperation,
      operationName,
      { type: 'database_operation' }
    );
  }

  /**
   * Execute Redis operation with retry logic
   * @param {Object} redisClient - Redis client instance
   * @param {Function} operation - Redis operation to execute
   * @param {string} operationName - Name for logging
   * @returns {Promise} - Operation result
   */
  async executeRedisOperation(redisClient, operation, operationName = 'Redis Operation') {
    const redisOperation = async () => {
      try {
        return await operation(redisClient);
      } catch (error) {
        // Check if it's a connection issue that requires reconnection
        if (this._isRedisConnectionError(error)) {
          // Test connection and reconnect if needed
          if (!redisClient.isOpen) {
            await redisClient.connect();
          }
          await redisClient.ping();
        }
        throw error;
      }
    };

    return this.redisRetryManager.executeWithRetry(
      redisOperation,
      operationName,
      { type: 'redis_operation' }
    );
  }

  /**
   * Check if error is a database connection error
   * @param {Error} error - Error to check
   * @returns {boolean} - True if it's a connection error
   * @private
   */
  _isConnectionError(error) {
    const connectionErrorPatterns = [
      /connection.*terminated/i,
      /connection.*lost/i,
      /connection.*reset/i,
      /connection.*refused/i
    ];

    const errorMessage = error.message || '';
    return connectionErrorPatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Check if error is a Redis connection error
   * @param {Error} error - Error to check
   * @returns {boolean} - True if it's a connection error
   * @private
   */
  _isRedisConnectionError(error) {
    const redisConnectionErrorPatterns = [
      /connection.*refused/i,
      /connection.*lost/i,
      /connection.*reset/i,
      /socket.*closed/i
    ];

    const errorMessage = error.message || '';
    return redisConnectionErrorPatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Health check for database connection
   * @param {Object} knexInstance - Knex database instance
   * @returns {Promise<boolean>} - True if healthy
   */
  async checkDatabaseHealth(knexInstance) {
    try {
      await this.executeDbOperation(
        knexInstance,
        async (knex) => knex.raw('SELECT 1'),
        'Database Health Check'
      );
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Health check for Redis connection
   * @param {Object} redisClient - Redis client instance
   * @returns {Promise<boolean>} - True if healthy
   */
  async checkRedisHealth(redisClient) {
    try {
      await this.executeRedisOperation(
        redisClient,
        async (client) => client.ping(),
        'Redis Health Check'
      );
      return true;
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
      return false;
    }
  }
}

// Singleton instance
let connectionManager = null;

/**
 * Get singleton instance of ConnectionManager
 * @returns {ConnectionManager} - Singleton instance
 */
function getConnectionManager() {
  if (!connectionManager) {
    connectionManager = new ConnectionManager();
  }
  return connectionManager;
}

module.exports = {
  ConnectionManager,
  getConnectionManager
};
