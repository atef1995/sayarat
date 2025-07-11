# Retry System Documentation

This document explains how to use the comprehensive retry system implemented for handling connection failures and temporary errors in the application.

## Overview

The retry system consists of several modular components that follow SOLID principles and provide robust error handling capabilities:

- **RetryManager**: Core retry logic with configurable parameters
- **ConnectionManager**: Specialized connection handling with retry logic
- **DatabaseUtils**: Database operations with built-in retry capabilities
- **RedisUtils**: Redis operations with built-in retry capabilities
- **ApiUtils**: HTTP API calls with retry logic
- **FileUtils**: File system operations with retry logic
- **EnhancedServerConnections**: High-level server connection management

## Core Components

### RetryManager

The `RetryManager` class is the foundation of the retry system. It provides configurable retry logic that can be applied to any operation.

#### Basic Usage

```javascript
const RetryManager = require('./utils/RetryManager');

const retryManager = new RetryManager({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true
});

const result = await retryManager.executeWithRetry(async () => {
  // Your operation here
  return await someOperation();
}, 'Operation Name');
```

#### Configuration Options

- `maxRetries`: Maximum number of retry attempts (default: 3)
- `baseDelay`: Base delay in milliseconds (default: 1000)
- `maxDelay`: Maximum delay in milliseconds (default: 30000)
- `backoffMultiplier`: Multiplier for exponential backoff (default: 2)
- `jitter`: Add random jitter to delays (default: true)
- `retryConditions`: Array of functions that determine retry eligibility
- `onRetry`: Callback executed before each retry
- `onFinalFailure`: Callback executed when all retries are exhausted

#### Specialized Factory Methods

```javascript
// For database operations
const dbRetryManager = RetryManager.forDatabase();

// For Redis operations
const redisRetryManager = RetryManager.forRedis();
```

### DatabaseUtils

Provides database operations with built-in retry logic.

```javascript
const { DatabaseUtils } = require('./utils/RetryUtils');

const dbUtils = new DatabaseUtils(knexInstance);

// Execute query with retry
const users = await dbUtils.executeQuery(async knex => knex('users').select('*').limit(10), 'Fetch Users');

// Execute transaction with retry
const result = await dbUtils.executeTransaction(async trx => {
  const userId = await trx('users').insert({ email: 'test@example.com' });
  return userId[0];
}, 'Create User');
```

### RedisUtils

Provides Redis operations with built-in retry logic.

```javascript
const { RedisUtils } = require('./utils/RetryUtils');

const redisUtils = new RedisUtils(redisClient);

// Set value with retry
await redisUtils.set('key', 'value', { ex: 3600 });

// Get value with retry
const value = await redisUtils.get('key');

// Execute pipeline with retry
const results = await redisUtils.executePipeline(async pipeline => {
  pipeline.set('key1', 'value1');
  pipeline.get('key1');
}, 'Redis Pipeline');
```

### EnhancedServerConnections

High-level connection management with retry capabilities.

```javascript
const { getEnhancedConnections } = require('./utils/EnhancedServerConnections');

const enhancedConnections = getEnhancedConnections();

// Initialize database with retry
const knexInstance = await enhancedConnections.initializeDatabase(knexConfig);

// Initialize Redis with retry
const redisClient = await enhancedConnections.initializeRedis(redisUrl);

// Perform health checks
const healthResults = await enhancedConnections.performHealthChecks();
```

## Integration Examples

### Server Initialization

```javascript
// In server.js
const { getEnhancedConnections } = require('./utils/EnhancedServerConnections');

const enhancedConnections = getEnhancedConnections();

// Initialize Redis with retry logic
let redisClient;
(async () => {
  try {
    redisClient = await enhancedConnections.initializeRedis(redisUrl);
    logger.info('Redis client initialized with retry capabilities');
  } catch (error) {
    logger.error('Failed to initialize Redis client with retries', { error: error.message });
    // Fallback logic here
  }
})();
```

### Express Middleware

```javascript
// Database middleware with retry logic
const dbMiddleware = enhancedConnections.createDatabaseMiddleware();
const redisMiddleware = enhancedConnections.createRedisMiddleware();

app.use(dbMiddleware);
app.use(redisMiddleware);
```

### Route Handlers

```javascript
app.get('/api/users', async (req, res) => {
  try {
    const users = await req.dbUtils.executeQuery(async knex => knex('users').select('*'), 'Fetch All Users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
```

### Health Checks

```javascript
app.get('/health/detailed', async (req, res) => {
  try {
    const healthResults = await enhancedConnections.performHealthChecks();
    const overallStatus = healthResults.database && healthResults.redis ? 'healthy' : 'degraded';
    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      connections: healthResults
    });
  } catch (error) {
    res.status(503).json({ status: 'error', error: 'Health check failed' });
  }
});
```

## Custom Retry Conditions

You can define custom retry conditions for specific error patterns:

```javascript
const customRetryManager = new RetryManager({
  maxRetries: 5,
  retryConditions: [
    // Retry on specific error codes
    error => ['ECONNREFUSED', 'ETIMEDOUT'].includes(error.code),

    // Retry on HTTP 5xx errors
    error => error.response && error.response.status >= 500,

    // Retry on business logic errors
    error => error.message.includes('temporary failure')
  ]
});
```

## Best Practices

### 1. Choose Appropriate Retry Parameters

- **Database operations**: Higher retry count (5), longer delays (2s base)
- **Redis operations**: Moderate retry count (3), shorter delays (1s base)
- **API calls**: Moderate retry count (3), respect rate limits
- **File operations**: Lower retry count (2), quick delays (500ms base)

### 2. Use Specialized Factory Methods

```javascript
// Instead of manual configuration
const dbRetryManager = RetryManager.forDatabase(); // ✅ Preferred
const redisRetryManager = RetryManager.forRedis(); // ✅ Preferred
```

### 3. Implement Circuit Breaker Pattern

For frequently failing operations, consider implementing a circuit breaker:

```javascript
// TODO: Implement circuit breaker for external API calls
const circuitBreaker = new CircuitBreaker(retryManager);
```

### 4. Monitor Retry Patterns

Log retry attempts to identify systemic issues:

```javascript
const retryManager = new RetryManager({
  onRetry: (attempt, operationName, error) => {
    logger.warn(`Retry attempt ${attempt} for ${operationName}`, {
      error: error.message,
      attempt
    });
  }
});
```

### 5. Graceful Degradation

Always provide fallback mechanisms:

```javascript
try {
  return await primaryOperation();
} catch (error) {
  logger.warn('Primary operation failed, using fallback');
  return await fallbackOperation();
}
```

## Error Handling

### Retryable Errors

The system automatically retries these error types:

- Connection errors: `ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`
- Network errors: `ECONNRESET`, `EPIPE`, `socket hang up`
- Service errors: `service unavailable`, `internal server error`
- Database errors: `connection terminated`, `pool exhausted`
- Redis errors: `redis unavailable`, `cluster down`

### Non-Retryable Errors

These errors won't trigger retries:

- Authentication errors (401, 403)
- Client errors (400, 404)
- Business logic errors
- Validation errors

## Testing

The retry system includes comprehensive tests. Run them with:

```bash
npm test RetryManager.test.js
```

Test coverage includes:

- Basic retry functionality
- Exponential backoff calculation
- Custom retry conditions
- Error handling edge cases
- Factory method configurations

## Monitoring and Observability

### Health Checks

Use the enhanced health check endpoint:

```
GET /health/detailed
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T10:30:00.000Z",
  "connections": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Logging

All retry attempts are logged with structured data:

```javascript
// Retry attempt logs
logger.warn('Retrying Database Connection (attempt 2/4)', {
  attempt: 2,
  error: 'ECONNREFUSED',
  operationName: 'Database Connection'
});

// Final failure logs
logger.error('Database Connection failed permanently after 4 attempts', {
  totalAttempts: 4,
  finalError: 'ECONNREFUSED',
  operationName: 'Database Connection'
});
```

## Migration Guide

### Existing Code Migration

1. **Replace direct database calls**:

   ```javascript
   // Before
   const users = await knex('users').select('*');

   // After
   const users = await req.dbUtils.executeQuery(async knex => knex('users').select('*'), 'Fetch Users');
   ```

2. **Replace direct Redis calls**:

   ```javascript
   // Before
   await redisClient.set('key', 'value');

   // After
   await req.redisUtils.set('key', 'value');
   ```

3. **Replace connection initialization**:

   ```javascript
   // Before
   const redisClient = createClient({ url: redisUrl });
   await redisClient.connect();

   // After
   const redisClient = await enhancedConnections.initializeRedis(redisUrl);
   ```

### Gradual Adoption

You can adopt the retry system gradually:

1. Start with connection initialization
2. Add retry to critical database operations
3. Extend to Redis operations
4. Apply to external API calls
5. Include file operations

## Troubleshooting

### Common Issues

1. **High retry frequency**: Check retry conditions and error patterns
2. **Long delays**: Review backoff multiplier and max delay settings
3. **Failed health checks**: Verify connection configurations
4. **Memory leaks**: Ensure proper cleanup in error handlers

### Debug Mode

Enable debug logging:

```javascript
const retryManager = new RetryManager({
  onRetry: (attempt, operationName, error) => {
    console.debug(`Retry debug: ${operationName} attempt ${attempt}`, error);
  }
});
```

## Future Enhancements

- [ ] Circuit breaker pattern implementation
- [ ] Metrics collection and dashboard
- [ ] Adaptive retry parameters based on success rates
- [ ] Distributed retry coordination
- [ ] Integration with monitoring systems (Prometheus, Grafana)

## Contributing

When adding new retry logic:

1. Follow the existing patterns and interfaces
2. Add comprehensive tests
3. Update this documentation
4. Consider backward compatibility
5. Add appropriate logging
