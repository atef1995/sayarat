# TanStack Query Integration Testing Guide

## Quick Validation Checklist

### ✅ Authentication System

```typescript
// Test these hooks in your components:
import { useAuth } from "../hooks/useAuth";

const {
  user, // Current user data
  isAuthenticated, // Auth status
  login, // Login function
  logout, // Logout function
  loading, // Loading state
} = useAuth();
```

### ✅ Subscription System

```typescript
// Test comprehensive subscription management:
import { useSubscription } from "../hooks/useSubscription";

const {
  // Core data
  subscriptionData,
  loading,

  // Status checks
  isPremium,
  canAccessAI,
  hasFeature,

  // Actions
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  switchAccountType,
} = useSubscription();
```

## Quick Integration Test

Create a test component to verify both systems:

```typescript
// src/components/SystemTest.tsx
import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useSubscription } from "../hooks/useSubscription";
import { Card, Button, Space, Typography } from "antd";

const { Title, Text } = Typography;

export const SystemTest: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const {
    subscriptionData,
    loading: subLoading,
    isPremium,
    canAccessAI,
  } = useSubscription();

  if (authLoading || subLoading) {
    return <div>Loading systems...</div>;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card title="🔐 Authentication Status">
        <Text>Authenticated: {isAuthenticated ? "✅ Yes" : "❌ No"}</Text>
        <br />
        <Text>User: {user?.email || "Not logged in"}</Text>
        <br />
        <Text>Account Type: {user?.accountType || "Unknown"}</Text>
      </Card>

      <Card title="💳 Subscription Status">
        <Text>
          Subscription:{" "}
          {subscriptionData?.isActive ? "✅ Active" : "❌ Inactive"}
        </Text>
        <br />
        <Text>Premium: {isPremium() ? "✅ Yes" : "❌ No"}</Text>
        <br />
        <Text>
          AI Access: {canAccessAI() ? "✅ Available" : "❌ Upgrade needed"}
        </Text>
        <br />
        <Text>Plan: {subscriptionData?.currentPlan?.name || "Free"}</Text>
      </Card>
    </Space>
  );
};
```

## Performance Monitoring

Monitor these React DevTools queries:

1. **Auth Queries**: Look for `["auth", "session"]` in React Query DevTools
2. **Subscription Queries**: Check `["subscription", "check"]` and `["subscription", "plans"]`
3. **Cache Status**: Verify queries show "fresh" or "stale" appropriately
4. **Background Refetch**: Switch tabs and return to see background updates

## Error Testing

Test error scenarios:

```typescript
// Temporarily modify API endpoints to test error handling
// Network failures should show user-friendly messages
// Authentication errors should redirect to login
// Subscription errors should show upgrade prompts
```

## Success Indicators

✅ **Auth System Working**: User can login/logout, session persists across page refresh  
✅ **Subscription System Working**: Premium features are gated correctly  
✅ **Caching Working**: Reduced network requests visible in DevTools  
✅ **Error Handling Working**: Graceful error messages appear  
✅ **Background Updates Working**: Data refreshes when returning to tab

The systems are production-ready when all indicators show green! 🚀
