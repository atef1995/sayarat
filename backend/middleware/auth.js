const db = require('../config/database'); // Updated to use dbQueries for better structure
const logger = require('../utils/logger');

/**
 * Authentication Middleware
 *
 * Provides Passport-based authentication and authorization middleware
 * for the seller-based system with admin privileges.
 */

/**
 * Ensure user is authenticated using Passport session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Check if user is authenticated via Passport session
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'يجب تسجيل الدخول أولاً',
        message: 'Authentication required'
      });
    }

    // Get complete seller information from database to ensure we have latest data
    const seller = await db('sellers').where('id', req.user.id).first();

    if (!seller) {
      return res.status(401).json({
        success: false,
        error: 'المستخدم غير موجود',
        message: 'User not found'
      });
    }

    // Check if seller account is active
    if (!seller.email_verified) {
      return res.status(401).json({
        success: false,
        error: 'يجب تأكيد البريد الإلكتروني',
        message: 'Email verification required'
      });
    }

    // Update req.user with complete seller info including admin status
    req.user = {
      ...req.user,
      id: seller.id,
      email: seller.email,
      username: seller.username,
      first_name: seller.first_name,
      last_name: seller.last_name,
      is_admin: seller.is_admin || false,
      account_type: seller.account_type || 'individual'
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', {
      error: error.message,
      stack: error.stack,
      endpoint: req.originalUrl,
      user_id: req.user?.id
    });

    return res.status(500).json({
      success: false,
      error: 'خطأ في التحقق من الهوية',
      message: 'Authentication error'
    });
  }
};

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

/**
 * Optional authentication - doesn't fail if no user session exists
 * But sets req.user with complete data if valid session exists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated via Passport session
    if (!req.isAuthenticated()) {
      return next(); // No session, continue without authentication
    }

    // Get complete seller information from database
    const seller = await db('sellers').where('id', req.user.id).first();

    if (seller && seller.email_verified) {
      // Update req.user with complete seller info
      req.user = {
        ...req.user,
        id: seller.id,
        email: seller.email,
        username: seller.username,
        first_name: seller.first_name,
        last_name: seller.last_name,
        is_admin: seller.is_admin || false,
        account_type: seller.account_type || 'individual'
      };
    }

    next();
  } catch (error) {
    // Log error but don't fail the request
    logger.warn('Optional authentication failed:', {
      error: error.message,
      user_id: req.user?.id
    });
    next();
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
  authenticateToken,
  requireAdmin,
  optionalAuth,
  handleAuth,
  ensureAuthenticated
};
