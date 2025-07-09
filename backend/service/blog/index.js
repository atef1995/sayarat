/**
 * Blog Service - Main Entry Point
 * 
 * Exports all blog service modules following modular architecture
 * and SOLID principles for maintainability and testability.
 */

const postService = require('./posts');
const postManagement = require('./postManagement');
const postQueries = require('./postQueries');
const categoryService = require('./categories');
const tagService = require('./tags');
const likeService = require('./likes');
const viewService = require('./views');
const utilsService = require('./utils');
const commentService = require('./comments');

module.exports = {
  // Core Post operations
  getPosts: postService.getPosts,
  getPostById: postService.getPostById,
  createPost: postService.createPost,
  updatePost: postService.updatePost,
  deletePost: postService.deletePost,

  // Post Management operations
  getAllPosts: postManagement.getAllPosts,
  publishPost: postManagement.publishPost,
  unpublishPost: postManagement.unpublishPost,
  schedulePost: postManagement.schedulePost,
  toggleFeaturedPost: postManagement.toggleFeaturedPost,
  bulkDeletePosts: postManagement.bulkDeletePosts,

  // Post Query operations
  getFeaturedPosts: postQueries.getFeaturedPosts,
  getTrendingPosts: postQueries.getTrendingPosts,
  getRecentPosts: postQueries.getRecentPosts,
  getPostsByCategory: postQueries.getPostsByCategory,
  getPostsByTag: postQueries.getPostsByTag,
  getPostsByAuthor: postQueries.getPostsByAuthor,
  getPostBySlug: postQueries.getPostBySlug,

  // Category operations
  getAllCategories: categoryService.getAllCategories,
  createCategory: categoryService.createCategory,
  getCategoryById: categoryService.getCategoryById,
  updateCategory: categoryService.updateCategory,
  deleteCategory: categoryService.deleteCategory,

  // Tag operations
  ...tagService,

  // Like operations
  togglePostLike: likeService.togglePostLike,
  likePost: likeService.likePost,
  unlikePost: likeService.unlikePost,
  getLikeCount: likeService.getLikeCount,
  isPostLikedByUser: likeService.isPostLikedByUser,
  getUserLikes: likeService.getUserLikes,

  // View operations
  trackPostView: viewService.trackPostView,
  incrementViewCount: viewService.incrementViewCount,
  getViewCount: viewService.getViewCount,
  getViewsByPost: viewService.getViewsByPost,
  getViewsByUser: viewService.getViewsByUser,
  getMostViewedPosts: viewService.getMostViewedPosts,

  // Comment operations
  getPostComments: commentService.getPostComments,
  addPostComment: commentService.addPostComment,
  replyToComment: commentService.replyToComment,
  getCommentById: commentService.getCommentById,
  updateComment: commentService.updateComment,
  deleteComment: commentService.deleteComment,
  getAllComments: commentService.getAllComments,
  approveComment: commentService.approveComment,
  disapproveComment: commentService.disapproveComment,
  adminDeleteComment: commentService.adminDeleteComment,
  bulkModerateComments: commentService.bulkModerateComments,


  // Utility operations
  ...utilsService
};
