/**
 * Sitemap Routes for Cars-Bids Platform
 * 
 * Handles all sitemap-related routes with proper middleware
 * Optimized for Arabic content and search engine crawling
 * 
 * @module SitemapRoutes
 */

const { Router } = require('express');
const sitemapController = require('../controllers/seo/sitemapController');
const logger = require('../utils/logger');

const router = Router();

/**
 * Middleware to log sitemap requests for monitoring
 */
const logSitemapRequest = (req, res, next) => {
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress;

  logger.info(`Sitemap request: ${req.path}`, {
    userAgent,
    ip,
    referer: req.get('Referer'),
    timestamp: new Date().toISOString()
  });

  next();
};

/**
 * Middleware to set security headers for sitemaps
 */
const setSitemapHeaders = (req, res, next) => {
  // Security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer-when-downgrade'
  });

  next();
};

/**
 * Rate limiting middleware for sitemap requests
 */
const rateLimitSitemap = (req, res, next) => {
  // Simple rate limiting - could be enhanced with Redis
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20; // Max 20 requests per minute per IP

  if (!req.app.locals.sitemapRateLimit) {
    req.app.locals.sitemapRateLimit = new Map();
  }

  const requests = req.app.locals.sitemapRateLimit.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    logger.warn(`Rate limit exceeded for sitemap requests from IP: ${ip}`);
    return res.status(429).json({
      error: 'Too many requests',
      message: 'الكثير من الطلبات، يرجى المحاولة لاحقاً'
    });
  }

  recentRequests.push(now);
  req.app.locals.sitemapRateLimit.set(ip, recentRequests);

  next();
};

// Apply middleware to all sitemap routes
router.use(logSitemapRequest);
router.use(setSitemapHeaders);
router.use(rateLimitSitemap);

/**
 * @route GET /sitemap.xml
 * @desc Get main sitemap index
 * @access Public
 */
router.get('/sitemap.xml', sitemapController.getSitemapIndex);

/**
 * @route GET /sitemap-static.xml
 * @desc Get static pages sitemap
 * @access Public
 */
router.get('/sitemap-static.xml', sitemapController.getStaticSitemap);

/**
 * @route GET /sitemap-cars.xml
 * @desc Get car listings sitemap
 * @access Public
 */
router.get('/sitemap-cars.xml', sitemapController.getCarsSitemap);

/**
 * @route GET /sitemap-companies.xml
 * @desc Get companies sitemap
 * @access Public
 */
router.get('/sitemap-companies.xml', sitemapController.getCompaniesSitemap);

/**
 * @route GET /sitemap-blog.xml
 * @desc Get blog posts sitemap
 * @access Public
 */
router.get('/sitemap-blog.xml', sitemapController.getBlogSitemap);

/**
 * @route GET /sitemap-categories.xml
 * @desc Get categories and locations sitemap
 * @access Public
 */
router.get('/sitemap-categories.xml', sitemapController.getCategoriesSitemap);

/**
 * @route GET /robots.txt
 * @desc Get robots.txt file
 * @access Public
 */
router.get('/robots.txt', sitemapController.getRobotsTxt);

/**
 * @route GET /sitemap/stats
 * @desc Get sitemap statistics (for admin/monitoring)
 * @access Public (could be restricted to admin)
 */
router.get('/sitemap/stats', sitemapController.getSitemapStats);

/**
 * @route POST /sitemap/clear-cache
 * @desc Clear sitemap cache (admin only)
 * @access Private
 */
router.post('/sitemap/clear-cache', (req, res, next) => {
  // #TODO: Add admin authentication middleware
  // For now, allow any authenticated user to clear cache
  next();
}, sitemapController.clearCache);

/**
 * @route GET /.well-known/sitemap
 * @desc Alternative sitemap discovery endpoint
 * @access Public
 */
router.get('/.well-known/sitemap', (req, res) => {
  res.redirect(301, '/sitemap.xml');
});

/**
 * Health check endpoint for sitemap service
 */
router.get('/sitemap/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sitemap',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'sitemap-index',
      'arabic-optimization',
      'syria-geo-targeting',
      'multi-language-support',
      'caching',
      'rate-limiting'
    ]
  });
});

/**
 * Error handling middleware for sitemap routes
 */
router.use((error, req, res, _next) => {
  logger.error('Sitemap route error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'خطأ في الخادم الداخلي'
  });
});

/**
 * @route GET /api/sitemap/cars
 * @desc Get cars data with Arabic metadata for sitemap generation
 * @access Public
 */
router.get('/api/sitemap/cars', sitemapController.getCarsForSitemap);

/**
 * @route GET /api/sitemap/companies
 * @desc Get companies data with Arabic metadata for sitemap generation
 * @access Public
 */
router.get('/api/sitemap/companies', sitemapController.getCompaniesForSitemap);

/**
 * @route GET /api/sitemap/blog
 * @desc Get blog posts data with Arabic metadata for sitemap generation
 * @access Public
 */
router.get('/api/sitemap/blog', sitemapController.getBlogPostsForSitemap);

/**
 * @route GET /api/sitemap/categories
 * @desc Get categories data with Arabic metadata for sitemap generation
 * @access Public
 */
router.get('/api/sitemap/categories', sitemapController.getCategoriesForSitemap);

/**
 * @route GET /api/sitemap/cities
 * @desc Get Syrian cities data with Arabic metadata for sitemap generation
 * @access Public
 */
router.get('/api/sitemap/cities', sitemapController.getCitiesForSitemap);

/**
 * @route GET /api/metadata/arabic
 * @desc Get comprehensive Arabic metadata for frontend integration
 * @access Public
 */
router.get('/api/metadata/arabic', sitemapController.getArabicMetadata);

module.exports = router;
