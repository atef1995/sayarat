# Duplicate TanStack DevTools Fix

## Issue

You were seeing **two TanStack Query DevTools** instances because you had two separate `QueryClientProvider` components:

1. One in `AuthProvider.tsx`
2. One in `QueryProvider.tsx`

This created two separate query client instances, each with its own DevTools panel.

## Root Cause

In your `main.tsx`, the providers were nested like this:

```tsx
<AuthProvider>
  {" "}
  // ← Had its own QueryClientProvider
  <QueryProvider>
    {" "}
    // ← Another QueryClientProvider
    <App />
  </QueryProvider>
</AuthProvider>
```

## Solution Applied

### 1. **Removed QueryClientProvider from AuthProvider**

- Removed `QueryClientProvider` and `ReactQueryDevtools` imports
- Simplified `AuthProvider` to only provide auth context
- Added note that it expects to be wrapped by `QueryProvider`

### 2. **Restructured Provider Hierarchy**

**Before:**

```tsx
<AuthProvider>
  <QueryProvider>
    <App />
  </QueryProvider>
</AuthProvider>
```

**After:**

```tsx
<QueryProvider>
  {" "}
  // ← Single QueryClientProvider with DevTools
  <AuthProvider>
    {" "}
    // ← Only provides auth context
    <App />
  </AuthProvider>
</QueryProvider>
```

### 3. **Updated AuthProvider.tsx**

```tsx
// Before: Had its own QueryClientProvider
const AuthProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderContent>{children}</AuthProviderContent>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};

// After: Simple context provider only
const AuthProvider = ({ children }) => {
  return <AuthProviderContent>{children}</AuthProviderContent>;
};
```

## Result

✅ **Single TanStack DevTools instance**  
✅ **All auth and subscription queries in one unified DevTools**  
✅ **No duplicate query clients**  
✅ **Cleaner provider architecture**

## Benefits

1. **Single Source of Truth**: One query client manages all queries
2. **Better Debugging**: All queries (auth + subscription) visible in one DevTools panel
3. **Performance**: No duplicate query client instances
4. **Cleaner Architecture**: Proper separation of concerns

## Verification

Open your app and you should now see only **one** TanStack DevTools button that shows all your queries (auth and subscription) in a single panel.

The DevTools will show queries like:

- `["auth", "session"]` - Authentication status
- `["auth", "user"]` - User profile data
- `["subscription", "check"]` - Subscription status
- `["subscription", "plans"]` - Available plans
- And all other queries in one unified interface

## Future Considerations

- Keep `QueryProvider` as the outermost data provider
- Any new providers that need TanStack Query should be placed inside `QueryProvider`
- Only one `ReactQueryDevtools` instance should exist in the app
