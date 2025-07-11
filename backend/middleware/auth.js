const db = require('../config/database'); // Updated to use dbQueries for better structure
const logger = require('../utils/logger');
const { getSellerById } = require('../dbQueries/sellers');


/**
 * Require admin privileges
 * This middleware should be used after authenticateToken
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'يجب تسجيل الدخول أولاً',
        message: 'Authentication required'
      });
    }

    // Check if user has admin privileges
    if (!req.user.is_admin) {
      logger.warn('Unauthorized admin access attempt:', {
        user_id: req.user.id,
        email: req.user.email,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بالوصول لهذه الصفحة',
        message: 'Admin privileges required'
      });
    }

    next();
  } catch (error) {
    logger.error('Admin authorization error:', {
      error: error.message,
      user_id: req.user?.id,
      endpoint: req.originalUrl
    });

    return res.status(500).json({
      success: false,
      error: 'خطأ في التحقق من الصلاحيات',
      message: 'Authorization error'
    });
  }
};

// Error handling middleware for authentication
const handleAuth = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح لك بالوصول',
      message: 'Unauthorized access',
      details: err.message
    });
  }

  logger.error('Authentication middleware error:', {
    error: err.message,
    stack: err.stack,
    endpoint: req.originalUrl
  });

  next(err);
};

/**
 * Ensure user is authenticated using Passport session
 * This is an alias for authenticateToken to maintain compatibility
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function ensureAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'يجب تسجيل الدخول أولاً',
      message: 'Authentication required'
    });
  }
  next();
}

/**
 * Enhanced require admin privileges with session refresh capability
 * This middleware refreshes session data if it detects potential mismatches
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdminWithRefresh = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'يجب تسجيل الدخول أولاً',
        message: 'Authentication required'
      });
    }

    // If user is not admin in session, check database for fresh data
    if (!req.user.is_admin) {
      logger.info('Admin check failed in session, checking database for fresh data', {
        userId: req.user.id,
        sessionAdmin: req.user.is_admin
      });

      try {
        // Get fresh user data from database
        const dbUser = await getSellerById(db, req.user.id);

        if (dbUser && dbUser.is_admin) {
          logger.info('User is admin in database, updating session', {
            userId: req.user.id,
            sessionAdmin: req.user.is_admin,
            dbAdmin: dbUser.is_admin
          });

          // Update session with fresh data
          req.user = {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            is_admin: dbUser.is_admin,
            is_company: dbUser.is_company,
            is_premium: dbUser.is_premium,
            account_type: dbUser.account_type || 'personal'
          };

          // Save session synchronously to ensure immediate availability
          await new Promise((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                logger.error('Error saving refreshed session in requireAdmin:', err);
                reject(err);
              } else {
                logger.info('Session refreshed successfully in requireAdmin');
                resolve();
              }
            });
          });
        }
      } catch (dbError) {
        logger.error('Error checking database for admin status:', {
          error: dbError.message,
          userId: req.user.id
        });
        // Continue with session data if database check fails
      }
    }

    // Final admin check
    if (!req.user.is_admin) {
      logger.warn('Unauthorized admin access attempt:', {
        user_id: req.user.id,
        email: req.user.email,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بالوصول لهذه الصفحة',
        message: 'Admin privileges required'
      });
    }

    next();
  } catch (error) {
    logger.error('Admin authorization error:', {
      error: error.message,
      user_id: req.user?.id,
      endpoint: req.originalUrl
    });

    return res.status(500).json({
      success: false,
      error: 'خطأ في التحقق من الصلاحيات',
      message: 'Authorization error'
    });
  }
};

module.exports = {
  requireAdmin,
  handleAuth,
  ensureAuthenticated,
  requireAdminWithRefresh
};
