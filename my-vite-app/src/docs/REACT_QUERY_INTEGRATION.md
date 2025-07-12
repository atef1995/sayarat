# React Query Integration Guide

This document explains how to integrate TanStack React Query with your existing blog service architecture.

## Architecture Overview

The new architecture provides **three levels of abstraction**:

1. **API Client Layer** (`blogApiClient.ts`) - Raw HTTP requests
2. **React Query Hooks** (`useBlogQueries.ts`) - Caching and state management
3. **Modern Service Layer** (`modernBlogService.ts`) - Cache-aware imperative API

## Integration Steps

### 1. Set Up Query Provider

Wrap your app with the QueryProvider:

```tsx
// In your main App.tsx or main.tsx
import { QueryProvider } from "./providers/QueryProvider";

function App() {
  return (
    <QueryProvider>
      {/* Your existing app content */}
      <YourAppContent />
    </QueryProvider>
  );
}
```

### 2. Replace Direct API Calls with Hooks

**Before (Direct API calls):**

```tsx
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  blogService
    .getBlogPosts()
    .then(setPosts)
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```

**After (React Query hooks):**

```tsx
import { useBlogPosts } from "../hooks/useBlogQueries";

const { data: posts, isLoading, error } = useBlogPosts({ limit: 12 });
```

### 3. Key Benefits You Get

#### Automatic Caching

```tsx
// First component that loads posts
const PostsList = () => {
  const { data } = useBlogPosts(); // Fetches from server
  // ...
};

// Second component that needs the same data
const PostsWidget = () => {
  const { data } = useBlogPosts(); // Uses cached data!
  // ...
};
```

#### Background Updates

```tsx
const { data: posts } = useBlogPosts(
  {},
  {
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  }
);
```

#### Optimistic Updates

```tsx
const toggleLike = useTogglePostLike({
  onSuccess: (data) => {
    // UI updates immediately, then syncs with server
    console.log("Like toggled:", data.liked);
  },
});

const handleLike = () => {
  toggleLike.mutate({
    postId: 123,
    postSlug: "my-post",
    currentLiked: false,
    currentCount: 5,
  });
};
```

### 4. Migration Strategy

#### Phase 1: Keep Existing Code, Add React Query Gradually

```tsx
// You can use both approaches side by side
const MyComponent = () => {
  // Old way (still works)
  const [categories, setCategories] = useState([]);

  // New way (for new features)
  const { data: posts } = useBlogPosts();

  useEffect(() => {
    blogService.getCategories().then(setCategories);
  }, []);

  return (
    <div>
      <CategoryList categories={categories} />
      <PostsList posts={posts} />
    </div>
  );
};
```

#### Phase 2: Replace Component by Component

```tsx
// Convert existing components one at a time
const CategoryList = () => {
  // Replace useState + useEffect with React Query
  const { data: categories, isLoading } = useCategories();

  if (isLoading) return <Spin />;

  return <List dataSource={categories} />;
};
```

#### Phase 3: Use Modern Service for Complex Operations

```tsx
import { modernBlogService } from "../services/modernBlogService";

const AdminPanel = () => {
  const handleCreatePost = async (postData) => {
    try {
      // This automatically updates all relevant caches
      const newPost = await modernBlogService.createPost(postData);
      message.success("Post created successfully!");
    } catch (error) {
      message.error("Failed to create post");
    }
  };

  const handlePrefetchData = async () => {
    // Preload data for better UX
    await modernBlogService.prefetchCommonData();
  };

  return (
    <div>
      <Button onClick={handlePrefetchData}>Preload Data</Button>
      <CreatePostForm onSubmit={handleCreatePost} />
    </div>
  );
};
```

## Common Patterns

### 1. Loading States

```tsx
const { data, isLoading, error, isRefetching } = useBlogPosts();

if (isLoading) return <Spin />; // Initial load
if (error) return <Alert message={error.message} type="error" />;

return (
  <div>
    {isRefetching && <Progress size="small" />} {/* Background refresh */}
    <PostsList posts={data?.data} />
  </div>
);
```

### 2. Pagination

```tsx
const [page, setPage] = useState(1);

const { data: postsData } = useBlogPosts({ page, limit: 12 });

return (
  <div>
    <PostsList posts={postsData?.data} />
    <Pagination
      current={page}
      total={postsData?.pagination.totalItems}
      onChange={setPage}
    />
  </div>
);
```

### 3. Infinite Scroll

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteBlogPosts();

const allPosts = data?.pages.flatMap((page) => page.data) || [];

return (
  <div>
    <PostsList posts={allPosts} />
    {hasNextPage && (
      <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
        Load More
      </Button>
    )}
  </div>
);
```

### 4. Search with Debouncing

```tsx
const [searchTerm, setSearchTerm] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

// Debounce search term
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]);

const { data: searchResults } = useSearchPosts(
  { search: debouncedSearch },
  { enabled: debouncedSearch.length > 2 } // Only search if term is long enough
);
```

### 5. Cache Management

```tsx
const AdminTools = () => {
  const clearCache = () => {
    modernBlogService.clearAllCaches();
  };

  const refreshPosts = () => {
    modernBlogService.invalidatePostsCache();
  };

  const prefetchData = async () => {
    await modernBlogService.prefetchCommonData();
  };

  return (
    <Space>
      <Button onClick={clearCache}>Clear All Cache</Button>
      <Button onClick={refreshPosts}>Refresh Posts</Button>
      <Button onClick={prefetchData}>Preload Data</Button>
    </Space>
  );
};
```

## Performance Tips

### 1. Strategic Prefetching

```tsx
// Preload data on route entry
const BlogPage = () => {
  useEffect(() => {
    // Preload common data when user enters blog section
    modernBlogService.prefetchCommonData();
  }, []);

  return <BlogContent />;
};

// Preload on hover
const PostCard = ({ post }) => {
  const handleMouseEnter = () => {
    // Preload post details on hover
    modernBlogService.prefetchPost(post.slug);
  };

  return <Card onMouseEnter={handleMouseEnter}>{/* Card content */}</Card>;
};
```

### 2. Conditional Queries

```tsx
const UserPosts = ({ userId }) => {
  const { data: posts } = usePostsByAuthor(
    userId,
    1,
    10,
    { enabled: !!userId } // Only run query if userId exists
  );

  return <PostsList posts={posts?.data} />;
};
```

### 3. Background Sync

```tsx
const PostDetail = ({ slug }) => {
  const { data: post } = useBlogPost(slug, {
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchInterval: 10 * 60 * 1000, // Background sync every 10 minutes
  });

  return <PostContent post={post} />;
};
```

## Error Handling

### 1. Global Error Boundary

```tsx
const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>{children}</ErrorBoundary>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};
```

### 2. Per-Query Error Handling

```tsx
const PostsList = () => {
  const { data, error, refetch } = useBlogPosts(
    {},
    {
      onError: (error) => {
        // Custom error handling
        console.error("Failed to load posts:", error);
        message.error("فشل في تحميل المقالات");
      },
    }
  );

  if (error) {
    return (
      <Alert
        message="خطأ في التحميل"
        description={error.message}
        type="error"
        action={<Button onClick={() => refetch()}>إعادة المحاولة</Button>}
      />
    );
  }

  return <PostsList posts={data?.data} />;
};
```

## Development Tools

React Query DevTools are automatically included in development mode. You can:

1. **View all queries** and their states
2. **Inspect cache contents**
3. **Manually trigger refetches**
4. **Monitor network requests**
5. **Debug performance issues**

Access them via the floating button in the bottom-left corner of your app in development mode.

## Backward Compatibility

Your existing code will continue to work unchanged. The new React Query integration is completely additive:

- ✅ Existing `blogService` calls still work
- ✅ Existing components don't need immediate changes
- ✅ Gradual migration is supported
- ✅ Can mix both approaches in the same component

## Next Steps

1. **Start Small**: Begin with one component using React Query hooks
2. **Gradually Migrate**: Convert components one by one
3. **Add Optimistic Updates**: Enhance UX with immediate feedback
4. **Implement Prefetching**: Improve perceived performance
5. **Monitor DevTools**: Use insights to optimize cache strategies

This architecture provides the best of both worlds: modern caching with React Query while maintaining your existing API structure and backward compatibility.
