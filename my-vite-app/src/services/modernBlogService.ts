/**
 * Modern Blog Service
 *
 * Enhanced blog service that works seamlessly with React Query.
 * Provides both imperative API for programmatic usage and hooks integration.
 * Implements cache-aware operations and optimistic updates.
 */

import {
  queryClient,
  invalidateQueries,
  optimisticUpdates,
} from "../lib/queryClient";
import { blogApiClient } from "../utils/blogApiClient";
import {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogComment,
  BlogSearchParams,
  BlogPaginationResponse,
  CreateBlogPostData,
  UpdateBlogPostData,
  BlogCommentForm,
  BlogCategoryForm,
} from "../types/blogTypes";

// #TODO: Implement background sync for offline functionality
// #TODO: Add request batching for multiple simultaneous operations
// #TODO: Implement progressive data loading for large datasets

/**
 * Modern Blog Service Class
 * Provides cache-aware operations that work with React Query
 */
class ModernBlogService {
  private static instance: ModernBlogService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ModernBlogService {
    if (!ModernBlogService.instance) {
      ModernBlogService.instance = new ModernBlogService();
    }
    return ModernBlogService.instance;
  }

  /**
   * Cache-aware Post Operations
   */

  /**
   * Prefetch posts to populate cache before component renders
   */
  async prefetchPosts(params: BlogSearchParams = {}): Promise<void> {
    await queryClient.prefetchQuery({
      queryKey: ["posts", "list", params],
      queryFn: () => blogApiClient.getPosts(params),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }

  /**
   * Get posts from cache if available, otherwise fetch
   */
  async getPostsFromCacheOrFetch(
    params: BlogSearchParams = {}
  ): Promise<BlogPaginationResponse<BlogPost>> {
    const cachedData = queryClient.getQueryData<
      BlogPaginationResponse<BlogPost>
    >(["posts", "list", params]);

    if (cachedData) {
      return cachedData;
    }

    return blogApiClient.getPosts(params);
  }

  /**
   * Prefetch single post
   */
  async prefetchPost(slug: string): Promise<void> {
    await queryClient.prefetchQuery({
      queryKey: ["posts", "detail", slug],
      queryFn: () => blogApiClient.getPost(slug),
      staleTime: 5 * 60 * 1000,
    });
  }

  /**
   * Get post from cache if available, otherwise fetch
   */
  async getPostFromCacheOrFetch(slug: string): Promise<BlogPost | undefined> {
    const cachedPost = queryClient.getQueryData<BlogPost>([
      "posts",
      "detail",
      slug,
    ]);

    if (cachedPost) {
      return cachedPost;
    }

    try {
      return await blogApiClient.getPost(slug);
    } catch (error) {
      console.error("Failed to fetch post:", error);
      return undefined;
    }
  }

  /**
   * Create post with cache updates
   */
  async createPost(postData: CreateBlogPostData): Promise<BlogPost> {
    const newPost = await blogApiClient.createPost(postData);

    // Invalidate relevant caches
    invalidateQueries.postsLists();
    invalidateQueries.stats();

    return newPost;
  }

  /**
   * Update post with cache updates
   */
  async updatePost(postData: UpdateBlogPostData): Promise<BlogPost> {
    const updatedPost = await blogApiClient.updatePost(postData);

    // Update specific post in cache
    queryClient.setQueryData(
      ["posts", "detail", updatedPost.slug],
      updatedPost
    );

    // Invalidate lists to reflect changes
    invalidateQueries.postsLists();

    return updatedPost;
  }

  /**
   * Delete post with cache cleanup
   */
  async deletePost(postId: number, postSlug?: string): Promise<void> {
    await blogApiClient.deletePost(postId);

    // Remove from cache if slug is provided
    if (postSlug) {
      queryClient.removeQueries({ queryKey: ["posts", "detail", postSlug] });
    }

    // Invalidate all post-related caches
    invalidateQueries.allPosts();
    invalidateQueries.stats();
  }

  /**
   * Toggle like with optimistic update
   */
  async togglePostLike(
    postId: number,
    postSlug: string,
    currentLiked: boolean,
    currentCount: number
  ): Promise<{ liked: boolean; likes_count: number }> {
    // Apply optimistic update immediately
    const newLiked = !currentLiked;
    const newCount = newLiked ? currentCount + 1 : currentCount - 1;
    optimisticUpdates.togglePostLike(postSlug, newLiked, newCount);

    try {
      const result = await blogApiClient.toggleLike(postId);
      // Update cache with server response
      optimisticUpdates.togglePostLike(
        postSlug,
        result.liked,
        result.likes_count
      );
      return result;
    } catch (error) {
      // Rollback optimistic update on error
      optimisticUpdates.togglePostLike(postSlug, currentLiked, currentCount);
      throw error;
    }
  }

  /**
   * Track view with optimistic update
   */
  async trackPostView(postId: number, postSlug: string): Promise<void> {
    // Optimistically increment view count
    optimisticUpdates.incrementPostViews(postSlug);

    try {
      await blogApiClient.trackView(postId);
    } catch (error) {
      // Don't rollback view tracking failures as they're not critical
      console.warn("Failed to track view:", error);
    }
  }

  /**
   * Cache-aware Category Operations
   */

  /**
   * Prefetch categories
   */
  async prefetchCategories(includeInactive = false): Promise<void> {
    await queryClient.prefetchQuery({
      queryKey: ["categories", "list", { includeInactive }],
      queryFn: () => blogApiClient.getCategories(includeInactive),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  }

  /**
   * Get categories from cache or fetch
   */
  async getCategoriesFromCacheOrFetch(
    includeInactive = false
  ): Promise<BlogCategory[]> {
    const cachedData = queryClient.getQueryData<BlogCategory[]>([
      "categories",
      "list",
      { includeInactive },
    ]);

    if (cachedData) {
      return cachedData;
    }

    return blogApiClient.getCategories(includeInactive);
  }

  /**
   * Create category with cache update
   */
  async createCategory(categoryData: BlogCategoryForm): Promise<BlogCategory> {
    const newCategory = await blogApiClient.createCategory(categoryData);
    invalidateQueries.allCategories();
    return newCategory;
  }

  /**
   * Cache-aware Tag Operations
   */

  /**
   * Prefetch tags
   */
  async prefetchTags(): Promise<void> {
    await queryClient.prefetchQuery({
      queryKey: ["tags", "list"],
      queryFn: () => blogApiClient.getTags(),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  }

  /**
   * Get tags from cache or fetch
   */
  async getTagsFromCacheOrFetch(): Promise<BlogTag[]> {
    const cachedData = queryClient.getQueryData<BlogTag[]>(["tags", "list"]);

    if (cachedData) {
      return cachedData;
    }

    return blogApiClient.getTags();
  }

  /**
   * Create tag with cache update
   */
  async createTag(tagData: { name: string; slug?: string }): Promise<BlogTag> {
    const newTag = await blogApiClient.createTag(tagData);
    invalidateQueries.allTags();
    return newTag;
  }

  /**
   * Cache-aware Comment Operations
   */

  /**
   * Add comment with cache update
   */
  async addComment(commentData: BlogCommentForm): Promise<BlogComment> {
    const newComment = await blogApiClient.addComment(commentData);
    invalidateQueries.postComments(commentData.post_id);
    return newComment;
  }

  /**
   * Reply to comment with cache update
   */
  async replyToComment(
    commentId: number,
    content: string,
    postId: number
  ): Promise<BlogComment> {
    const reply = await blogApiClient.replyToComment(commentId, content);
    invalidateQueries.postComments(postId);
    return reply;
  }

  /**
   * Utility Methods
   */

  /**
   * Clear all blog-related caches
   */
  clearAllCaches(): void {
    queryClient.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    queryCache: number;
    mutationCache: number;
  } {
    return {
      queryCache: queryClient.getQueryCache().getAll().length,
      mutationCache: queryClient.getMutationCache().getAll().length,
    };
  }

  /**
   * Prefetch common data for better UX
   */
  async prefetchCommonData(): Promise<void> {
    await Promise.allSettled([
      this.prefetchCategories(),
      this.prefetchTags(),
      this.prefetchPosts({ limit: 12 }), // First page
      queryClient.prefetchQuery({
        queryKey: ["posts", "featured", 5],
        queryFn: () => blogApiClient.getFeaturedPosts(5),
        staleTime: 10 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ["posts", "recent", 5],
        queryFn: () => blogApiClient.getRecentPosts(5),
        staleTime: 2 * 60 * 1000,
      }),
    ]);
  }

  /**
   * Get cache status for a specific post
   */
  getPostCacheStatus(slug: string): {
    cached: boolean;
    stale: boolean;
    lastFetched?: number;
  } {
    const query = queryClient.getQueryState(["posts", "detail", slug]);

    return {
      cached: !!query?.data,
      stale: query ? Date.now() - query.dataUpdatedAt > 5 * 60 * 1000 : true, // 5 minutes
      lastFetched: query?.dataUpdatedAt,
    };
  }

  /**
   * Manual cache invalidation methods
   */
  invalidatePostsCache(): void {
    invalidateQueries.allPosts();
  }

  invalidateCategoriesCache(): void {
    invalidateQueries.allCategories();
  }

  invalidateTagsCache(): void {
    invalidateQueries.allTags();
  }

  invalidateStatsCache(): void {
    invalidateQueries.stats();
  }
}

// Export singleton instance
export const modernBlogService = ModernBlogService.getInstance();

// Also export the class for testing
export { ModernBlogService };
