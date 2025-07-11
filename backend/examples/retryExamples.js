const RetryManager = require('../utils/RetryManager');
const { DatabaseUtils, RedisUtils, ApiUtils, FileUtils } = require('../utils/RetryUtils');
const { getEnhancedConnections } = require('../utils/EnhancedServerConnections');
const logger = require('../utils/logger');

/**
 * Comprehensive examples of how to use the retry system
 * This file demonstrates various use cases and patterns
 */

// Example 1: Basic retry for any operation
async function basicRetryExample() {
  const retryManager = new RetryManager({
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2
  });

  try {
    const result = await retryManager.executeWithRetry(
      async () => {
        // Simulate an operation that might fail
        if (Math.random() < 0.7) {
          throw new Error('ECONNREFUSED');
        }
        return 'Operation succeeded!';
      },
      'Random Operation'
    );

    logger.info('Basic retry example succeeded', { result });
  } catch (error) {
    logger.error('Basic retry example failed', { error: error.message });
  }
}

// Example 2: Database operations with retry
async function databaseRetryExample(knexInstance) {
  const dbUtils = new DatabaseUtils(knexInstance);

  try {
    // Execute a query with retry logic
    const users = await dbUtils.executeQuery(
      async (knex) => knex('users').select('*').limit(10),
      'Fetch Users'
    );

    logger.info('Database query succeeded', { userCount: users.length });

    // Execute a transaction with retry logic
    const result = await dbUtils.executeTransaction(
      async (trx) => {
        const userId = await trx('users').insert({
          email: 'test@example.com',
          name: 'Test User'
        }).returning('id');

        await trx('profiles').insert({
          user_id: userId[0],
          bio: 'Test bio'
        });

        return userId[0];
      },
      'Create User with Profile'
    );

    logger.info('Database transaction succeeded', { userId: result });
  } catch (error) {
    logger.error('Database example failed', { error: error.message });
  }
}

// Example 3: Redis operations with retry
async function redisRetryExample(redisClient) {
  const redisUtils = new RedisUtils(redisClient);

  try {
    // Set a value with retry logic
    await redisUtils.set('test:key', 'test value', { ex: 3600 });
    logger.info('Redis SET operation succeeded');

    // Get a value with retry logic
    const value = await redisUtils.get('test:key');
    logger.info('Redis GET operation succeeded', { value });

    // Execute pipeline with retry logic
    const results = await redisUtils.executePipeline(
      async (pipeline) => {
        pipeline.set('key1', 'value1');
        pipeline.set('key2', 'value2');
        pipeline.get('key1');
        pipeline.get('key2');
      },
      'Redis Pipeline Operations'
    );

    logger.info('Redis pipeline succeeded', { results });
  } catch (error) {
    logger.error('Redis example failed', { error: error.message });
  }
}

// Example 4: API calls with retry
async function apiRetryExample() {
  const apiUtils = new ApiUtils({
    maxRetries: 3,
    baseDelay: 1000
  });

  try {
    // Make a GET request with retry logic
    const response = await apiUtils.get('https://jsonplaceholder.typicode.com/posts/1');
    logger.info('API GET request succeeded', { data: response.data });

    // Make a POST request with retry logic
    const postResponse = await apiUtils.post(
      'https://jsonplaceholder.typicode.com/posts',
      {
        title: 'Test Post',
        body: 'This is a test post',
        userId: 1
      }
    );

    logger.info('API POST request succeeded', { data: postResponse.data });
  } catch (error) {
    logger.error('API example failed', { error: error.message });
  }
}

// Example 5: File operations with retry
async function fileRetryExample() {
  const fileUtils = new FileUtils({
    maxRetries: 2,
    baseDelay: 500
  });

  try {
    // Write file with retry logic
    await fileUtils.writeFile(
      '/tmp/test-file.txt',
      'This is test content'
    );
    logger.info('File write operation succeeded');

    // Read file with retry logic
    const content = await fileUtils.readFile('/tmp/test-file.txt', 'utf8');
    logger.info('File read operation succeeded', { content });

    // Delete file with retry logic
    await fileUtils.deleteFile('/tmp/test-file.txt');
    logger.info('File delete operation succeeded');
  } catch (error) {
    logger.error('File example failed', { error: error.message });
  }
}

// Example 6: Custom retry conditions
async function customRetryConditionsExample() {
  const customRetryManager = new RetryManager({
    maxRetries: 5,
    baseDelay: 1000,
    retryConditions: [
      // Custom condition: retry only on specific error codes
      (error) => {
        const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
        return retryableCodes.includes(error.code);
      },
      // Custom condition: retry on HTTP 5xx errors
      (error) => {
        return error.response && error.response.status >= 500;
      },
      // Custom condition: retry on business logic errors
      (error) => {
        return error.message.includes('temporary failure');
      }
    ],
    onRetry: (attempt, operationName, error, context) => {
      logger.warn(`Custom retry attempt ${attempt} for ${operationName}`, {
        error: error.message,
        context
      });
    },
    onFinalFailure: (totalAttempts, operationName, finalError, context) => {
      logger.error(`Custom operation ${operationName} failed permanently`, {
        totalAttempts,
        finalError: finalError.message,
        context
      });
    }
  });

  try {
    const result = await customRetryManager.executeWithRetry(
      async () => {
        // Simulate different types of failures
        const randomError = Math.random();
        if (randomError < 0.3) {
          const error = new Error('Connection failed');
          error.code = 'ECONNREFUSED';
          throw error;
        } else if (randomError < 0.6) {
          const error = new Error('Request failed');
          error.response = { status: 500 };
          throw error;
        } else if (randomError < 0.8) {
          throw new Error('Temporary failure in processing');
        } else {
          return 'Success after custom retry logic!';
        }
      },
      'Custom Retry Operation',
      { userId: 123, requestId: 'req-456' }
    );

    logger.info('Custom retry example succeeded', { result });
  } catch (error) {
    logger.error('Custom retry example failed', { error: error.message });
  }
}

// Example 7: Connection initialization with retry
async function connectionInitializationExample() {
  const enhancedConnections = getEnhancedConnections();

  try {
    // Initialize database with retry logic
    const knexConfig = {
      client: 'postgresql',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'sayarat',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password'
      }
    };

    const _knexInstance = await enhancedConnections.initializeDatabase(knexConfig);
    logger.info('Database initialized with retry logic');

    // Initialize Redis with retry logic
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const _redisClient = await enhancedConnections.initializeRedis(redisUrl);
    logger.info('Redis initialized with retry logic');

    // Perform health checks
    const healthResults = await enhancedConnections.performHealthChecks();
    logger.info('Health check results', { healthResults });

  } catch (error) {
    logger.error('Connection initialization failed', { error: error.message });
  }
}

// Example 8: Express middleware with retry logic
function createRetryMiddlewareExample() {
  const enhancedConnections = getEnhancedConnections();

  // Database middleware
  const dbMiddleware = enhancedConnections.createDatabaseMiddleware();

  // Redis middleware  
  const redisMiddleware = enhancedConnections.createRedisMiddleware();

  // Custom middleware that uses retry logic
  const customRetryMiddleware = (req, res, next) => {
    const retryManager = new RetryManager({
      maxRetries: 2,
      baseDelay: 500
    });

    // Add retry manager to request for use in route handlers
    req.retryManager = retryManager;
    next();
  };

  return {
    dbMiddleware,
    redisMiddleware,
    customRetryMiddleware
  };
}

// Example 9: Graceful shutdown with retry logic
async function gracefulShutdownExample(server, knexInstance, redisClient) {
  const shutdownRetryManager = new RetryManager({
    maxRetries: 3,
    baseDelay: 1000,
    retryConditions: [() => true] // Always retry shutdown operations
  });

  const gracefulShutdown = async () => {
    logger.info('Starting graceful shutdown...');

    try {
      // Close server with retry logic
      await shutdownRetryManager.executeWithRetry(
        () => new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        }),
        'Server Close'
      );

      // Close database connection with retry logic
      if (knexInstance) {
        await shutdownRetryManager.executeWithRetry(
          () => knexInstance.destroy(),
          'Database Close'
        );
      }

      // Close Redis connection with retry logic
      if (redisClient) {
        await shutdownRetryManager.executeWithRetry(
          () => redisClient.quit(),
          'Redis Close'
        );
      }

      logger.info('Graceful shutdown completed');
      throw new Error('Server shutdown completed');
    } catch (error) {
      logger.error('Graceful shutdown failed', { error: error.message });
      throw new Error('Server shutdown failed');
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// Export examples for use in other files
module.exports = {
  basicRetryExample,
  databaseRetryExample,
  redisRetryExample,
  apiRetryExample,
  fileRetryExample,
  customRetryConditionsExample,
  connectionInitializationExample,
  createRetryMiddlewareExample,
  gracefulShutdownExample
};

// #TODO: Add more specific examples for your application's use cases
// #TODO: Consider creating a monitoring system that tracks retry patterns
// #TODO: Implement circuit breaker pattern for frequently failing operations
