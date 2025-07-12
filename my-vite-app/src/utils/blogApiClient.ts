/**
 * Blog API Client
 *
 * Specialized API client for blog-related endpoints.
 * Extends the generic API client with blog-specific functionality.
 * Implements Strategy pattern for different content types.
 */

import { apiClient, ApiResponse } from "./apiClient";
import {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogComment,
  BlogSearchParams,
  BlogPaginationResponse,
  BlogPostResponse,
  BlogPostsResponse,
  BlogCategoriesResponse,
  BlogTagsResponse,
  BlogCommentsResponse,
  BlogStats,
  CreateBlogPostData,
  UpdateBlogPostData,
  BlogCommentForm,
  BlogCategoryForm,
} from "../types/blogTypes";

// #TODO: Implement caching strategy for frequently accessed data
// #TODO: Add offline support with IndexedDB integration
// #TODO: Implement background sync for content creation

/**
 * Blog API endpoints configuration
 */
const BLOG_ENDPOINTS = {
  POSTS: "/blog/posts",
  CATEGORIES: "/blog/categories",
  TAGS: "/blog/tags",
  COMMENTS: "/blog/comments",
  STATS: "/blog/stats",
  UPLOAD: "/blog/upload",
} as const;

/**
 * Blog API Client Class implementing Strategy pattern
 */
class BlogApiClient {
  private static instance: BlogApiClient;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): BlogApiClient {
    if (!BlogApiClient.instance) {
      BlogApiClient.instance = new BlogApiClient();
    }
    return BlogApiClient.instance;
  }

  /**
   * Build query string from search parameters
   */
  private buildQueryString(params: BlogSearchParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }

  /**
   * Handle blog API response with error checking
   */
  private handleBlogResponse<T>(response: ApiResponse<T>): T {
    if (response.success && response.data !== undefined) {
      return response.data;
    }
    throw new Error(response.error || "Invalid response format from server");
  }

  // Posts API Methods
  async getPosts(
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString
      ? `${BLOG_ENDPOINTS.POSTS}?${queryString}`
      : BLOG_ENDPOINTS.POSTS;

    const response = await apiClient.get<
      ApiResponse<BlogPost[]> & {
        pagination?: BlogPaginationResponse<BlogPost>["pagination"];
      }
    >(endpoint);

    if (response.success && Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: response.pagination || {
          currentPage: 1,
          totalPages: Math.ceil(response.data.length / 12),
          totalItems: response.data.length,
          itemsPerPage: response.data.length,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    throw new Error(response.error || "Invalid response format from server");
  }

  async getFeaturedPosts(limit = 5): Promise<BlogPost[]> {
    const response = await apiClient.get<ApiResponse<BlogPost[]>>(
      `${BLOG_ENDPOINTS.POSTS}/featured?limit=${limit}`
    );
    return this.handleBlogResponse(response);
  }

  async getTrendingPosts(limit = 10, days = 7): Promise<BlogPost[]> {
    const response = await apiClient.get<ApiResponse<BlogPost[]>>(
      `${BLOG_ENDPOINTS.POSTS}/trending?limit=${limit}&days=${days}`
    );
    return this.handleBlogResponse(response);
  }

  async getRecentPosts(limit = 5): Promise<BlogPost[]> {
    const response = await apiClient.get<ApiResponse<BlogPost[]>>(
      `${BLOG_ENDPOINTS.POSTS}/recent?limit=${limit}`
    );
    return this.handleBlogResponse(response);
  }

  async getPopularPosts(limit = 5): Promise<BlogPost[]> {
    const response = await apiClient.get<ApiResponse<BlogPost[]>>(
      `${BLOG_ENDPOINTS.POSTS}/popular?limit=${limit}`
    );
    return this.handleBlogResponse(response);
  }

  async getPost(slug: string): Promise<BlogPost> {
    const response = await apiClient.get<BlogPostResponse>(
      `${BLOG_ENDPOINTS.POSTS}/${slug}`
    );
    if (!response.data) {
      throw new Error("Post not found");
    }
    return response.data;
  }

  async createPost(postData: CreateBlogPostData): Promise<BlogPost> {
    const formData = apiClient.createFormData(
      postData as unknown as Record<string, unknown>
    );
    const response = await apiClient.post<BlogPostResponse>(
      BLOG_ENDPOINTS.POSTS,
      formData
    );
    if (!response.data) {
      throw new Error("Failed to create post");
    }
    return response.data;
  }

  async updatePost(postData: UpdateBlogPostData): Promise<BlogPost> {
    const { id, ...updateData } = postData;
    const formData = apiClient.createFormData(
      updateData as unknown as Record<string, unknown>
    );
    const response = await apiClient.put<BlogPostResponse>(
      `${BLOG_ENDPOINTS.POSTS}/${id}`,
      formData
    );
    if (!response.data) {
      throw new Error("Failed to update post");
    }
    return response.data;
  }

  async deletePost(postId: number): Promise<void> {
    await apiClient.delete(`${BLOG_ENDPOINTS.POSTS}/${postId}`);
  }

  async toggleLike(
    postId: number
  ): Promise<{ liked: boolean; likes_count: number }> {
    const response = await apiClient.post<
      ApiResponse<{ liked: boolean; likes_count: number }>
    >(`${BLOG_ENDPOINTS.POSTS}/${postId}/like`);
    return this.handleBlogResponse(response);
  }

  async trackView(postId: number): Promise<void> {
    try {
      await apiClient.post(`${BLOG_ENDPOINTS.POSTS}/${postId}/view`);
    } catch (error) {
      // Don't throw error for view tracking failures
      console.warn("Failed to track post view:", error);
    }
  }

  // Categories API Methods
  async getCategories(includeInactive = false): Promise<BlogCategory[]> {
    const endpoint = includeInactive
      ? `${BLOG_ENDPOINTS.CATEGORIES}?include_inactive=true`
      : BLOG_ENDPOINTS.CATEGORIES;
    const response = await apiClient.get<BlogCategoriesResponse>(endpoint);
    return this.handleBlogResponse(response);
  }

  async createCategory(categoryData: BlogCategoryForm): Promise<BlogCategory> {
    const response = await apiClient.post<ApiResponse<BlogCategory>>(
      BLOG_ENDPOINTS.CATEGORIES,
      categoryData
    );
    return this.handleBlogResponse(response);
  }

  // Tags API Methods
  async getTags(): Promise<BlogTag[]> {
    const response = await apiClient.get<
      BlogTagsResponse | { data: BlogTag[]; pagination: unknown }
    >(BLOG_ENDPOINTS.TAGS);

    // Handle both old and new response formats
    if ("data" in response && Array.isArray(response.data)) {
      return response.data;
    } else if ("success" in response && response.success && response.data) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }
    throw new Error("Invalid response format from tags API");
  }

  async createTag(tagData: { name: string; slug?: string }): Promise<BlogTag> {
    // Generate slug if not provided
    const generateSlug = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();
    };

    const payload = {
      name: tagData.name,
      slug: tagData.slug || generateSlug(tagData.name),
    };

    const response = await apiClient.post<ApiResponse<BlogTag>>(
      BLOG_ENDPOINTS.TAGS,
      payload
    );
    return this.handleBlogResponse(response);
  }

  // Comments API Methods
  async getComments(
    postId: number,
    page = 1,
    limit = 10
  ): Promise<BlogPaginationResponse<BlogComment>> {
    const response = await apiClient.get<BlogCommentsResponse>(
      `${BLOG_ENDPOINTS.POSTS}/${postId}/comments?page=${page}&limit=${limit}`
    );
    if (!response.data) {
      throw new Error("Failed to fetch comments");
    }
    return response.data;
  }

  async addComment(commentData: BlogCommentForm): Promise<BlogComment> {
    const response = await apiClient.post<ApiResponse<BlogComment>>(
      `${BLOG_ENDPOINTS.POSTS}/${commentData.post_id}/comments`,
      commentData
    );
    return this.handleBlogResponse(response);
  }

  async replyToComment(
    commentId: number,
    content: string
  ): Promise<BlogComment> {
    const response = await apiClient.post<ApiResponse<BlogComment>>(
      `${BLOG_ENDPOINTS.COMMENTS}/${commentId}/reply`,
      { content }
    );
    return this.handleBlogResponse(response);
  }

  // Search API Methods
  async searchPosts(
    params: BlogSearchParams
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const queryString = this.buildQueryString(params);
    const response = await apiClient.get<BlogPostsResponse>(
      `/blog/search?${queryString}`
    );
    if (!response.data) {
      throw new Error("Search failed");
    }
    return response.data;
  }

  // Category-specific methods
  async getPostsByCategory(
    categorySlug: string,
    page = 1,
    limit = 10
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const response = await apiClient.get<BlogPostsResponse>(
      `/blog/category/${categorySlug}/posts?page=${page}&limit=${limit}`
    );
    if (!response.data) {
      throw new Error("Failed to fetch posts by category");
    }
    return response.data;
  }

  async getPostsByTag(
    tagSlug: string,
    page = 1,
    limit = 10
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const response = await apiClient.get<BlogPostsResponse>(
      `/blog/tag/${tagSlug}/posts?page=${page}&limit=${limit}`
    );
    if (!response.data) {
      throw new Error("Failed to fetch posts by tag");
    }
    return response.data;
  }

  async getPostsByAuthor(
    username: string,
    page = 1,
    limit = 10
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const response = await apiClient.get<BlogPostsResponse>(
      `/blog/author/${username}/posts?page=${page}&limit=${limit}`
    );
    if (!response.data) {
      throw new Error("Failed to fetch posts by author");
    }
    return response.data;
  }

  // Car-specific methods
  async getCarMarketNews(
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString
      ? `/blog/car-news?${queryString}`
      : "/blog/car-news";
    const response = await apiClient.get<BlogPostsResponse>(endpoint);
    if (!response.data) {
      throw new Error("Failed to fetch car market news");
    }
    return response.data;
  }

  async getCarReviews(
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString
      ? `/blog/car-reviews?${queryString}`
      : "/blog/car-reviews";
    const response = await apiClient.get<BlogPostsResponse>(endpoint);
    if (!response.data) {
      throw new Error("Failed to fetch car reviews");
    }
    return response.data;
  }

  async getCarGuides(
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString
      ? `/blog/car-guides?${queryString}`
      : "/blog/car-guides";
    const response = await apiClient.get<BlogPostsResponse>(endpoint);
    if (!response.data) {
      throw new Error("Failed to fetch car guides");
    }
    return response.data;
  }

  async getCarModelPosts(
    make: string,
    model: string,
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const queryString = this.buildQueryString(params);
    const endpoint = queryString
      ? `/blog/cars/${make}/${model}/posts?${queryString}`
      : `/blog/cars/${make}/${model}/posts`;
    const response = await apiClient.get<BlogPostsResponse>(endpoint);
    if (!response.data) {
      throw new Error("Failed to fetch car model posts");
    }
    return response.data;
  }

  // Upload methods
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await apiClient.post<
      ApiResponse<{ url: string; filename: string }>
    >(`${BLOG_ENDPOINTS.UPLOAD}/image`, formData);
    return this.handleBlogResponse(response);
  }

  // Analytics methods
  async getStats(): Promise<BlogStats> {
    const response = await apiClient.get<ApiResponse<BlogStats>>(
      BLOG_ENDPOINTS.STATS
    );
    return this.handleBlogResponse(response);
  }

  // Post status management methods
  async toggleFeaturedPost(postId: number): Promise<BlogPost> {
    const response = await apiClient.put<ApiResponse<BlogPost>>(
      `${BLOG_ENDPOINTS.POSTS}/${postId}/toggle-featured`
    );
    return this.handleBlogResponse(response);
  }

  async publishPost(postId: number): Promise<BlogPost> {
    const response = await apiClient.put<ApiResponse<BlogPost>>(
      `${BLOG_ENDPOINTS.POSTS}/${postId}/publish`
    );
    return this.handleBlogResponse(response);
  }

  async unpublishPost(postId: number): Promise<BlogPost> {
    const response = await apiClient.put<ApiResponse<BlogPost>>(
      `${BLOG_ENDPOINTS.POSTS}/${postId}/unpublish`
    );
    return this.handleBlogResponse(response);
  }
}

// Export singleton instance
export const blogApiClient = BlogApiClient.getInstance();
