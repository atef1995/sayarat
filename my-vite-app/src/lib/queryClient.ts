/**
 * React Query Client Configuration
 *
 * Centralized configuration for TanStack React Query.
 * Implements caching strategies and error handling.
 */

import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../utils/apiClient";
import { BlogPost, BlogSearchParams } from "../types/blogTypes";

/**
 * Default query configuration
 */
const defaultQueryConfig = {
  queries: {
    // Cache data for 5 minutes by default
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Keep data in cache for 10 minutes after becoming unused
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on authentication errors
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      // Don't retry on validation errors
      if (error instanceof ApiError && error.status === 400) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
    // Don't refetch on window focus for performance
    refetchOnWindowFocus: false,
    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once
    retry: 1,
    retryDelay: 1000,
  },
} as const;

/**
 * Create and configure the React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryConfig,
});

/**
 * Query key factory for consistent cache key generation
 * This ensures proper cache invalidation and organization
 */
export const queryKeys = {
  // Blog posts
  posts: {
    all: ["posts"] as const,
    lists: () => [...queryKeys.posts.all, "list"] as const,
    list: (params: BlogSearchParams) =>
      [...queryKeys.posts.lists(), params] as const,
    details: () => [...queryKeys.posts.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.posts.details(), slug] as const,
    featured: (limit?: number) =>
      [...queryKeys.posts.all, "featured", limit] as const,
    trending: (limit?: number, days?: number) =>
      [...queryKeys.posts.all, "trending", { limit, days }] as const,
    recent: (limit?: number) =>
      [...queryKeys.posts.all, "recent", limit] as const,
    popular: (limit?: number) =>
      [...queryKeys.posts.all, "popular", limit] as const,
    search: (params: BlogSearchParams) =>
      [...queryKeys.posts.all, "search", params] as const,
    byCategory: (categorySlug: string, page?: number, limit?: number) =>
      [
        ...queryKeys.posts.all,
        "category",
        categorySlug,
        { page, limit },
      ] as const,
    byTag: (tagSlug: string, page?: number, limit?: number) =>
      [...queryKeys.posts.all, "tag", tagSlug, { page, limit }] as const,
    byAuthor: (username: string, page?: number, limit?: number) =>
      [...queryKeys.posts.all, "author", username, { page, limit }] as const,
    carNews: (params?: BlogSearchParams) =>
      [...queryKeys.posts.all, "car-news", params] as const,
    carReviews: (params?: BlogSearchParams) =>
      [...queryKeys.posts.all, "car-reviews", params] as const,
    carGuides: (params?: BlogSearchParams) =>
      [...queryKeys.posts.all, "car-guides", params] as const,
    carModel: (make: string, model: string, params?: BlogSearchParams) =>
      [...queryKeys.posts.all, "car-model", make, model, params] as const,
  },

  // Categories
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (includeInactive?: boolean) =>
      [...queryKeys.categories.lists(), { includeInactive }] as const,
  },

  // Tags
  tags: {
    all: ["tags"] as const,
    lists: () => [...queryKeys.tags.all, "list"] as const,
    list: () => [...queryKeys.tags.lists()] as const,
  },

  // Comments
  comments: {
    all: ["comments"] as const,
    lists: () => [...queryKeys.comments.all, "list"] as const,
    list: (postId: number, page?: number, limit?: number) =>
      [...queryKeys.comments.lists(), postId, { page, limit }] as const,
  },

  // Stats
  stats: {
    all: ["stats"] as const,
    blog: () => [...queryKeys.stats.all, "blog"] as const,
  },
} as const;

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
  // Invalidate all posts
  allPosts: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),

  // Invalidate specific post
  post: (slug: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(slug) }),

  // Invalidate posts lists (after creating/updating posts)
  postsLists: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() }),

  // Invalidate all categories
  allCategories: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),

  // Invalidate all tags
  allTags: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.tags.all }),

  // Invalidate comments for a post
  postComments: (postId: number) =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.comments.lists(),
      predicate: (query) => query.queryKey.includes(postId),
    }),

  // Invalidate stats
  stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
} as const;

/**
 * Optimistic update helpers
 */
export const optimisticUpdates = {
  // Update post like count optimistically
  togglePostLike: (postSlug: string, liked: boolean, newCount: number) => {
    queryClient.setQueryData(
      queryKeys.posts.detail(postSlug),
      (oldData: BlogPost | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            liked,
            likes_count: newCount,
          };
        }
        return oldData;
      }
    );
  },

  // Update post view count optimistically
  incrementPostViews: (postSlug: string) => {
    queryClient.setQueryData(
      queryKeys.posts.detail(postSlug),
      (oldData: BlogPost | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            views_count: (oldData.views_count || 0) + 1,
          };
        }
        return oldData;
      }
    );
  },
} as const;
