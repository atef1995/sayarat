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

const knex = require('./config/database');
const redisUrl = process.env.NODE_ENV === 'production' ? process.env.REDIS_URL : 'redis://localhost:6379';
logger.info(`Using Redis URL: ${redisUrl}`);

// Initialize Redis client
const redisClient = createClient({
  url: redisUrl
});

redisClient.connect().catch(logger.error);

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

// Call on server startup
cleanupTempFiles();

// Security middleware
app.use(helmet());

// Secure rate limiting configuration
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
app.use(globalLimiter);

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

// Session configuration
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.SECURE_COOKIES === 'true',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use(passport.authenticate('session'));

// Middleware - Webhook must be before JSON parsing
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

// Mount webhook route BEFORE general JSON parsing
app.use('/api', webhookRouter(knex));

app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies
app.use(cookieParser());

app.use(
  express.urlencoded({
    limit: '50mb',
    extended: true
  })
); // Parse URL-encoded request bodies

app.get('/api/get-ip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  res.json({ ip });
});

// Make database available to all routes
app.set('db', knex);

// Add knex to all requests for sitemap routes
app.use((req, res, next) => {
  req.knex = knex;
  next();
});

// Initialize subscription admin services
try {
  subscriptionAdminController.initializeAdminServices(knex);
  logger.info('Subscription admin services initialized successfully');
} catch (error) {
  logger.error('Failed to initialize subscription admin services', { error: error.message });
}

app.use('/api/report', reportRouter(knex));
app.use('/api/conversations', messagesRouter(knex));
app.use('/api/auth', authLimiter, authRouter(knex)); // Apply auth rate limiting
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
app.use('/api/payment', paymentLimiter, paymentRouter); // Apply payment rate limiting
app.use('/api/blog', blogRouter);

// SEO and Sitemap routes (no /api prefix for SEO compatibility)
app.use('/', sitemapRouter);

// Note: webhookRouter is already mounted above before JSON parsing
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'not-set',
    port: PORT
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received.');
  app.close(() => {
    logger.info('Server closed.');
    // Use throw instead of process.exit for better error handling
    throw new Error('Server shutdown completed');
  });
});

// Initialize image processing (TensorFlow/NSFW detection) safely
const { initializeImageProcessing } = require('./imageHandler');
initializeImageProcessing().catch(err => {
  logger.warn('Image processing initialization failed:', err.message);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;
