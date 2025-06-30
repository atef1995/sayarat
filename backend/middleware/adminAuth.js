// /**
//  * Admin Authentication Middleware
//  *
//  * Middleware for authenticating blog admin users.
//  * Verifies JWT tokens and checks admin permissions.
//  */

// const blogAdminService = require('../service/blogAdminService');
// const logger = require('../utils/logger');

// /**
//  * Admin authentication middleware
//  */
// const adminAuth = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({
//         success: false,
//         message: 'Access token required'
//       });
//     }

//     const token = authHeader.replace('Bearer ', '');

//     // Verify token and get admin details
//     const result = await blogAdminService.verifyAdminToken(token);

//     if (!result.success) {
//       return res.status(401).json({
//         success: false,
//         message: result.message || 'Invalid or expired token'
//       });
//     }

//     // Attach admin to request object
//     req.admin = result.data;
//     req.adminToken = token;

//     // Parse permissions if they exist
//     if (req.admin.permissions) {
//       try {
//         req.admin.permissions = JSON.parse(req.admin.permissions);
//       } catch (error) {
//         req.admin.permissions = [];
//       }
//     } else {
//       req.admin.permissions = [];
//     }

//     next();

//   } catch (error) {
//     logger.error('Admin auth middleware error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during authentication'
//     });
//   }
// };

// /**
//  * Permission check middleware factory
//  * Creates middleware to check specific permissions
//  */
// const requirePermission = (permission) => {
//   return (req, res, next) => {
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }

//     if (!blogAdminService.hasPermission(req.admin, permission)) {
//       return res.status(403).json({
//         success: false,
//         message: `Permission required: ${permission}`
//       });
//     }

//     next();
//   };
// };

// /**
//  * Role-based access control middleware
//  * Checks if admin has required role
//  */
// const requireRole = (roles) => {
//   const allowedRoles = Array.isArray(roles) ? roles : [roles];

//   return (req, res, next) => {
//     if (!req.admin) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }

//     if (!allowedRoles.includes(req.admin.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `Role required: ${allowedRoles.join(' or ')}`
//       });
//     }

//     next();
//   };
// };

// /**
//  * Super admin only middleware
//  */
// const requireSuperAdmin = requireRole('super_admin');

// /**
//  * Activity logging middleware
//  * Automatically logs admin activities
//  */
// const logActivity = (action, resourceType) => {
//   return async (req, res, next) => {
//     // Store original json method
//     const originalJson = res.json;

//     // Override json method to log activity after successful response
//     res.json = function (data) {
//       // Call original json method
//       originalJson.call(this, data);

//       // Log activity if response was successful
//       if (data.success && req.admin) {
//         const resourceId = req.params.id ? parseInt(req.params.id) : null;
//         const details = {
//           method: req.method,
//           path: req.path,
//           body: req.method !== 'GET' ? req.body : undefined
//         };

//         // Don't await - fire and forget
//         blogAdminService.logActivity(
//           req.admin.id,
//           action,
//           resourceType,
//           resourceId,
//           details
//         ).catch(error => {
//           logger.error('Failed to log admin activity:', error);
//         });
//       }
//     };

//     next();
//   };
// };

// module.exports = {
//   adminAuth,
//   requirePermission,
//   requireRole,
//   requireSuperAdmin,
//   logActivity
// };
