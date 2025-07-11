# TanStack Query Best Practices Implementation

This document outlines the TanStack Query best practices implemented in the payment system hooks, following the official recommendations from the TanStack Query creators.

## Architecture Overview

The payment system has been refactored into three separate, focused hooks following the **Separation of Concerns** principle:

### 1. `useProductsQuery.ts` - Data Fetching

- **Purpose**: Centralized products data fetching and caching
- **Pattern**: Query Factory Pattern for reusable query configurations
- **Key Features**:
  - Centralized query keys for better cache management
  - Reusable query options configuration
  - Utility hooks for specific product operations
  - Proper error handling and loading states

### 2. `usePaymentMutations.ts` - State Mutations

- **Purpose**: Payment-related mutations and side effects
- **Pattern**: Mutation Factory Pattern for consistent mutation handling
- **Key Features**:
  - Separate mutations for different payment operations
  - Proper error handling with user feedback
  - Cache invalidation strategies
  - Optimistic updates where appropriate

### 3. `usePayment.ts` - Business Logic Orchestration

- **Purpose**: Combines data fetching and mutations with business logic
- **Pattern**: Facade Pattern for simplified component interface
- **Key Features**:
  - Local state management for UI-specific state
  - Computed values for component consumption
  - Action handlers that coordinate multiple operations

## TanStack Query Best Practices Applied

### 1. **Query Keys Management**

```typescript
// ✅ Centralized query keys with consistent structure
export const productsQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productsQueryKeys.all, "list"] as const,
  list: (filters: string) =>
    [...productsQueryKeys.lists(), { filters }] as const,
  details: () => [...productsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...productsQueryKeys.details(), id] as const,
};
```

**Benefits**:

- Type-safe query keys
- Hierarchical invalidation
- Consistent cache management
- Easy refactoring and maintenance

### 2. **Query Options Configuration**

```typescript
// ✅ Reusable query configuration
export const productsQueryOptions = {
  queryKey: productsQueryKeys.all,
  queryFn: async (): Promise<Product[]> => {
    /* ... */
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
};
```

**Benefits**:

- Centralized configuration
- Consistent caching strategies
- Reusable across components
- Easy testing and mocking

### 3. **Proper Error Handling**

```typescript
// ✅ Comprehensive error handling in mutations
const createPaymentIntentMutation = useMutation({
  mutationKey: ["create-payment-intent"],
  mutationFn: async (paymentItems: PaymentItem[]): Promise<string> => {
    // Validation and API call
  },
  onSuccess: (clientSecret: string) => {
    // Success handling with user feedback
    message.success("تم إنشاء طلب الدفع بنجاح");
  },
  onError: (error: Error) => {
    // Error handling with user feedback
    message.error("حدث خطأ أثناء إنشاء طلب الدفع");
  },
});
```

**Benefits**:

- User-friendly error messages
- Consistent error handling patterns
- Proper error logging
- Graceful degradation

### 4. **Cache Invalidation Strategies**

```typescript
// ✅ Strategic cache invalidation after mutations
const paymentSuccessMutation = useMutation({
  mutationKey: ["payment-success"],
  onSuccess: async () => {
    // Invalidate multiple related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subscription"] }),
      queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] }),
    ]);
  },
});
```

**Benefits**:

- Data consistency across the application
- Efficient cache updates
- Reduced unnecessary API calls
- Better user experience

### 5. **Computed Values and Derived State**

```typescript
// ✅ Computed values for better component integration
return {
  // Derived state
  hasSelectedProducts: items.length > 0,
  isProcessingPayment: isCreatingPayment || isProcessingSuccess,
  totalAmount: items.reduce((total, item) => {
    /* calculation */
  }, 0),

  // Error states
  isPaymentError: !!createPaymentError,

  // Loading states
  isLoadingProducts,
  isProcessingPayment,
};
```

**Benefits**:

- Simplified component logic
- Consistent state derivation
- Better performance through memoization
- Cleaner component code

### 6. **Separation of Data Fetching and Business Logic**

```typescript
// ✅ Separate hooks for different concerns
const useProductsQuery = () => {
  /* data fetching */
};
const usePaymentMutations = () => {
  /* mutations */
};
const usePayment = () => {
  /* business logic orchestration */
};
```

**Benefits**:

- Better testability
- Easier maintenance
- Reusable components
- Clear separation of concerns

## Performance Optimizations

### 1. **Stale Time Configuration**

- Products: 5 minutes (rarely change)
- User data: 1 minute (moderate frequency)
- Real-time data: 0 seconds (always fresh)

### 2. **Garbage Collection Time**

- Background data: 10 minutes
- Frequently accessed: 5 minutes
- One-time use: 1 minute

### 3. **Refetch Strategies**

- Window focus: Disabled for static data
- Retry logic: Exponential backoff with jitter
- Background refetch: Enabled for critical data

## Error Boundaries Integration

```typescript
// TODO: Implement React Error Boundaries for mutation errors
// This will provide graceful error handling at the component level
```

## Testing Strategies

### 1. **Query Testing**

- Mock query functions
- Test loading states
- Test error scenarios
- Test cache behavior

### 2. **Mutation Testing**

- Test success scenarios
- Test error handling
- Test cache invalidation
- Test optimistic updates

### 3. **Integration Testing**

- Test hook compositions
- Test component integration
- Test user workflows

## Migration Benefits

### Before (Single Hook Approach)

- ❌ Monolithic hook with multiple responsibilities
- ❌ Difficult to test individual concerns
- ❌ Tight coupling between data fetching and UI logic
- ❌ Hard to reuse across components

### After (Separated Hooks Approach)

- ✅ Single responsibility principle
- ✅ Easy to test individual concerns
- ✅ Loose coupling with clear interfaces
- ✅ Highly reusable across components
- ✅ Better TypeScript inference
- ✅ Improved performance through targeted updates

## Future Enhancements

### 1. **Optimistic Updates**

```typescript
// TODO: Implement optimistic updates for better UX
const updateProductMutation = useMutation({
  mutationFn: updateProduct,
  onMutate: async (newProduct) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: productsQueryKeys.all });

    // Snapshot the previous value
    const previousProducts = queryClient.getQueryData(productsQueryKeys.all);

    // Optimistically update to the new value
    queryClient.setQueryData(productsQueryKeys.all, (old) =>
      old ? [...old, newProduct] : [newProduct]
    );

    return { previousProducts };
  },
  onError: (err, newProduct, context) => {
    // Rollback on error
    queryClient.setQueryData(productsQueryKeys.all, context?.previousProducts);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
  },
});
```

### 2. **Infinite Queries**

```typescript
// TODO: Implement infinite queries for large product lists
const useInfiniteProducts = () => {
  return useInfiniteQuery({
    queryKey: productsQueryKeys.lists(),
    queryFn: ({ pageParam = 0 }) => fetchProducts({ page: pageParam }),
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};
```

### 3. **Real-time Updates**

```typescript
// TODO: Implement WebSocket integration for real-time updates
const useRealtimeProducts = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = new WebSocket("ws://api/products/updates");

    socket.onmessage = (event) => {
      const update = JSON.parse(event.data);
      queryClient.setQueryData(productsQueryKeys.detail(update.id), update);
    };

    return () => socket.close();
  }, [queryClient]);
};
```

## Conclusion

This implementation follows the latest TanStack Query best practices and provides a solid foundation for scalable, maintainable, and performant data fetching in React applications. The separation of concerns approach makes the codebase more testable, reusable, and easier to understand for new developers.

The architecture is designed to be:

- **Modular**: Each hook has a single responsibility
- **Reusable**: Hooks can be composed in different ways
- **Testable**: Each concern can be tested independently
- **Performant**: Optimized caching and update strategies
- **Type-safe**: Full TypeScript support with proper inference
- **User-friendly**: Comprehensive error handling and loading states
