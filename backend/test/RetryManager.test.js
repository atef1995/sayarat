const RetryManager = require('../utils/RetryManager');

describe('RetryManager', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Mock console methods to avoid cluttering test output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const retryManager = new RetryManager();

      expect(retryManager.maxRetries).toBe(3);
      expect(retryManager.baseDelay).toBe(1000);
      expect(retryManager.maxDelay).toBe(30000);
      expect(retryManager.backoffMultiplier).toBe(2);
      expect(retryManager.jitter).toBe(true);
    });

    it('should create instance with custom options', () => {
      const options = {
        maxRetries: 5,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 1.5,
        jitter: false
      };

      const retryManager = new RetryManager(options);

      expect(retryManager.maxRetries).toBe(5);
      expect(retryManager.baseDelay).toBe(2000);
      expect(retryManager.maxDelay).toBe(60000);
      expect(retryManager.backoffMultiplier).toBe(1.5);
      expect(retryManager.jitter).toBe(false);
    });

    it('should throw error for invalid configuration', () => {
      expect(() => new RetryManager({ maxRetries: -1 })).toThrow('maxRetries must be non-negative');
      expect(() => new RetryManager({ baseDelay: 0 })).toThrow('baseDelay must be positive');
      expect(() => new RetryManager({ maxDelay: -1 })).toThrow('maxDelay must be positive');
      expect(() => new RetryManager({ backoffMultiplier: 0 })).toThrow('backoffMultiplier must be positive');
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const retryManager = new RetryManager({ maxRetries: 3 });
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(mockOperation, 'Test Operation');

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const retryManager = new RetryManager({
        maxRetries: 3,
        baseDelay: 10 // Very short delay for testing
      });
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(mockOperation, 'Test Operation');

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after exhausting all retries', async () => {
      const retryManager = new RetryManager({
        maxRetries: 2,
        baseDelay: 10
      });
      const mockOperation = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(retryManager.executeWithRetry(mockOperation, 'Test Operation'))
        .rejects.toThrow('Test Operation failed after 3 attempts');

      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const retryManager = new RetryManager({
        maxRetries: 3,
        baseDelay: 10
      });
      const mockOperation = jest.fn().mockRejectedValue(new Error('Invalid input'));

      await expect(retryManager.executeWithRetry(mockOperation, 'Test Operation'))
        .rejects.toThrow('Test Operation failed after 1 attempts');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect custom retry conditions', async () => {
      const customRetryCondition = jest.fn().mockReturnValue(true);
      const retryManager = new RetryManager({
        maxRetries: 2,
        baseDelay: 10,
        retryConditions: [customRetryCondition]
      });
      const mockOperation = jest.fn().mockRejectedValue(new Error('Custom error'));

      await expect(retryManager.executeWithRetry(mockOperation, 'Test Operation'))
        .rejects.toThrow('Test Operation failed after 3 attempts');

      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(customRetryCondition).toHaveBeenCalledWith(expect.any(Error), expect.any(Number));
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const retryManager = new RetryManager({
        maxRetries: 2,
        baseDelay: 10,
        onRetry
      });
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success');

      await retryManager.executeWithRetry(mockOperation, 'Test Operation');

      expect(onRetry).toHaveBeenCalledWith(1, 'Test Operation', expect.any(Error), {});
    });

    it('should call onFinalFailure callback', async () => {
      const onFinalFailure = jest.fn();
      const retryManager = new RetryManager({
        maxRetries: 1,
        baseDelay: 10,
        onFinalFailure
      });
      const mockOperation = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(retryManager.executeWithRetry(mockOperation, 'Test Operation'))
        .rejects.toThrow();

      expect(onFinalFailure).toHaveBeenCalledWith(2, 'Test Operation', expect.any(Error), {});
    });
  });

  describe('_calculateDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const retryManager = new RetryManager({
        baseDelay: 1000,
        backoffMultiplier: 2,
        jitter: false
      });

      expect(retryManager._calculateDelay(1)).toBe(1000);
      expect(retryManager._calculateDelay(2)).toBe(2000);
      expect(retryManager._calculateDelay(3)).toBe(4000);
    });

    it('should respect maximum delay', () => {
      const retryManager = new RetryManager({
        baseDelay: 1000,
        maxDelay: 3000,
        backoffMultiplier: 2,
        jitter: false
      });

      expect(retryManager._calculateDelay(3)).toBe(3000);
      expect(retryManager._calculateDelay(4)).toBe(3000);
    });

    it('should add jitter when enabled', () => {
      const retryManager = new RetryManager({
        baseDelay: 1000,
        backoffMultiplier: 2,
        jitter: true
      });

      const delay1 = retryManager._calculateDelay(1);
      const delay2 = retryManager._calculateDelay(1);

      // With jitter, delays should be different
      expect(delay1).toBeGreaterThan(0);
      expect(delay2).toBeGreaterThan(0);
      // Both should be within reasonable range of base delay
      expect(delay1).toBeGreaterThan(500);
      expect(delay1).toBeLessThan(1500);
    });
  });

  describe('_defaultRetryCondition', () => {
    let retryManager;

    beforeEach(() => {
      retryManager = new RetryManager();
    });

    it('should return true for retryable errors', () => {
      const retryableErrors = [
        new Error('ECONNREFUSED'),
        new Error('ENOTFOUND'),
        new Error('ETIMEDOUT'),
        new Error('Connection reset'),
        new Error('Socket hang up'),
        new Error('Network timeout'),
        new Error('Service unavailable'),
        new Error('Internal server error')
      ];

      retryableErrors.forEach(error => {
        expect(retryManager._defaultRetryCondition(error)).toBe(true);
      });
    });

    it('should return false for non-retryable errors', () => {
      const nonRetryableErrors = [
        new Error('Invalid input'),
        new Error('Unauthorized'),
        new Error('Not found'),
        new Error('Bad request')
      ];

      nonRetryableErrors.forEach(error => {
        expect(retryManager._defaultRetryCondition(error)).toBe(false);
      });
    });
  });

  describe('static factory methods', () => {
    describe('forDatabase', () => {
      it('should create RetryManager with database-specific configuration', () => {
        const dbRetryManager = RetryManager.forDatabase();

        expect(dbRetryManager.maxRetries).toBe(5);
        expect(dbRetryManager.baseDelay).toBe(2000);
        expect(dbRetryManager.maxDelay).toBe(30000);
        expect(dbRetryManager.backoffMultiplier).toBe(1.5);
      });

      it('should accept custom options', () => {
        const dbRetryManager = RetryManager.forDatabase({ maxRetries: 10 });

        expect(dbRetryManager.maxRetries).toBe(10);
        expect(dbRetryManager.baseDelay).toBe(2000); // Default preserved
      });

      it('should have database-specific retry conditions', () => {
        const dbRetryManager = RetryManager.forDatabase();

        const dbError = new Error('connection terminated');
        expect(dbRetryManager._shouldRetry(dbError, 0)).toBe(true);

        const nonDbError = new Error('syntax error');
        expect(dbRetryManager._shouldRetry(nonDbError, 0)).toBe(false);
      });
    });

    describe('forRedis', () => {
      it('should create RetryManager with Redis-specific configuration', () => {
        const redisRetryManager = RetryManager.forRedis();

        expect(redisRetryManager.maxRetries).toBe(3);
        expect(redisRetryManager.baseDelay).toBe(1000);
        expect(redisRetryManager.maxDelay).toBe(10000);
        expect(redisRetryManager.backoffMultiplier).toBe(2);
      });

      it('should accept custom options', () => {
        const redisRetryManager = RetryManager.forRedis({ maxRetries: 5 });

        expect(redisRetryManager.maxRetries).toBe(5);
        expect(redisRetryManager.baseDelay).toBe(1000); // Default preserved
      });

      it('should have Redis-specific retry conditions', () => {
        const redisRetryManager = RetryManager.forRedis();

        const redisError = new Error('Redis unavailable');
        expect(redisRetryManager._shouldRetry(redisError, 0)).toBe(true);

        const nonRedisError = new Error('Invalid command');
        expect(redisRetryManager._shouldRetry(nonRedisError, 0)).toBe(false);
      });
    });
  });

  describe('error scenarios', () => {
    it('should handle errors without message property', async () => {
      const retryManager = new RetryManager({ maxRetries: 1, baseDelay: 10 });
      const mockOperation = jest.fn().mockRejectedValue({ code: 'UNKNOWN' });

      await expect(retryManager.executeWithRetry(mockOperation, 'Test Operation'))
        .rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle async operation that throws synchronously', async () => {
      const retryManager = new RetryManager({ maxRetries: 2, baseDelay: 10 });
      const mockOperation = jest.fn().mockImplementation(() => {
        throw new Error('ECONNREFUSED');
      });

      await expect(retryManager.executeWithRetry(mockOperation, 'Test Operation'))
        .rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(3);
    });
  });
});
