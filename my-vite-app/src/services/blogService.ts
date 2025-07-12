/**
 * Blog Service
 *
 * High-level service layer for blog functionality.
 * Implements facade pattern to provide a simple interface to complex subsystems.
 * Follows Single Responsibility Principle by delegating API calls to specialized clients.
 */

import { blogApiClient } from "../utils/blogApiClient";
import {
  isNetworkError as apiIsNetworkError,
  isAuthError as apiIsAuthError,
  isValidationError as apiIsValidationError,
  isServerError as apiIsServerError,
} from "../utils/apiClient";
import {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogComment,
  BlogSearchParams,
  BlogPaginationResponse,
  BlogStats,
  CreateBlogPostData,
  UpdateBlogPostData,
  BlogCommentForm,
  BlogCategoryForm,
} from "../types/blogTypes";

// #TODO: Implement caching layer with TTL for frequently accessed data
// #TODO: Add offline support with background sync
// #TODO: Implement rate limiting for user actions
// #TODO: Add analytics tracking for user interactions

/**
 * Blog Service Class implementing Facade pattern
 * Provides a simplified interface to blog-related operations
 */
class BlogService {
  private static instance: BlogService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): BlogService {
    if (!BlogService.instance) {
      BlogService.instance = new BlogService();
    }
    return BlogService.instance;
  }

  /**
   * Posts Management Methods
   */

  /**
   * Get blog posts with filtering and pagination
   */
  async getBlogPosts(
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    try {
      return await blogApiClient.getPosts(params);
    } catch (error) {
      console.error("Error in getBlogPosts:", error);
      throw new Error(
        `Failed to fetch blog posts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get featured blog posts
   */
  async getFeaturedPosts(limit = 5): Promise<BlogPost[]> {
    return blogApiClient.getFeaturedPosts(limit);
  }

  /**
   * Get trending blog posts
   */
  async getTrendingPosts(limit = 10, days = 7): Promise<BlogPost[]> {
    return blogApiClient.getTrendingPosts(limit, days);
  }

  /**
   * Get recent blog posts
   */
  async getRecentPosts(limit = 5): Promise<BlogPost[]> {
    return blogApiClient.getRecentPosts(limit);
  }

  /**
   * Get popular blog posts
   */
  async getPopularPosts(limit = 5): Promise<BlogPost[]> {
    return blogApiClient.getPopularPosts(limit);
  }

  /**
   * Get single blog post by slug
   */
  async getBlogPost(slug: string): Promise<BlogPost> {
    return blogApiClient.getPost(slug);
  }

  /**
   * Get single blog post by ID
   */
  async getBlogPostById(id: string | number): Promise<BlogPost> {
    return blogApiClient.getPostById(id);
  }

  /**
   * Legacy method for backward compatibility
   */
  async getPost(
    identifier: string
  ): Promise<{ success: boolean; data?: BlogPost }> {
    try {
      const post = await blogApiClient.getPost(identifier);
      return { success: true, data: post };
    } catch (error) {
      console.error("Error in getPost:", error);
      return { success: false };
    }
  }

  /**
   * Create new blog post
   */
  async createBlogPost(postData: CreateBlogPostData): Promise<BlogPost> {
    return blogApiClient.createPost(postData);
  }

  /**
   * Update blog post
   */
  async updateBlogPost(postData: UpdateBlogPostData): Promise<BlogPost> {
    return blogApiClient.updatePost(postData);
  }

  /**
   * Delete blog post
   */
  async deleteBlogPost(postId: number): Promise<void> {
    return blogApiClient.deletePost(postId);
  }

  /**
   * Toggle post like
   */
  async toggleLike(postId: string): Promise<{
    success: boolean;
    action?: string;
    liked?: boolean;
    likes_count?: number;
  }> {
    try {
      const result = await blogApiClient.toggleLike(parseInt(postId, 10));
      return {
        success: true,
        action: result.liked ? "liked" : "unliked",
        ...result,
      };
    } catch (error) {
      console.error("Error in toggleLike:", error);
      return { success: false };
    }
  }

  /**
   * Track post view
   */
  async trackView(postId: string): Promise<{ success: boolean }> {
    try {
      await blogApiClient.trackView(parseInt(postId, 10));
      return { success: true };
    } catch (error) {
      console.warn("Failed to track view:", error);
      return { success: false };
    }
  }

  /**
   * Search Methods
   */

  /**
   * Search blog posts
   */
  async searchBlogPosts(
    params: BlogSearchParams
  ): Promise<BlogPaginationResponse<BlogPost>> {
    return blogApiClient.searchPosts(params);
  }

  /**
   * Get posts by category
   */
  async getPostsByCategory(
    categorySlug: string,
    page = 1,
    limit = 10
  ): Promise<BlogPaginationResponse<BlogPost>> {
    return blogApiClient.getPostsByCategory(categorySlug, page, limit);
  }

  /**
   * Get posts by tag
   */
  async getPostsByTag(
    tagSlug: string,
    page = 1,
    limit = 10
  ): Promise<BlogPaginationResponse<BlogPost>> {
    return blogApiClient.getPostsByTag(tagSlug, page, limit);
  }

  /**
   * Get posts by author
   */
  async getPostsByAuthor(
    username: string,
    page = 1,
    limit = 10
  ): Promise<BlogPaginationResponse<BlogPost>> {
    return blogApiClient.getPostsByAuthor(username, page, limit);
  }

  /**
   * Categories Management Methods
   */

  /**
   * Get all blog categories
   */
  async getBlogCategories(
    includeInactive = false
  ): Promise<{ success: boolean; data: BlogCategory[]; error?: string }> {
    try {
      const categories = await blogApiClient.getCategories(includeInactive);
      return { success: true, data: categories };
    } catch (error) {
      console.error("Error in getBlogCategories:", error);
      return {
        success: false,
        data: [],
        error:
          error instanceof Error ? error.message : "Failed to fetch categories",
      };
    }
  }

  /**
   * Create new category
   */
  async createBlogCategory(
    categoryData: BlogCategoryForm
  ): Promise<BlogCategory> {
    return blogApiClient.createCategory(categoryData);
  }

  /**
   * Tags Management Methods
   */

  /**
   * Get all blog tags
   */
  async getBlogTags(): Promise<BlogTag[]> {
    return blogApiClient.getTags();
  }

  /**
   * Create new blog tag
   */
  async createBlogTag(tagData: {
    name: string;
    slug?: string;
  }): Promise<BlogTag> {
    return blogApiClient.createTag(tagData);
  }

  /**
   * Comments Management Methods
   */

  /**
   * Get comments for a blog post
   */
  async getBlogComments(
    postId: number,
    page = 1,
    limit = 10
  ): Promise<BlogPaginationResponse<BlogComment>> {
    return blogApiClient.getComments(postId, page, limit);
  }

  /**
   * Add comment to blog post
   */
  async addBlogComment(commentData: BlogCommentForm): Promise<BlogComment> {
    return blogApiClient.addComment(commentData);
  }

  /**
   * Reply to a comment
   */
  async replyToBlogComment(
    commentId: number,
    content: string
  ): Promise<BlogComment> {
    return blogApiClient.replyToComment(commentId, content);
  }

  /**
   * Car-Specific Methods
   */

  /**
   * Get car market news
   */
  async getCarMarketNews(
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    return blogApiClient.getCarMarketNews(params);
  }

  /**
   * Get car reviews
   */
  async getCarReviews(
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    return blogApiClient.getCarReviews(params);
  }

  /**
   * Get car guides
   */
  async getCarGuides(
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    return blogApiClient.getCarGuides(params);
  }

  /**
   * Get posts for specific car make/model
   */
  async getCarModelPosts(
    make: string,
    model: string,
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    return blogApiClient.getCarModelPosts(make, model, params);
  }

  /**
   * File Upload Methods
   */

  /**
   * Upload image for blog post
   */
  async uploadBlogImage(
    file: File
  ): Promise<{ url: string; filename: string }> {
    return blogApiClient.uploadImage(file);
  }

  /**
   * Analytics Methods
   */

  /**
   * Get blog statistics
   */
  async getBlogStats(): Promise<BlogStats> {
    return blogApiClient.getStats();
  }
}

// Create and export singleton instance
const blogServiceInstance = BlogService.getInstance();

// Export error handling utilities with new names for backward compatibility
export const isNetworkError = apiIsNetworkError;
export const isAuthError = apiIsAuthError;
export const isValidationError = apiIsValidationError;
export const isServerError = apiIsServerError;

export default blogServiceInstance;
