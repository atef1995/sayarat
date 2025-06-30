/**
 * Blog Service
 *
 * Frontend service for handling blog-related API calls.
 * Implements proper error handling, type safety, and modular architecture.
 */

import { loadApiConfig } from "../config/apiConfig";
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

const { apiUrl } = loadApiConfig();

// Type guard for File objects
const isFile = (value: unknown): value is File => {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
};

/**
 * Generic API request handler with error handling
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const token = localStorage.getItem("token");
    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(`${apiUrl}/api/blog${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Blog API request failed:", error);
    throw error;
  }
};

/**
 * Blog Posts API Methods
 */

/**
 * Get blog posts with filtering and pagination
 */
export const getBlogPosts = async (
  params: BlogSearchParams = {}
): Promise<BlogPaginationResponse<BlogPost>> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/posts${queryString ? `?${queryString}` : ""}`;

  const response = await apiRequest<BlogPostsResponse>(endpoint);
  return response.data!;
};

/**
 * Get featured blog posts
 */
export const getFeaturedPosts = async (limit = 5): Promise<BlogPost[]> => {
  const response = await apiRequest<{ success: boolean; data: BlogPost[] }>(
    `/posts/featured?limit=${limit}`
  );
  return response.data;
};

/**
 * Get trending blog posts
 */
export const getTrendingPosts = async (
  limit = 10,
  days = 7
): Promise<BlogPost[]> => {
  const response = await apiRequest<{ success: boolean; data: BlogPost[] }>(
    `/posts/trending?limit=${limit}&days=${days}`
  );
  return response.data;
};

/**
 * Get recent blog posts
 */
export const getRecentPosts = async (limit = 5): Promise<BlogPost[]> => {
  const response = await apiRequest<{ success: boolean; data: BlogPost[] }>(
    `/posts/recent?limit=${limit}`
  );
  return response.data;
};

/**
 * Get single blog post by slug
 */
export const getBlogPost = async (slug: string): Promise<BlogPost> => {
  const response = await apiRequest<BlogPostResponse>(`/posts/${slug}`);
  return response.data!;
};

/**
 * Get posts by category
 */
export const getPostsByCategory = async (
  categorySlug: string,
  page = 1,
  limit = 10
): Promise<BlogPaginationResponse<BlogPost>> => {
  const response = await apiRequest<BlogPostsResponse>(
    `/category/${categorySlug}/posts?page=${page}&limit=${limit}`
  );
  return response.data!;
};

/**
 * Get posts by tag
 */
export const getPostsByTag = async (
  tagSlug: string,
  page = 1,
  limit = 10
): Promise<BlogPaginationResponse<BlogPost>> => {
  const response = await apiRequest<BlogPostsResponse>(
    `/tag/${tagSlug}/posts?page=${page}&limit=${limit}`
  );
  return response.data!;
};

/**
 * Get posts by author
 */
export const getPostsByAuthor = async (
  username: string,
  page = 1,
  limit = 10
): Promise<BlogPaginationResponse<BlogPost>> => {
  const response = await apiRequest<BlogPostsResponse>(
    `/author/${username}/posts?page=${page}&limit=${limit}`
  );
  return response.data!;
};

/**
 * Search blog posts
 */
export const searchBlogPosts = async (params: {
  query: string;
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  car_make?: string;
  car_model?: string;
}): Promise<BlogPaginationResponse<BlogPost>> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const response = await apiRequest<BlogPostsResponse>(
    `/search?${searchParams.toString()}`
  );
  return response.data!;
};

/**
 * Create new blog post
 */
export const createBlogPost = async (
  postData: CreateBlogPostData
): Promise<BlogPost> => {
  const formData = new FormData();

  Object.entries(postData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (isFile(value)) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  const response = await apiRequest<BlogPostResponse>("/posts", {
    method: "POST",
    body: formData,
    headers: {}, // Remove Content-Type to let browser set it for FormData
  });

  return response.data!;
};

/**
 * Update blog post
 */
export const updateBlogPost = async (
  postData: UpdateBlogPostData
): Promise<BlogPost> => {
  const { id, ...updateData } = postData;
  const formData = new FormData();

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (isFile(value)) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  const response = await apiRequest<BlogPostResponse>(`/posts/${id}`, {
    method: "PUT",
    body: formData,
    headers: {}, // Remove Content-Type to let browser set it for FormData
  });

  return response.data!;
};

/**
 * Delete blog post
 */
export const deleteBlogPost = async (postId: number): Promise<void> => {
  await apiRequest(`/posts/${postId}`, {
    method: "DELETE",
  });
};

/**
 * Toggle post like
 */
export const togglePostLike = async (
  postId: number
): Promise<{ liked: boolean; likes_count: number }> => {
  const response = await apiRequest<{
    success: boolean;
    data: { liked: boolean; likes_count: number };
  }>(`/posts/${postId}/like`, {
    method: "POST",
  });

  return response.data;
};

/**
 * Track post view
 */
export const trackPostView = async (postId: number): Promise<void> => {
  try {
    await apiRequest(`/posts/${postId}/view`, {
      method: "POST",
    });
  } catch (error) {
    // Don't throw error for view tracking failures
    console.warn("Failed to track post view:", error);
  }
};

/**
 * Upload image for blog post
 */
export const uploadBlogImage = async (
  file: File
): Promise<{ url: string; filename: string }> => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiRequest<{
    success: boolean;
    data: { url: string; filename: string };
  }>("/upload/image", {
    method: "POST",
    body: formData,
    // Don't set Content-Type header, let browser set it for FormData
  });

  return response.data;
};

/**
 * Get a single blog post by ID or slug
 */
const getPost = async (identifier: string): Promise<BlogPostResponse> => {
  return apiRequest<BlogPostResponse>(`/api/blog/posts/${identifier}`);
};

/**
 * Track a blog post view
 */
const trackView = async (postId: string): Promise<{ success: boolean }> => {
  return apiRequest<{ success: boolean }>(`/api/blog/posts/${postId}/view`, {
    method: "POST",
  });
};

/**
 * Toggle like for a blog post
 */
const toggleLike = async (
  postId: string
): Promise<{ success: boolean; action: string }> => {
  return apiRequest<{ success: boolean; action: string }>(
    `/api/blog/posts/${postId}/like`,
    {
      method: "POST",
    }
  );
};

/**
 * Categories API Methods
 */

/**
 * Get all blog categories
 */
export const getBlogCategories = async (
  includeInactive = false
): Promise<BlogCategory[]> => {
  const endpoint = `/categories${
    includeInactive ? "?include_inactive=true" : ""
  }`;
  const response = await apiRequest<BlogCategoriesResponse>(endpoint);
  return response.data!;
};

/**
 * Create new category (Admin only)
 */
export const createBlogCategory = async (
  categoryData: BlogCategoryForm
): Promise<BlogCategory> => {
  const response = await apiRequest<{ success: boolean; data: BlogCategory }>(
    "/categories",
    {
      method: "POST",
      body: JSON.stringify(categoryData),
    }
  );

  return response.data;
};

/**
 * Tags API Methods
 */

/**
 * Get all blog tags
 */
export const getBlogTags = async (): Promise<BlogTag[]> => {
  const response = await apiRequest<BlogTagsResponse>("/tags");
  return response.data!;
};

/**
 * Create new blog tag
 */
export const createBlogTag = async (tagData: {
  name: string;
  slug?: string;
}): Promise<BlogTag> => {
  // Generate slug if not provided
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  };

  const response = await apiRequest<{ success: boolean; data: BlogTag }>(
    "/tags",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: tagData.name,
        slug: tagData.slug || generateSlug(tagData.name),
      }),
    }
  );
  return response.data;
};

/**
 * Comments API Methods
 */

/**
 * Get comments for a blog post
 */
export const getBlogComments = async (
  postId: number,
  page = 1,
  limit = 10
): Promise<BlogPaginationResponse<BlogComment>> => {
  const response = await apiRequest<BlogCommentsResponse>(
    `/posts/${postId}/comments?page=${page}&limit=${limit}`
  );
  return response.data!;
};

/**
 * Add comment to blog post
 */
export const addBlogComment = async (
  commentData: BlogCommentForm
): Promise<BlogComment> => {
  const response = await apiRequest<{ success: boolean; data: BlogComment }>(
    `/posts/${commentData.post_id}/comments`,
    {
      method: "POST",
      body: JSON.stringify(commentData),
    }
  );

  return response.data;
};

/**
 * Reply to a comment
 */
export const replyToBlogComment = async (
  commentId: number,
  content: string
): Promise<BlogComment> => {
  const response = await apiRequest<{ success: boolean; data: BlogComment }>(
    `/comments/${commentId}/reply`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );

  return response.data;
};

/**
 * Car-Specific API Methods
 */

/**
 * Get car market news
 */
export const getCarMarketNews = async (
  params: BlogSearchParams = {}
): Promise<BlogPaginationResponse<BlogPost>> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/car-news${queryString ? `?${queryString}` : ""}`;

  const response = await apiRequest<BlogPostsResponse>(endpoint);
  return response.data!;
};

/**
 * Get car reviews
 */
export const getCarReviews = async (
  params: BlogSearchParams = {}
): Promise<BlogPaginationResponse<BlogPost>> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/car-reviews${queryString ? `?${queryString}` : ""}`;

  const response = await apiRequest<BlogPostsResponse>(endpoint);
  return response.data!;
};

/**
 * Get car guides
 */
export const getCarGuides = async (
  params: BlogSearchParams = {}
): Promise<BlogPaginationResponse<BlogPost>> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/car-guides${queryString ? `?${queryString}` : ""}`;

  const response = await apiRequest<BlogPostsResponse>(endpoint);
  return response.data!;
};

/**
 * Get posts for specific car make/model
 */
export const getCarModelPosts = async (
  make: string,
  model: string,
  params: BlogSearchParams = {}
): Promise<BlogPaginationResponse<BlogPost>> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/cars/${make}/${model}/posts${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await apiRequest<BlogPostsResponse>(endpoint);
  return response.data!;
};

/**
 * Analytics API Methods
 */

/**
 * Get blog statistics
 */
export const getBlogStats = async (): Promise<BlogStats> => {
  const response = await apiRequest<{ success: boolean; data: BlogStats }>(
    "/stats"
  );
  return response.data;
};

/**
 * Error Handling Utilities
 */

/**
 * Check if an error is a network error
 */
export const isNetworkError = (error: Error): boolean => {
  return error.message.includes("fetch") || error.message.includes("network");
};

/**
 * Check if an error is an authentication error
 */
export const isAuthError = (error: Error): boolean => {
  return (
    error.message.includes("401") || error.message.includes("Unauthorized")
  );
};

/**
 * Check if an error is a validation error
 */
export const isValidationError = (error: Error): boolean => {
  return error.message.includes("400") || error.message.includes("validation");
};

const blogService = {
  // Posts
  getBlogPosts,
  getFeaturedPosts,
  getBlogPost,
  getPost, // Add this
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  searchBlogPosts,
  uploadBlogImage,
  trackView, // Add this
  toggleLike, // Add this

  // Categories & Tags
  getBlogCategories,
  createBlogCategory,
  getBlogTags,
  createBlogTag,

  // Comments
  getBlogComments,
  addBlogComment,
  replyToBlogComment,

  // Car-specific
  getCarMarketNews,
  getCarReviews,
  getCarGuides,
  getCarModelPosts,

  // Analytics
  getBlogStats,

  // Utilities
  isNetworkError,
  isAuthError,
  isValidationError,
};

export default blogService;
