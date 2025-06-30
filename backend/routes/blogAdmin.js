// /**
//  * Blog Admin Routes
//  *
//  * Routes for blog administration functionality.
//  * Handles admin authentication, content management, and system administration.
//  */

// const express = require('express');
// const router = express.Router();
// const blogAdminService = require('../service/blogAdminService');
// const blogService = require('../service/blogService');
// const { validateBlogAdmin, validateAdminLogin } = require('../middleware/blogValidation');
// const adminAuth = require('../middleware/adminAuth');
// const logger = require('../utils/logger');

// /**
//  * Admin Authentication Routes
//  */

// /**
//  * POST /api/blog/admin/login
//  * Admin login
//  */
// router.post('/login', validateAdminLogin, async (req, res) => {
//   try {
//     const result = await blogAdminService.authenticateAdmin(req.body);

//     if (result.success) {
//       res.json({
//         success: true,
//         data: result.data,
//         message: result.message
//       });
//     } else {
//       res.status(401).json({
//         success: false,
//         message: result.message
//       });
//     }
//   } catch (error) {
//     logger.error('Admin login error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during login'
//     });
//   }
// });

// /**
//  * POST /api/blog/admin/logout
//  * Admin logout
//  */
// router.post('/logout', adminAuth, async (req, res) => {
//   try {
//     const token = req.headers.authorization?.replace('Bearer ', '');
//     const result = await blogAdminService.logoutAdmin(token);

//     res.json(result);
//   } catch (error) {
//     logger.error('Admin logout error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during logout'
//     });
//   }
// });

// /**
//  * GET /api/blog/admin/me
//  * Get current admin profile
//  */
// router.get('/me', adminAuth, async (req, res) => {
//   try {
//     res.json({
//       success: true,
//       data: req.admin
//     });
//   } catch (error) {
//     logger.error('Get admin profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * Admin Management Routes
//  */

// /**
//  * GET /api/blog/admin/users
//  * Get all admin users
//  */
// router.get('/users', adminAuth, async (req, res) => {
//   try {
//     // Check permission
//     if (!blogAdminService.hasPermission(req.admin, 'manage_admins')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     const result = await blogAdminService.getAdmins(req.query);
//     res.json(result);
//   } catch (error) {
//     logger.error('Get admins error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * POST /api/blog/admin/users
//  * Create new admin user
//  */
// router.post('/users', adminAuth, validateBlogAdmin, async (req, res) => {
//   try {
//     // Check permission
//     if (!blogAdminService.hasPermission(req.admin, 'manage_admins')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     const result = await blogAdminService.createAdmin(req.body);

//     if (result.success) {
//       // Log activity
//       await blogAdminService.logActivity(
//         req.admin.id,
//         'create',
//         'admin',
//         result.data.id,
//         { adminUsername: result.data.username }
//       );
//     }

//     res.status(result.success ? 201 : 400).json(result);
//   } catch (error) {
//     logger.error('Create admin error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * PUT /api/blog/admin/users/:id
//  * Update admin user
//  */
// router.put('/users/:id', adminAuth, async (req, res) => {
//   try {
//     const adminId = parseInt(req.params.id);

//     // Check permission (can edit self or have manage_admins permission)
//     if (req.admin.id !== adminId && !blogAdminService.hasPermission(req.admin, 'manage_admins')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     const result = await blogAdminService.updateAdmin(adminId, req.body);

//     if (result.success) {
//       // Log activity
//       await blogAdminService.logActivity(
//         req.admin.id,
//         'update',
//         'admin',
//         adminId,
//         { updatedFields: Object.keys(req.body) }
//       );
//     }

//     res.json(result);
//   } catch (error) {
//     logger.error('Update admin error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * DELETE /api/blog/admin/users/:id
//  * Delete admin user
//  */
// router.delete('/users/:id', adminAuth, async (req, res) => {
//   try {
//     const adminId = parseInt(req.params.id);

//     // Check permission
//     if (!blogAdminService.hasPermission(req.admin, 'manage_admins')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     // Prevent self-deletion
//     if (req.admin.id === adminId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot delete your own account'
//       });
//     }

//     const result = await blogAdminService.deleteAdmin(adminId);

//     if (result.success) {
//       // Log activity
//       await blogAdminService.logActivity(
//         req.admin.id,
//         'delete',
//         'admin',
//         adminId
//       );
//     }

//     res.json(result);
//   } catch (error) {
//     logger.error('Delete admin error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * Dashboard & Analytics Routes
//  */

// /**
//  * GET /api/blog/admin/dashboard
//  * Get dashboard statistics
//  */
// router.get('/dashboard', adminAuth, async (req, res) => {
//   try {
//     const result = await blogAdminService.getDashboardStats();
//     res.json(result);
//   } catch (error) {
//     logger.error('Dashboard stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * GET /api/blog/admin/activities
//  * Get admin activities log
//  */
// router.get('/activities', adminAuth, async (req, res) => {
//   try {
//     const result = await blogAdminService.getActivities(req.query);
//     res.json(result);
//   } catch (error) {
//     logger.error('Get activities error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * Content Management Routes
//  */

// /**
//  * GET /api/blog/admin/posts
//  * Get all posts for admin (including drafts, etc.)
//  */
// router.get('/posts', adminAuth, async (req, res) => {
//   try {
//     // Admin can see all posts regardless of status
//     const searchParams = {
//       ...req.query,
//       includeAll: true // Special flag for admin
//     };

//     const result = await blogService.getPosts(searchParams);
//     res.json(result);
//   } catch (error) {
//     logger.error('Admin get posts error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * POST /api/blog/admin/posts
//  * Create new blog post
//  */
// router.post('/posts', adminAuth, async (req, res) => {
//   try {
//     // Check permission
//     if (!blogAdminService.hasPermission(req.admin, 'create_posts')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     // Add author_id from authenticated admin
//     const postData = {
//       ...req.body,
//       author_id: req.admin.id
//     };

//     const result = await blogService.createPost(postData);

//     if (result.success) {
//       // Log activity
//       await blogAdminService.logActivity(
//         req.admin.id,
//         'create',
//         'post',
//         result.data.id,
//         { title: result.data.title }
//       );
//     }

//     res.status(result.success ? 201 : 400).json(result);
//   } catch (error) {
//     logger.error('Admin create post error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * PUT /api/blog/admin/posts/:id
//  * Update blog post
//  */
// router.put('/posts/:id', adminAuth, async (req, res) => {
//   try {
//     const postId = parseInt(req.params.id);

//     // Check permission
//     if (!blogAdminService.hasPermission(req.admin, 'edit_posts')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     const result = await blogService.updatePost(postId, req.body);

//     if (result.success) {
//       // Log activity
//       await blogAdminService.logActivity(
//         req.admin.id,
//         'update',
//         'post',
//         postId,
//         { updatedFields: Object.keys(req.body) }
//       );
//     }

//     res.json(result);
//   } catch (error) {
//     logger.error('Admin update post error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * DELETE /api/blog/admin/posts/:id
//  * Delete blog post
//  */
// router.delete('/posts/:id', adminAuth, async (req, res) => {
//   try {
//     const postId = parseInt(req.params.id);

//     // Check permission
//     if (!blogAdminService.hasPermission(req.admin, 'delete_posts')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     const result = await blogService.deletePost(postId);

//     if (result.success) {
//       // Log activity
//       await blogAdminService.logActivity(
//         req.admin.id,
//         'delete',
//         'post',
//         postId
//       );
//     }

//     res.json(result);
//   } catch (error) {
//     logger.error('Admin delete post error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * POST /api/blog/admin/posts/:id/publish
//  * Publish/unpublish blog post
//  */
// router.post('/posts/:id/publish', adminAuth, async (req, res) => {
//   try {
//     const postId = parseInt(req.params.id);
//     const { action } = req.body; // 'publish' or 'unpublish'

//     // Check permission
//     if (!blogAdminService.hasPermission(req.admin, 'publish_posts')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     const status = action === 'publish' ? 'published' : 'draft';
//     const result = await blogService.updatePost(postId, { status });

//     if (result.success) {
//       // Log activity
//       await blogAdminService.logActivity(
//         req.admin.id,
//         action,
//         'post',
//         postId
//       );
//     }

//     res.json(result);
//   } catch (error) {
//     logger.error('Admin publish post error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * Content Moderation Routes
//  */

// /**
//  * GET /api/blog/admin/moderation
//  * Get content pending moderation
//  */
// router.get('/moderation', adminAuth, async (req, res) => {
//   try {
//     // Check permission
//     if (!blogAdminService.hasPermission(req.admin, 'content_moderation')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     const result = await blogAdminService.getPendingContent(req.query);
//     res.json(result);
//   } catch (error) {
//     logger.error('Get pending content error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// /**
//  * POST /api/blog/admin/moderation/:id
//  * Moderate content
//  */
// router.post('/moderation/:id', adminAuth, async (req, res) => {
//   try {
//     const moderationId = parseInt(req.params.id);
//     const { decision, reason } = req.body;

//     // Check permission
//     if (!blogAdminService.hasPermission(req.admin, 'content_moderation')) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }

//     const result = await blogAdminService.moderateContent(
//       moderationId,
//       decision,
//       reason,
//       req.admin.id
//     );

//     res.json(result);
//   } catch (error) {
//     logger.error('Moderate content error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // #TODO: Add bulk operations for posts (bulk delete, bulk publish, etc.)
// // #TODO: Implement admin file upload routes for images
// // #TODO: Add admin export functionality (posts, analytics, etc.)
// // #TODO: Implement admin notification routes
// // #TODO: Add admin system settings routes

// module.exports = router;
