require('@dotenvx/dotenvx').config();
const express = require('express');
const { createClient } = require('redis');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
// Routers
const messagesRouter = require('./routes/messages');
const authRouter = require('./routes/authorization');
const { cars } = require('./routes/cars');
const listings = require('./routes/listings');
const passport = require('passport');
const { emailRouter } = require('./routes/email');
const favoritesRouter = require('./routes/favorites');
const user = require('./routes/user');
const reviews = require('./routes/reviews');
const profile = require('./routes/profile');
const reportRouter = require('./routes/report');
const paymentRouter = require('./routes/payment');
const webhookRouter = require('./routes/webhook');
const companyRouter = require('./routes/company');
const subscriptionAdminRouter = require('./routes/subscriptionAdmin');
const subscriptionAdminController = require('./controllers/subscriptionAdminController');
const blogRouter = require('./routes/blog');
const sitemapRouter = require('./routes/sitemap');
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy configuration for security
// Only trust the first proxy (Caddy) and validate proxy headers
if (process.env.NODE_ENV === 'production') {
  // Trust only the first proxy in the chain (Caddy)
  app.set('trust proxy', 1);
} else {
  // In development, don't trust any proxies
  app.set('trust proxy', false);
}

const { setupAutoExpire: _setupAutoExpire, setupAutoDeleteDisabledListings: _setupAutoDeleteDisabledListings } = require('./service/autoExpireListings');
const logger = require('./utils/logger');
const { getEnhancedConnections } = require('./utils/EnhancedServerConnections');

const knex = require('./config/database');
const redisUrl = process.env.NODE_ENV === 'production' ? process.env.REDIS_URL : 'redis://localhost:6379';
logger.info(`Using Redis URL: ${redisUrl}`);

// Initialize enhanced connections with retry logic
const enhancedConnections = getEnhancedConnections();

// Rate limiting configuration
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: Math.ceil(15 * 60 * 1000 / 1000) // Retry after in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks and static assets
  skip: (req) => {
    return req.path === '/health' || req.path.startsWith('/static/');
  },
  // Custom key generator for better security
  keyGenerator: (req) => {
    // In production, get IP from X-Forwarded-For (trusted proxy)
    // In development, use connection remote address
    if (process.env.NODE_ENV === 'production') {
      return req.ip; // Express will properly parse this with trust proxy = 1
    } else {
      return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    }
  }
});

// Specific rate limiters for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: Math.ceil(15 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 payment attempts per hour
  message: {
    error: 'Too many payment attempts, please try again later',
    retryAfter: Math.ceil(60 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Clean up temporary files on server startup
 * Follows Single Responsibility Principle
 */
const cleanupTempFiles = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (require('fs').existsSync(uploadsDir)) {
    require('fs')
      .readdirSync(uploadsDir)
      .forEach(file => {
        const filePath = path.join(uploadsDir, file);
        try {
          require('fs').unlinkSync(filePath);
        } catch (error) {
          logger.warn('Failed to cleanup temp file:', { error });
        }
      });
  }
};

/**
 * Initialize all connections and setup server
 * This ensures proper startup order and error handling
 */
async function initializeServer() {
  try {
    // Initialize Redis client with retry logic first
    const redisClient = await enhancedConnections.initializeRedis(redisUrl);
    logger.info('Redis client initialized with retry capabilities');

    // Initialize database with retry logic
    await enhancedConnections.initializeDatabase({
      client: knex.client.config.client,
      connection: knex.client.config.connection,
      pool: knex.client.config.pool,
      migrations: knex.client.config.migrations,
      seeds: knex.client.config.seeds
    });
    logger.info('Database initialized with retry capabilities');

    // Setup session configuration with initialized Redis client
    setupSessionMiddleware(redisClient);

    // Setup remaining middleware and routes
    setupMiddleware();
    setupRoutes();

    // Start the server
    startServer();

  } catch (error) {
    logger.error('Failed to initialize server connections', { error: error.message });
    // Fallback to basic initialization
    await fallbackInitialization();
  }
}

/**
 * Fallback initialization without retry logic
 */
async function fallbackInitialization() {
  try {
    logger.warn('Using fallback initialization without retry logic');

    // Basic Redis client
    const redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
    logger.info('Basic Redis client connected');

    // Setup session with basic client
    setupSessionMiddleware(redisClient);
    setupMiddleware();
    setupRoutes();
    startServer();

  } catch (error) {
    logger.error('Fallback initialization failed', { error: error.message });

    // Final fallback - no Redis sessions
    logger.warn('Starting server without Redis sessions');
    setupSessionMiddleware(null);
    setupMiddleware();
    setupRoutes();
    startServer();
  }
}

/**
 * Setup session middleware with optional Redis client
 */
function setupSessionMiddleware(redisClient) {
  const sessionConfig = {
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

  // Add Redis store if client is available
  if (redisClient) {
    try {
      sessionConfig.store = new RedisStore({ client: redisClient });
      logger.info('Session configured with Redis store');
    } catch (error) {
      logger.error('Failed to setup Redis store, using memory store', { error: error.message });
    }
  } else {
    logger.warn('Session configured with memory store (not recommended for production)');
  }

  app.use(session(sessionConfig));
  app.use(passport.authenticate('session'));
}

/**
 * Setup general middleware
 */
function setupMiddleware() {
  // Security middleware
  app.use(helmet());

  // Rate limiting
  app.use(globalLimiter);

  // CORS
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true
    })
  );

  // Request logging
  app.use(
    morgan('dev', {
      stream: {
        write: message => logger.info(message.trim())
      }
    })
  );

  // Webhook middleware (before JSON parsing)
  app.use(
    '/api/webhook',
    express.raw({
      type: 'application/json',
      limit: '1mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    })
  );

  // JSON and URL-encoded parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use(
    express.urlencoded({
      limit: '50mb',
      extended: true
    })
  );

  // Database middleware
  app.set('db', knex);
  app.use((req, res, next) => {
    req.knex = knex;
    next();
  });

  // Enhanced connection middleware
  const dbMiddleware = enhancedConnections.createDatabaseMiddleware();
  const redisMiddleware = enhancedConnections.createRedisMiddleware();
  app.use(dbMiddleware);
  app.use(redisMiddleware);
}

/**
 * Setup all routes
 */
function setupRoutes() {
  // Utility endpoints
  app.get('/api/get-ip', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    res.json({ ip });
  });

  // Initialize subscription admin services
  try {
    subscriptionAdminController.initializeAdminServices(knex);
    logger.info('Subscription admin services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize subscription admin services', { error: error.message });
  }

  // Mount webhook route BEFORE other routes (already has raw middleware)
  app.use('/api', webhookRouter(knex));

  // API routes with rate limiting where appropriate
  app.use('/api/report', reportRouter(knex));
  app.use('/api/conversations', messagesRouter(knex));
  app.use('/api/auth', authLimiter, authRouter(knex));
  app.use('/api/company', companyRouter);
  app.use('/api/subscription', require('./routes/subscription')(knex));
  app.use('/api/admin/subscription', subscriptionAdminRouter);
  app.use('/api/ai', require('./routes/ai'));
  app.use('/api', cars(knex));
  app.use('/api/listings', listings(knex));
  app.use('/api', emailRouter(knex));
  app.use('/api/favorites', favoritesRouter(knex));
  app.use('/api/users', user(knex));
  app.use('/api/profile', profile(knex));
  app.use('/api/reviews', reviews(knex));
  app.use('/api/payment', paymentLimiter, paymentRouter);
  app.use('/api/blog', blogRouter);

  // SEO and Sitemap routes (no /api prefix for SEO compatibility)
  app.use('/', sitemapRouter(knex));

  // Health check endpoints
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'not-set',
      port: PORT
    });
  });

  // Enhanced health check endpoint with connection status
  app.get('/health/detailed', async (req, res) => {
    try {
      const healthResults = await enhancedConnections.performHealthChecks();

      const overallStatus = healthResults.database && healthResults.redis ? 'healthy' : 'degraded';
      const statusCode = overallStatus === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        status: overallStatus,
        timestamp: healthResults.timestamp,
        env: process.env.NODE_ENV || 'not-set',
        port: PORT,
        connections: {
          database: healthResults.database ? 'healthy' : 'unhealthy',
          redis: healthResults.redis ? 'healthy' : 'unhealthy'
        }
      });
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  });

  // Global error handler
  app.use((err, req, res, _next) => {
    logger.error(err.stack);
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  });
}

/**
 * Start the server
 */
function startServer() {
  // Initialize image processing (TensorFlow/NSFW detection) safely
  const { initializeImageProcessing } = require('./imageHandler');
  initializeImageProcessing().catch(err => {
    logger.warn('Image processing initialization failed:', err.message);
  });

  // Start server
  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received.');
    server.close(() => {
      logger.info('Server closed.');
      // Use throw instead of process.exit for better error handling
      throw new Error('Server shutdown completed');
    });
  });

  return server;
}

// Call cleanup on startup
cleanupTempFiles();

// Initialize the server
initializeServer().catch(error => {
  logger.error('Server initialization failed', { error: error.message });
  throw new Error('Server startup failed');
});

module.exports = app;
