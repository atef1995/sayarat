const { getConnectionManager } = require('./ConnectionManager');
const { DatabaseUtils, RedisUtils } = require('./RetryUtils');
const logger = require('./logger');

/**
 * Enhanced database and Redis initialization with retry logic
 * Integrates retry capabilities into existing server infrastructure
 */
class EnhancedServerConnections {
  constructor() {
    this.connectionManager = getConnectionManager();
    this.dbUtils = null;
    this.redisUtils = null;
  }

  /**
   * Initialize database connection with retry logic
   * @param {Object} knexConfig - Knex configuration
   * @returns {Promise<Object>} - Knex instance
   */
  async initializeDatabase(knexConfig) {
    const connectionFactory = this.connectionManager.createKnexConnectionFactory(knexConfig);

    try {
      const knexInstance = await this.connectionManager.connectToDatabase(
        connectionFactory,
        { name: 'Primary Database Connection' }
      );

      // Create database utilities instance
      this.dbUtils = new DatabaseUtils(knexInstance);

      logger.info('Database initialized successfully with retry capabilities');
      return knexInstance;
    } catch (error) {
      logger.error('Failed to initialize database after all retries', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize Redis connection with retry logic
   * @param {string|Object} redisConfig - Redis configuration
   * @returns {Promise<Object>} - Redis client instance
   */
  async initializeRedis(redisConfig) {
    const config = typeof redisConfig === 'string' ? { url: redisConfig } : redisConfig;
    const connectionFactory = this.connectionManager.createRedisConnectionFactory(config);

    try {
      const redisClient = await this.connectionManager.connectToRedis(
        connectionFactory,
        { name: 'Primary Redis Connection' }
      );

      // Create Redis utilities instance
      this.redisUtils = new RedisUtils(redisClient);

      logger.info('Redis initialized successfully with retry capabilities');
      return redisClient;
    } catch (error) {
      logger.error('Failed to initialize Redis after all retries', { error: error.message });
      throw error;
    }
  }

  /**
   * Get database utilities instance
   * @returns {DatabaseUtils} - Database utilities with retry logic
   */
  getDatabaseUtils() {
    if (!this.dbUtils) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return this.dbUtils;
  }

  /**
   * Get Redis utilities instance
   * @returns {RedisUtils} - Redis utilities with retry logic
   */
  getRedisUtils() {
    if (!this.redisUtils) {
      throw new Error('Redis not initialized. Call initializeRedis() first.');
    }
    return this.redisUtils;
  }

  /**
   * Perform health checks on all connections
   * @returns {Promise<Object>} - Health check results
   */
  async performHealthChecks() {
    const results = {
      database: false,
      redis: false,
      timestamp: new Date().toISOString()
    };

    try {
      if (this.dbUtils) {
        results.database = await this.dbUtils.isHealthy();
      }
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
    }

    try {
      if (this.redisUtils) {
        results.redis = await this.redisUtils.isHealthy();
      }
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
    }

    return results;
  }

  /**
   * Example: Enhanced session store setup with retry logic
   * @param {Object} session - Express session middleware
   * @param {Object} redisClient - Redis client instance
   * @returns {Object} - Session configuration with Redis store
   */
  createEnhancedSessionConfig(session, redisClient) {
    const { RedisStore } = require('connect-redis');

    // Wrap Redis store operations with retry logic
    const enhancedRedisStore = new RedisStore({
      client: redisClient,
      // Add custom error handling
      logErrors: (error) => {
        logger.error('Redis session store error', { error: error.message });

        // #TODO: Consider implementing automatic reconnection logic here
        // if the error indicates a connection issue
      }
    });

    return {
      store: enhancedRedisStore,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.SECURE_COOKIES === 'true',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      }
    };
  }

  /**
   * Example: Database middleware that uses retry logic
   * @returns {Function} - Express middleware function
   */
  createDatabaseMiddleware() {
    return async (req, res, next) => {
      if (!this.dbUtils) {
        return res.status(500).json({ error: 'Database not available' });
      }

      // Add database utilities to request object
      req.dbUtils = this.dbUtils;

      // Perform a quick health check
      try {
        const isHealthy = await this.dbUtils.isHealthy();
        if (!isHealthy) {
          logger.warn('Database health check failed in middleware');
          return res.status(503).json({ error: 'Database temporarily unavailable' });
        }
      } catch (error) {
        logger.error('Database middleware health check error', { error: error.message });
        return res.status(503).json({ error: 'Database temporarily unavailable' });
      }

      next();
    };
  }

  /**
   * Example: Redis middleware that uses retry logic
   * @returns {Function} - Express middleware function
   */
  createRedisMiddleware() {
    return async (req, res, next) => {
      if (!this.redisUtils) {
        return res.status(500).json({ error: 'Redis not available' });
      }

      // Add Redis utilities to request object
      req.redisUtils = this.redisUtils;

      // Perform a quick health check
      try {
        const isHealthy = await this.redisUtils.isHealthy();
        if (!isHealthy) {
          logger.warn('Redis health check failed in middleware');
          // Redis issues shouldn't block requests, just log the warning
        }
      } catch (error) {
        logger.error('Redis middleware health check error', { error: error.message });
        // Continue anyway, Redis issues shouldn't block requests
      }

      next();
    };
  }
}

// Singleton instance
let enhancedConnections = null;

/**
 * Get singleton instance of EnhancedServerConnections
 * @returns {EnhancedServerConnections} - Singleton instance
 */
function getEnhancedConnections() {
  if (!enhancedConnections) {
    enhancedConnections = new EnhancedServerConnections();
  }
  return enhancedConnections;
}

module.exports = {
  EnhancedServerConnections,
  getEnhancedConnections
};
