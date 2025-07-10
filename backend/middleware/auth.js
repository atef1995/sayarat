const db = require('../config/database'); // Updated to use dbQueries for better structure
const logger = require('../utils/logger');


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

module.exports = {
  requireAdmin,
  handleAuth,
  ensureAuthenticated
};
