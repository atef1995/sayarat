const logger = require('./logger');

/**
 * A configurable retry manager that can be used for any connection or operation
 * Follows Single Responsibility Principle and Open/Closed Principle
 */
class RetryManager {
  /**
   * @param {Object} options - Configuration options for retry behavior
   * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
   * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 30000)
   * @param {number} options.backoffMultiplier - Multiplier for exponential backoff (default: 2)
   * @param {boolean} options.jitter - Add random jitter to delays (default: true)
   * @param {Array<Function>} options.retryConditions - Array of functions that determine if retry should happen
   * @param {Function} options.onRetry - Callback executed before each retry
   * @param {Function} options.onFinalFailure - Callback executed when all retries are exhausted
   */
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitter = options.jitter !== false; // Default to true
    this.retryConditions = options.retryConditions || [this._defaultRetryCondition.bind(this)];
    this.onRetry = options.onRetry || this._defaultOnRetry.bind(this);
    this.onFinalFailure = options.onFinalFailure || this._defaultOnFinalFailure.bind(this);

    // Validate configuration
    this._validateConfig();
  }

  /**
   * Execute an operation with retry logic
   * @param {Function} operation - The operation to execute (should return a Promise)
   * @param {string} operationName - Name for logging purposes
   * @param {Object} context - Additional context passed to callbacks
   * @returns {Promise} - Resolves with operation result or rejects after all retries
   */
  async executeWithRetry(operation, operationName = 'Operation', context = {}) {
    let lastError;
    let attempt = 0;

    for (attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await this._delay(this._calculateDelay(attempt));
          this.onRetry(attempt, operationName, lastError, context);
        }

        const result = await operation();

        if (attempt > 0) {
          logger.info(`${operationName}: Succeeded on retry attempt ${attempt + 1}`, {
            attempt: attempt + 1,
            operationName
          });
        }

        return result;
      } catch (error) {
        lastError = error;

        logger.warn(`${operationName}: Attempt ${attempt + 1} failed`, {
          attempt: attempt + 1,
          error: error.message,
          operationName
        });

        // Check if we should retry based on retry conditions
        const shouldRetry = this._shouldRetry(error, attempt);

        if (!shouldRetry || attempt === this.maxRetries) {
          break;
        }
      }
    }

    // All retries exhausted
    this.onFinalFailure(attempt, operationName, lastError, context);

    logger.error(`${operationName}: All retry attempts exhausted`, {
      totalAttempts: attempt + 1,
      finalError: lastError.message,
      operationName
    });

    throw new Error(`${operationName} failed after ${attempt + 1} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Calculate delay for exponential backoff with optional jitter
   * @param {number} attempt - Current attempt number (1-based)
   * @returns {number} - Delay in milliseconds
   */
  _calculateDelay(attempt) {
    // Calculate exponential backoff delay
    let delay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt - 1);

    // Cap at maximum delay
    delay = Math.min(delay, this.maxDelay);

    // Add jitter if enabled (±25% random variation)
    if (this.jitter) {
      const jitterRange = delay * 0.25;
      const jitterOffset = (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.max(0, delay + jitterOffset);
    }

    return Math.floor(delay);
  }

  /**
   * Check if retry should be attempted based on configured conditions
   * @param {Error} error - The error that occurred
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {boolean} - Whether to retry
   */
  _shouldRetry(error, attempt) {
    // Don't retry if we've reached max attempts
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Check all retry conditions
    return this.retryConditions.some(condition => condition(error, attempt));
  }

  /**
   * Default retry condition - retry on network and temporary errors
   * @param {Error} error - The error that occurred
   * @returns {boolean} - Whether to retry
   */
  _defaultRetryCondition(error) {
    // Common retryable error patterns
    const retryablePatterns = [
      /ECONNREFUSED/i,
      /ENOTFOUND/i,
      /ETIMEDOUT/i,
      /ECONNRESET/i,
      /EPIPE/i,
      /socket hang up/i,
      /network timeout/i,
      /connection.*reset/i,
      /connection.*refused/i,
      /temporary failure/i,
      /service unavailable/i,
      /internal server error/i
    ];

    const errorMessage = error.message || '';
    return retryablePatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Default callback executed before each retry
   * @param {number} attempt - Current retry attempt number (1-based)
   * @param {string} operationName - Name of the operation
   * @param {Error} error - The error that caused the retry
   * @param {Object} context - Additional context
   */
  _defaultOnRetry(attempt, operationName, error, context) {
    logger.info(`Retrying ${operationName} (attempt ${attempt + 1}/${this.maxRetries + 1})`, {
      attempt: attempt + 1,
      error: error.message,
      operationName,
      context
    });
  }

  /**
   * Default callback executed when all retries are exhausted
   * @param {number} totalAttempts - Total number of attempts made
   * @param {string} operationName - Name of the operation
   * @param {Error} finalError - The final error
   * @param {Object} context - Additional context
   */
  _defaultOnFinalFailure(totalAttempts, operationName, finalError, context) {
    logger.error(`${operationName} failed permanently after ${totalAttempts} attempts`, {
      totalAttempts,
      finalError: finalError.message,
      operationName,
      context
    });
  }

  /**
   * Create a delay using Promise
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after the delay
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate configuration parameters
   * @throws {Error} - If configuration is invalid
   */
  _validateConfig() {
    if (this.maxRetries < 0) {
      throw new Error('maxRetries must be non-negative');
    }
    if (this.baseDelay <= 0) {
      throw new Error('baseDelay must be positive');
    }
    if (this.maxDelay <= 0) {
      throw new Error('maxDelay must be positive');
    }
    if (this.backoffMultiplier <= 0) {
      throw new Error('backoffMultiplier must be positive');
    }
    if (!Array.isArray(this.retryConditions)) {
      throw new Error('retryConditions must be an array of functions');
    }
  }

  /**
   * Create a specialized retry manager for database operations
   * @param {Object} customOptions - Additional options to override defaults
   * @returns {RetryManager} - Configured retry manager for database operations
   */
  static forDatabase(customOptions = {}) {
    const dbRetryConditions = [
      // Database-specific retry conditions
      (error) => {
        const dbErrorPatterns = [
          /connection.*terminated/i,
          /connection.*lost/i,
          /connection.*reset/i,
          /connection.*refused/i,
          /pool.*exhausted/i,
          /timeout.*acquiring.*connection/i,
          /database.*unavailable/i,
          /lock.*timeout/i,
          /deadlock/i
        ];

        const errorMessage = error.message || '';
        return dbErrorPatterns.some(pattern => pattern.test(errorMessage));
      }
    ];

    return new RetryManager({
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 1.5,
      retryConditions: dbRetryConditions,
      ...customOptions
    });
  }

  /**
   * Create a specialized retry manager for Redis operations
   * @param {Object} customOptions - Additional options to override defaults
   * @returns {RetryManager} - Configured retry manager for Redis operations
   */
  static forRedis(customOptions = {}) {
    const redisRetryConditions = [
      // Redis-specific retry conditions
      (error) => {
        const redisErrorPatterns = [
          /connection.*refused/i,
          /connection.*lost/i,
          /connection.*reset/i,
          /redis.*unavailable/i,
          /cluster.*down/i,
          /loading.*redis/i,
          /master.*down/i,
          /replica.*not.*ready/i
        ];

        const errorMessage = error.message || '';
        return redisErrorPatterns.some(pattern => pattern.test(errorMessage));
      }
    ];

    return new RetryManager({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryConditions: redisRetryConditions,
      ...customOptions
    });
  }
}

module.exports = RetryManager;
