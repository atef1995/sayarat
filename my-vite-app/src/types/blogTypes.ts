/**
 * Blog Types and Interfaces
 *
 * Defines all TypeScript interfaces and types for the blog system
 * including posts, categories, comments, and related entities.
 */

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  category_color?: string;
  tags: BlogTag[];
  status: "draft" | "published" | "scheduled" | "archived";
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  reading_time?: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  scheduled_for?: string;
  // Car-specific fields
  car_make?: string;
  car_model?: string;
  car_year?: number;
  price_range_min?: number;
  price_range_max?: number;
  price_currency?: string;
  market_trend?: "rising" | "falling" | "stable";
  source?: string;
  source_url?: string;
  rating?: number;
  pros?: string[];
  cons?: string[];
  specifications?: Record<string, string | number | boolean>;
  price_when_reviewed?: number;
  guide_type?: "buying" | "selling" | "maintenance" | "insurance" | "financing";
  difficulty_level?: "beginner" | "intermediate" | "advanced";
  estimated_time?: string;
  required_tools?: string[];
  steps?: {
    title: string;
    description: string;
    image?: string;
  }[];
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  posts_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogComment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  content: string;
  parent_id?: number;
  replies?: BlogComment[];
  replies_count: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  posts_count: number;
  created_at: string;
}

export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  category_id: number;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  scheduled_for?: string;
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: number;
}

export interface BlogSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tag?: string;
  author?: string;
  status?: string;
  featured?: boolean;
  sort?: "latest" | "oldest" | "popular" | "trending";
}

export interface BlogPaginationResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface BlogStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  total_comments: number;
  total_categories: number;
  total_tags: number;
  trending_posts: BlogPost[];
  popular_categories: BlogCategory[];
}

// Car-specific blog types
export interface CarMarketNews extends BlogPost {
  car_make?: string;
  car_model?: string;
  price_range?: {
    min: number;
    max: number;
    currency: string;
  };
  market_trend?: "rising" | "falling" | "stable";
  source?: string;
  source_url?: string;
}

export interface CarReview extends BlogPost {
  car_id?: number;
  car_make: string;
  car_model: string;
  car_year: number;
  rating: number;
  pros: string[];
  cons: string[];
  specifications?: Record<string, string | number | boolean>;
  price_when_reviewed?: number;
  currency?: string;
}

export interface CarGuide extends BlogPost {
  guide_type: "buying" | "selling" | "maintenance" | "insurance" | "financing";
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_time?: string;
  required_tools?: string[];
  steps?: {
    title: string;
    description: string;
    image?: string;
  }[];
}

// Blog component props
export interface BlogCardProps {
  post: BlogPost;
  variant?: "default" | "featured" | "compact" | "list";
  showAuthor?: boolean;
  showCategory?: boolean;
  showExcerpt?: boolean;
  showStats?: boolean;
  className?: string;
  onClick?: (post: BlogPost) => void;
}

export interface BlogListProps {
  posts: BlogPost[];
  loading?: boolean;
  variant?: "grid" | "list";
  showPagination?: boolean;
  pagination?: BlogPaginationResponse<BlogPost>["pagination"];
  onPageChange?: (page: number) => void;
  onPostClick?: (post: BlogPost) => void;
  className?: string;
}

export interface BlogSidebarProps {
  categories: BlogCategory[];
  tags: BlogTag[];
  recentPosts: BlogPost[];
  popularPosts: BlogPost[];
  className?: string;
}

export interface BlogEditorProps {
  initialData?: Partial<BlogPost>;
  categories: BlogCategory[];
  tags: BlogTag[];
  onSave: (data: CreateBlogPostData | UpdateBlogPostData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode?: "create" | "edit";
}

// Form types
export interface BlogPostForm {
  title: string;
  content: string;
  excerpt: string;
  featured_image: File | string | null;
  category_id: number | null;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  scheduled_for: string;
}

export interface BlogCategoryForm {
  name: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
}

export interface BlogCommentForm {
  content: string;
  post_id: number;
  parent_id?: number;
}

// API Response types
export interface BlogApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export type BlogPostResponse = BlogApiResponse<BlogPost>;
export type BlogPostsResponse = BlogApiResponse<
  BlogPaginationResponse<BlogPost>
>;
export type BlogCategoriesResponse = BlogApiResponse<BlogCategory[]>;
export type BlogTagsResponse = BlogApiResponse<BlogTag[]>;
export type BlogCommentsResponse = BlogApiResponse<
  BlogPaginationResponse<BlogComment>
>;
export type BlogStatsResponse = BlogApiResponse<BlogStats>;
