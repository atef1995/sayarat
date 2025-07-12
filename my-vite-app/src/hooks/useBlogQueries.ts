/**
 * Blog Query Hooks
 *
 * React Query hooks for blog-related data fetching.
 * Implements proper caching, error handling, and optimistic updates.
 * Follows the Hook pattern for reusable stateful logic.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from "@tanstack/react-query";

import { blogApiClient } from "../utils/blogApiClient";
import {
  queryKeys,
  invalidateQueries,
  optimisticUpdates,
} from "../lib/queryClient";
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
import { ApiError } from "../utils/apiClient";

// #TODO: Add offline mutation queuing for better offline experience
// #TODO: Implement selective query invalidation for better performance
// #TODO: Add background sync for draft posts

/**
 * Posts Query Hooks
 */

// Get paginated posts with search/filter capabilities
export const useBlogPosts = (
  params: BlogSearchParams = {},
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogPost>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => blogApiClient.getPosts(params),
    ...options,
  });
};

// Get infinite scrolling posts
export const useInfiniteBlogPosts = (
  params: Omit<BlogSearchParams, "page"> = {},
  options?: Omit<
    UseInfiniteQueryOptions<
      BlogPaginationResponse<BlogPost>,
      ApiError,
      BlogPaginationResponse<BlogPost>,
      readonly unknown[],
      number
    >,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: ({ pageParam }) =>
      blogApiClient.getPosts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined,
    initialPageParam: 1,
    ...options,
  });
};

// Get featured posts
export const useFeaturedPosts = (
  limit = 5,
  options?: Omit<UseQueryOptions<BlogPost[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.posts.featured(limit),
    queryFn: () => blogApiClient.getFeaturedPosts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes - featured posts change less frequently
    ...options,
  });
};

// Get trending posts
export const useTrendingPosts = (
  limit = 10,
  days = 7,
  options?: Omit<UseQueryOptions<BlogPost[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.posts.trending(limit, days),
    queryFn: () => blogApiClient.getTrendingPosts(limit, days),
    staleTime: 5 * 60 * 1000, // 5 minutes - trending posts update frequently
    ...options,
  });
};

// Get recent posts
export const useRecentPosts = (
  limit = 5,
  options?: Omit<UseQueryOptions<BlogPost[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.posts.recent(limit),
    queryFn: () => blogApiClient.getRecentPosts(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes - recent posts update very frequently
    ...options,
  });
};

// Get popular posts
export const usePopularPosts = (
  limit = 5,
  options?: Omit<UseQueryOptions<BlogPost[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.posts.popular(limit),
    queryFn: () => blogApiClient.getPopularPosts(limit),
    staleTime: 15 * 60 * 1000, // 15 minutes - popular posts change slowly
    ...options,
  });
};

// Get single post by slug
export const useBlogPost = (
  slug: string,
  options?: Omit<UseQueryOptions<BlogPost>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.posts.detail(slug),
    queryFn: () => blogApiClient.getPost(slug),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!slug, // Only run if slug is provided
    ...options,
  });
};

// Search posts
export const useSearchPosts = (
  params: BlogSearchParams,
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogPost>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.posts.search(params),
    queryFn: () => blogApiClient.searchPosts(params),
    enabled: !!(params.search || params.category || params.tag), // Only search if there are search params
    staleTime: 2 * 60 * 1000, // 2 minutes - search results should be fresh
    ...options,
  });
};

// Get posts by category
export const usePostsByCategory = (
  categorySlug: string,
  page = 1,
  limit = 10,
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogPost>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.posts.byCategory(categorySlug, page, limit),
    queryFn: () => blogApiClient.getPostsByCategory(categorySlug, page, limit),
    enabled: !!categorySlug,
    ...options,
  });
};

// Get posts by tag
export const usePostsByTag = (
  tagSlug: string,
  page = 1,
  limit = 10,
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogPost>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.posts.byTag(tagSlug, page, limit),
    queryFn: () => blogApiClient.getPostsByTag(tagSlug, page, limit),
    enabled: !!tagSlug,
    ...options,
  });
};

// Get posts by author
export const usePostsByAuthor = (
  username: string,
  page = 1,
  limit = 10,
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogPost>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.posts.byAuthor(username, page, limit),
    queryFn: () => blogApiClient.getPostsByAuthor(username, page, limit),
    enabled: !!username,
    ...options,
  });
};

/**
 * Car-specific post hooks
 */

// Get car market news
export const useCarMarketNews = (
  params: BlogSearchParams = {},
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogPost>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.posts.carNews(params),
    queryFn: () => blogApiClient.getCarMarketNews(params),
    ...options,
  });
};

// Get car reviews
export const useCarReviews = (
  params: BlogSearchParams = {},
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogPost>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.posts.carReviews(params),
    queryFn: () => blogApiClient.getCarReviews(params),
    ...options,
  });
};

// Get car guides
export const useCarGuides = (
  params: BlogSearchParams = {},
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogPost>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.posts.carGuides(params),
    queryFn: () => blogApiClient.getCarGuides(params),
    ...options,
  });
};

// Get posts for specific car model
export const useCarModelPosts = (
  make: string,
  model: string,
  params: BlogSearchParams = {},
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogPost>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.posts.carModel(make, model, params),
    queryFn: () => blogApiClient.getCarModelPosts(make, model, params),
    enabled: !!(make && model),
    ...options,
  });
};

/**
 * Categories Query Hooks
 */

// Get all categories
export const useCategories = (
  includeInactive = false,
  options?: Omit<UseQueryOptions<BlogCategory[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.categories.list(includeInactive),
    queryFn: () => blogApiClient.getCategories(includeInactive),
    staleTime: 15 * 60 * 1000, // 15 minutes - categories change infrequently
    ...options,
  });
};

/**
 * Tags Query Hooks
 */

// Get all tags
export const useTags = (
  options?: Omit<UseQueryOptions<BlogTag[]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: () => blogApiClient.getTags(),
    staleTime: 10 * 60 * 1000, // 10 minutes - tags change moderately
    ...options,
  });
};

/**
 * Comments Query Hooks
 */

// Get comments for a post
export const useComments = (
  postId: number,
  page = 1,
  limit = 10,
  options?: Omit<
    UseQueryOptions<BlogPaginationResponse<BlogComment>>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: queryKeys.comments.list(postId, page, limit),
    queryFn: () => blogApiClient.getComments(postId, page, limit),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds - comments should be fresh
    ...options,
  });
};

/**
 * Stats Query Hooks
 */

// Get blog statistics
export const useBlogStats = (
  options?: Omit<UseQueryOptions<BlogStats>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: queryKeys.stats.blog(),
    queryFn: () => blogApiClient.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Mutation Hooks
 */

// Create new post
export const useCreatePost = (
  options?: UseMutationOptions<BlogPost, ApiError, CreateBlogPostData>
) => {
  return useMutation({
    mutationFn: blogApiClient.createPost.bind(blogApiClient),
    onSuccess: () => {
      // Invalidate and refetch posts lists
      invalidateQueries.postsLists();
      invalidateQueries.stats();
    },
    ...options,
  });
};

// Update existing post
export const useUpdatePost = (
  options?: UseMutationOptions<BlogPost, ApiError, UpdateBlogPostData>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: blogApiClient.updatePost.bind(blogApiClient),
    onSuccess: (data) => {
      // Update the specific post in cache
      queryClient.setQueryData(queryKeys.posts.detail(data.slug), data);
      // Invalidate posts lists
      invalidateQueries.postsLists();
    },
    ...options,
  });
};

// Delete post
export const useDeletePost = (
  options?: UseMutationOptions<void, ApiError, number>
) => {
  return useMutation({
    mutationFn: blogApiClient.deletePost.bind(blogApiClient),
    onSuccess: () => {
      // Invalidate all posts-related queries
      invalidateQueries.allPosts();
      invalidateQueries.stats();
    },
    ...options,
  });
};

// Toggle post like with optimistic updates
export const useTogglePostLike = (
  options?: UseMutationOptions<
    { liked: boolean; likes_count: number },
    ApiError,
    {
      postId: number;
      postSlug: string;
      currentLiked: boolean;
      currentCount: number;
    },
    { previousPost: unknown }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }) => blogApiClient.toggleLike(postId),
    onMutate: async ({ postSlug, currentLiked, currentCount }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.posts.detail(postSlug),
      });

      // Snapshot the previous value
      const previousPost = queryClient.getQueryData(
        queryKeys.posts.detail(postSlug)
      );

      // Optimistically update
      const newLiked = !currentLiked;
      const newCount = newLiked ? currentCount + 1 : currentCount - 1;
      optimisticUpdates.togglePostLike(postSlug, newLiked, newCount);

      return { previousPost };
    },
    onError: (_err, { postSlug }, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(
          queryKeys.posts.detail(postSlug),
          context.previousPost
        );
      }
    },
    onSettled: (_data, _error, { postSlug }) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(postSlug),
      });
    },
    ...options,
  });
};

// Track post view
export const useTrackPostView = (
  options?: UseMutationOptions<
    void,
    ApiError,
    { postId: number; postSlug: string }
  >
) => {
  return useMutation({
    mutationFn: ({ postId }) => blogApiClient.trackView(postId),
    onMutate: ({ postSlug }) => {
      // Optimistically increment view count
      optimisticUpdates.incrementPostViews(postSlug);
    },
    // Don't handle errors - view tracking is not critical
    ...options,
  });
};

// Add comment
export const useAddComment = (
  options?: UseMutationOptions<BlogComment, ApiError, BlogCommentForm>
) => {
  return useMutation({
    mutationFn: blogApiClient.addComment.bind(blogApiClient),
    onSuccess: (data) => {
      // Invalidate comments for the post
      invalidateQueries.postComments(data.post_id);
    },
    ...options,
  });
};

// Reply to comment
export const useReplyToComment = (
  options?: UseMutationOptions<
    BlogComment,
    ApiError,
    { commentId: number; content: string }
  >
) => {
  return useMutation({
    mutationFn: ({ commentId, content }) =>
      blogApiClient.replyToComment(commentId, content),
    onSuccess: (data) => {
      // Invalidate comments for the post
      invalidateQueries.postComments(data.post_id);
    },
    ...options,
  });
};

// Create category
export const useCreateCategory = (
  options?: UseMutationOptions<BlogCategory, ApiError, BlogCategoryForm>
) => {
  return useMutation({
    mutationFn: blogApiClient.createCategory.bind(blogApiClient),
    onSuccess: () => {
      // Invalidate categories
      invalidateQueries.allCategories();
    },
    ...options,
  });
};

// Create tag
export const useCreateTag = (
  options?: UseMutationOptions<
    BlogTag,
    ApiError,
    { name: string; slug?: string }
  >
) => {
  return useMutation({
    mutationFn: blogApiClient.createTag.bind(blogApiClient),
    onSuccess: () => {
      // Invalidate tags
      invalidateQueries.allTags();
    },
    ...options,
  });
};

// Upload image
export const useUploadImage = (
  options?: UseMutationOptions<
    { url: string; filename: string },
    ApiError,
    File
  >
) => {
  return useMutation({
    mutationFn: blogApiClient.uploadImage.bind(blogApiClient),
    ...options,
  });
};

// Toggle featured status of a post
export const useToggleFeaturedPost = (
  options?: UseMutationOptions<BlogPost, ApiError, number>
) => {
  return useMutation({
    mutationFn: (postId: number) => blogApiClient.toggleFeaturedPost(postId),
    onSuccess: () => {
      invalidateQueries.allPosts();
      invalidateQueries.stats();
    },
    ...options,
  });
};

// Publish a post
export const usePublishPost = (
  options?: UseMutationOptions<BlogPost, ApiError, number>
) => {
  return useMutation({
    mutationFn: (postId: number) => blogApiClient.publishPost(postId),
    onSuccess: () => {
      invalidateQueries.allPosts();
      invalidateQueries.stats();
    },
    ...options,
  });
};

// Unpublish a post (set to draft)
export const useUnpublishPost = (
  options?: UseMutationOptions<BlogPost, ApiError, number>
) => {
  return useMutation({
    mutationFn: (postId: number) => blogApiClient.unpublishPost(postId),
    onSuccess: () => {
      invalidateQueries.allPosts();
      invalidateQueries.stats();
    },
    ...options,
  });
};
