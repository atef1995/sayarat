// /**
//  * Blog Admin Service
//  *
//  * Service layer for blog administration operations.
//  * Handles admin authentication, permissions, and content management.
//  * Follows SOLID principles with comprehensive error handling.
//  */

// const db = require('../config/database');
// const bcrypt = require('bcryptjs');
// const logger = require('../utils/logger');

// /**
//  * Admin Authentication Methods
//  */

// /**
//  * Authenticate admin user
//  */
// const authenticateAdmin = async (credentials) => {
//   try {
//     const { username, password } = credentials;

//     // Find admin by username or email
//     const admin = await db('blog_admins')
//       .where(function () {
//         this.where('username', username).orWhere('email', username);
//       })
//       .where('is_active', true)
//       .first();

//     if (!admin) {
//       return {
//         success: false,
//         message: 'Invalid credentials'
//       };
//     }

//     // Verify password
//     const isValidPassword = await bcrypt.compare(password, admin.password_hash);

//     if (!isValidPassword) {
//       return {
//         success: false,
//         message: 'Invalid credentials'
//       };
//     }

//     // Update last login
//     await db('blog_admins')
//       .where('id', admin.id)
//       .update({ last_login: new Date() });

//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         adminId: admin.id,
//         username: admin.username,
//         role: admin.role
//       },
//       process.env.JWT_SECRET || 'fallback-secret',
//       { expiresIn: '24h' }
//     );

//     // Create session record
//     await db('blog_admin_sessions').insert({
//       admin_id: admin.id,
//       token,
//       expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
//     });

//     // Remove sensitive data
//     delete admin.password_hash;
//     delete admin.reset_token;
//     delete admin.reset_token_expires;

//     return {
//       success: true,
//       data: {
//         admin,
//         token
//       },
//       message: 'Authentication successful'
//     };

//   } catch (error) {
//     logger.error('Error in authenticateAdmin:', error);
//     return {
//       success: false,
//       message: 'Authentication failed',
//       error: error.message
//     };
//   }
// };

// /**
//  * Verify admin token
//  */
// const verifyAdminToken = async (token) => {
//   try {
//     // Verify JWT
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

//     // Check if session exists and is valid
//     const session = await db('blog_admin_sessions')
//       .where('token', token)
//       .where('expires_at', '>', new Date())
//       .first();

//     if (!session) {
//       return {
//         success: false,
//         message: 'Invalid or expired session'
//       };
//     }

//     // Get admin details
//     const admin = await db('blog_admins')
//       .where('id', decoded.adminId)
//       .where('is_active', true)
//       .first();

//     if (!admin) {
//       return {
//         success: false,
//         message: 'Admin not found or inactive'
//       };
//     }

//     // Remove sensitive data
//     delete admin.password_hash;
//     delete admin.reset_token;
//     delete admin.reset_token_expires;

//     return {
//       success: true,
//       data: admin
//     };

//   } catch (error) {
//     logger.error('Error in verifyAdminToken:', error);
//     return {
//       success: false,
//       message: 'Token verification failed',
//       error: error.message
//     };
//   }
// };

// /**
//  * Admin logout
//  */
// const logoutAdmin = async (token) => {
//   try {
//     // Remove session
//     await db('blog_admin_sessions')
//       .where('token', token)
//       .del();

//     return {
//       success: true,
//       message: 'Logout successful'
//     };

//   } catch (error) {
//     logger.error('Error in logoutAdmin:', error);
//     return {
//       success: false,
//       message: 'Logout failed',
//       error: error.message
//     };
//   }
// };

// /**
//  * Admin Management Methods
//  */

// /**
//  * Get all admins
//  */
// const getAdmins = async (filters = {}) => {
//   try {
//     const { role, is_active, search } = filters;

//     let query = db('blog_admins')
//       .select(['id', 'username', 'email', 'full_name', 'avatar', 'role', 'is_active', 'last_login', 'created_at'])
//       .orderBy('created_at', 'desc');

//     if (role) {
//       query = query.where('role', role);
//     }

//     if (is_active !== undefined) {
//       query = query.where('is_active', is_active);
//     }

//     if (search) {
//       query = query.where(function () {
//         this.where('username', 'ilike', `%${search}%`)
//           .orWhere('email', 'ilike', `%${search}%`)
//           .orWhere('full_name', 'ilike', `%${search}%`);
//       });
//     }

//     const admins = await query;

//     return {
//       success: true,
//       data: admins
//     };

//   } catch (error) {
//     logger.error('Error in getAdmins:', error);
//     return {
//       success: false,
//       message: 'Failed to fetch admins',
//       error: error.message
//     };
//   }
// };

// /**
//  * Create new admin
//  */
// const createAdmin = async (adminData) => {
//   try {
//     const { username, email, password, full_name, role, permissions } = adminData;

//     // Check if username or email already exists
//     const existingAdmin = await db('blog_admins')
//       .where('username', username)
//       .orWhere('email', email)
//       .first();

//     if (existingAdmin) {
//       return {
//         success: false,
//         message: 'Username or email already exists'
//       };
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Insert new admin
//     const [newAdmin] = await db('blog_admins')
//       .insert({
//         username,
//         email,
//         password_hash: hashedPassword,
//         full_name,
//         role: role || 'moderator',
//         permissions: JSON.stringify(permissions || [])
//       })
//       .returning(['id', 'username', 'email', 'full_name', 'role', 'is_active', 'created_at']);

//     return {
//       success: true,
//       data: newAdmin,
//       message: 'Admin created successfully'
//     };

//   } catch (error) {
//     logger.error('Error in createAdmin:', error);
//     return {
//       success: false,
//       message: 'Failed to create admin',
//       error: error.message
//     };
//   }
// };

// /**
//  * Update admin
//  */
// const updateAdmin = async (adminId, updateData) => {
//   try {
//     const updateObj = {};

//     if (updateData.email) updateObj.email = updateData.email;
//     if (updateData.full_name) updateObj.full_name = updateData.full_name;
//     if (updateData.avatar) updateObj.avatar = updateData.avatar;
//     if (updateData.role) updateObj.role = updateData.role;
//     if (updateData.permissions) updateObj.permissions = JSON.stringify(updateData.permissions);
//     if (updateData.is_active !== undefined) updateObj.is_active = updateData.is_active;

//     if (updateData.password) {
//       const salt = await bcrypt.genSalt(10);
//       updateObj.password_hash = await bcrypt.hash(updateData.password, salt);
//     }

//     const [updatedAdmin] = await db('blog_admins')
//       .where('id', adminId)
//       .update(updateObj)
//       .returning(['id', 'username', 'email', 'full_name', 'role', 'is_active', 'updated_at']);

//     if (!updatedAdmin) {
//       return {
//         success: false,
//         message: 'Admin not found'
//       };
//     }

//     return {
//       success: true,
//       data: updatedAdmin,
//       message: 'Admin updated successfully'
//     };

//   } catch (error) {
//     logger.error('Error in updateAdmin:', error);
//     return {
//       success: false,
//       message: 'Failed to update admin',
//       error: error.message
//     };
//   }
// };

// /**
//  * Delete admin
//  */
// const deleteAdmin = async (adminId) => {
//   try {
//     const deletedCount = await db('blog_admins')
//       .where('id', adminId)
//       .del();

//     if (deletedCount === 0) {
//       return {
//         success: false,
//         message: 'Admin not found'
//       };
//     }

//     return {
//       success: true,
//       message: 'Admin deleted successfully'
//     };

//   } catch (error) {
//     logger.error('Error in deleteAdmin:', error);
//     return {
//       success: false,
//       message: 'Failed to delete admin',
//       error: error.message
//     };
//   }
// };

// /**
//  * Activity Logging Methods
//  */

// /**
//  * Log admin activity
//  */
// const logActivity = async (adminId, action, resourceType, resourceId = null, details = {}) => {
//   try {
//     await db('blog_admin_activities').insert({
//       admin_id: adminId,
//       action,
//       resource_type: resourceType,
//       resource_id: resourceId,
//       details: JSON.stringify(details)
//     });

//     return {
//       success: true
//     };

//   } catch (error) {
//     logger.error('Error in logActivity:', error);
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// };

// /**
//  * Get admin activities
//  */
// const getActivities = async (filters = {}) => {
//   try {
//     const { adminId, action, resourceType, limit = 50, page = 1 } = filters;
//     const offset = (page - 1) * limit;

//     let query = db('blog_admin_activities as baa')
//       .select([
//         'baa.*',
//         'ba.username as admin_username',
//         'ba.full_name as admin_name'
//       ])
//       .join('blog_admins as ba', 'baa.admin_id', 'ba.id')
//       .orderBy('baa.created_at', 'desc')
//       .limit(limit)
//       .offset(offset);

//     if (adminId) {
//       query = query.where('baa.admin_id', adminId);
//     }

//     if (action) {
//       query = query.where('baa.action', action);
//     }

//     if (resourceType) {
//       query = query.where('baa.resource_type', resourceType);
//     }

//     const activities = await query;

//     // Parse JSON details
//     const processedActivities = activities.map(activity => ({
//       ...activity,
//       details: activity.details ? JSON.parse(activity.details) : {}
//     }));

//     return {
//       success: true,
//       data: processedActivities
//     };

//   } catch (error) {
//     logger.error('Error in getActivities:', error);
//     return {
//       success: false,
//       message: 'Failed to fetch activities',
//       error: error.message
//     };
//   }
// };

// /**
//  * Content Moderation Methods
//  */

// /**
//  * Get content pending moderation
//  */
// const getPendingContent = async (filters = {}) => {
//   try {
//     const { contentType, priority } = filters;

//     let query = db('blog_content_moderation as bcm')
//       .select([
//         'bcm.*',
//         'ba.username as moderator_username'
//       ])
//       .leftJoin('blog_admins as ba', 'bcm.moderator_id', 'ba.id')
//       .where('bcm.status', 'pending')
//       .orderBy('bcm.priority', 'desc')
//       .orderBy('bcm.created_at', 'asc');

//     if (contentType) {
//       query = query.where('bcm.content_type', contentType);
//     }

//     if (priority !== undefined) {
//       query = query.where('bcm.priority', '>=', priority);
//     }

//     const content = await query;

//     return {
//       success: true,
//       data: content
//     };

//   } catch (error) {
//     logger.error('Error in getPendingContent:', error);
//     return {
//       success: false,
//       message: 'Failed to fetch pending content',
//       error: error.message
//     };
//   }
// };

// /**
//  * Moderate content
//  */
// const moderateContent = async (moderationId, decision, reason = null, moderatorId) => {
//   try {
//     const [updated] = await db('blog_content_moderation')
//       .where('id', moderationId)
//       .update({
//         status: decision,
//         reason,
//         moderator_id: moderatorId,
//         updated_at: new Date()
//       })
//       .returning('*');

//     if (!updated) {
//       return {
//         success: false,
//         message: 'Moderation record not found'
//       };
//     }

//     // Log the moderation activity
//     await logActivity(
//       moderatorId,
//       'moderate',
//       updated.content_type,
//       updated.content_id,
//       { decision, reason, moderationId }
//     );

//     return {
//       success: true,
//       data: updated,
//       message: 'Content moderated successfully'
//     };

//   } catch (error) {
//     logger.error('Error in moderateContent:', error);
//     return {
//       success: false,
//       message: 'Failed to moderate content',
//       error: error.message
//     };
//   }
// };

// /**
//  * Permission Check Methods
//  */

// /**
//  * Check if admin has permission
//  */
// const hasPermission = (admin, permission) => {
//   try {
//     if (admin.role === 'super_admin') {
//       return true;
//     }

//     const permissions = JSON.parse(admin.permissions || '[]');
//     return permissions.includes(permission);

//   } catch (error) {
//     logger.error('Error in hasPermission:', error);
//     return false;
//   }
// };

// /**
//  * Get admin dashboard stats
//  */
// const getDashboardStats = async () => {
//   try {
//     // Get various stats for the dashboard
//     const [
//       totalPosts,
//       publishedPosts,
//       draftPosts,
//       totalComments,
//       pendingComments,
//       totalViews,
//       totalLikes,
//       activeAdmins
//     ] = await Promise.all([
//       db('blog_posts').count('id as count').first(),
//       db('blog_posts').where('status', 'published').count('id as count').first(),
//       db('blog_posts').where('status', 'draft').count('id as count').first(),
//       db('blog_comments').count('id as count').first(),
//       db('blog_comments').where('status', 'pending').count('id as count').first(),
//       db('blog_posts').sum('views_count as total').first(),
//       db('blog_posts').sum('likes_count as total').first(),
//       db('blog_admins').where('is_active', true).count('id as count').first()
//     ]);

//     // Get recent activities
//     const recentActivities = await getActivities({ limit: 10, page: 1 });

//     // Get pending moderation count
//     const pendingModeration = await db('blog_content_moderation')
//       .where('status', 'pending')
//       .count('id as count')
//       .first();

//     return {
//       success: true,
//       data: {
//         posts: {
//           total: parseInt(totalPosts.count),
//           published: parseInt(publishedPosts.count),
//           draft: parseInt(draftPosts.count)
//         },
//         comments: {
//           total: parseInt(totalComments.count),
//           pending: parseInt(pendingComments.count)
//         },
//         engagement: {
//           totalViews: parseInt(totalViews.total || 0),
//           totalLikes: parseInt(totalLikes.total || 0)
//         },
//         administration: {
//           activeAdmins: parseInt(activeAdmins.count),
//           pendingModeration: parseInt(pendingModeration.count)
//         },
//         recentActivities: recentActivities.data || []
//       }
//     };

//   } catch (error) {
//     logger.error('Error in getDashboardStats:', error);
//     return {
//       success: false,
//       message: 'Failed to fetch dashboard stats',
//       error: error.message
//     };
//   }
// };

// // #TODO: Implement admin password reset functionality
// // #TODO: Add admin role hierarchy validation
// // #TODO: Implement admin session management with IP restrictions
// // #TODO: Add admin notification system
// // #TODO: Implement admin audit log export functionality

// module.exports = {
//   // Authentication
//   authenticateAdmin,
//   verifyAdminToken,
//   logoutAdmin,

//   // Admin Management
//   getAdmins,
//   createAdmin,
//   updateAdmin,
//   deleteAdmin,

//   // Activity Logging
//   logActivity,
//   getActivities,

//   // Content Moderation
//   getPendingContent,
//   moderateContent,

//   // Permissions
//   hasPermission,

//   // Dashboard
//   getDashboardStats
// };
