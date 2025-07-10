# Route Guards

This directory contains route guard components for protecting routes based on authentication and authorization.

## Components

### ProtectedRoute

A basic authentication guard that ensures only authenticated users can access protected routes.

```tsx
import { ProtectedRoute } from "@/components/common/guards";
import DashboardComponent from "@/components/Dashboard";

// Usage in routing
<Route
  path="/dashboard"
  element={<ProtectedRoute component={DashboardComponent} />}
/>;
```

### AdminRoute

An admin-only route guard that requires both authentication and admin privileges.

```tsx
import { AdminRoute } from "@/components/common/guards";
import AdminPanelComponent from "@/components/AdminPanel";

// Usage in routing
<Route
  path="/admin"
  element={<AdminRoute component={AdminPanelComponent} />}
/>

// With custom fallback route
<Route
  path="/admin/settings"
  element={
    <AdminRoute
      component={AdminSettingsComponent}
      fallbackRoute="/dashboard"
    />
  }
/>
```

## Features

### Authentication Checks

- ✅ Automatic authentication verification
- ✅ Loading states during auth checks
- ✅ Automatic redirects for unauthenticated users

### Authorization Levels

- ✅ **ProtectedRoute**: Requires authentication
- ✅ **AdminRoute**: Requires authentication + admin privileges
- 🚧 **RoleBasedRoute**: Future - Role-based access control
- 🚧 **PermissionBasedRoute**: Future - Permission-based access control

### User Experience

- ✅ Loading spinners during verification
- ✅ User feedback via messages (admin route)
- ✅ Graceful error handling
- ✅ Configurable fallback routes

## Usage Examples

### Basic Protected Route

```tsx
// Protects a user dashboard
<ProtectedRoute component={UserDashboard} />
```

### Admin-Only Route

```tsx
// Admin panel with default fallback to home
<AdminRoute component={AdminPanel} />

// Admin settings with custom fallback
<AdminRoute
  component={AdminSettings}
  fallbackRoute="/user/dashboard"
/>
```

### Integration with React Router

```tsx
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "@/components/common/guards";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute component={Dashboard} />}
      />
      <Route path="/profile" element={<ProtectedRoute component={Profile} />} />

      {/* Admin-only routes */}
      <Route
        path="/admin"
        element={<AdminRoute component={AdminDashboard} />}
      />
      <Route
        path="/admin/users"
        element={<AdminRoute component={UserManagement} />}
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute component={SystemSettings} fallbackRoute="/dashboard" />
        }
      />
    </Routes>
  );
}
```

## Future Enhancements

### Role-Based Access Control (Planned)

```tsx
// Future implementation
<RoleBasedRoute
  component={ModeratorPanel}
  requiredRoles={["admin", "moderator"]}
  roleMatchType="any"
/>
```

### Permission-Based Access Control (Planned)

```tsx
// Future implementation
<PermissionBasedRoute
  component={UserManagement}
  requiredPermissions={["read:users", "write:users"]}
  permissionMatchType="all"
/>
```

## Migration Guide

If you're using the old ProtectedRoute component:

### Before

```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";
```

### After

```tsx
import { ProtectedRoute } from "@/components/common/guards";
```

The API remains the same, so no code changes are needed beyond the import path.

## Type Safety

All route guards are fully typed with TypeScript. See `types.ts` for complete type definitions.

## Error Handling

Route guards include comprehensive error boundaries and graceful fallbacks:

- Loading states prevent premature redirects
- User feedback for access denied scenarios
- Fallback routes for non-admin users
- Console logging for debugging

## Best Practices

1. **Use specific guards**: Use `AdminRoute` for admin-only features rather than checking `user.isAdmin` in components
2. **Configure fallbacks**: Provide meaningful fallback routes for better UX
3. **Handle loading states**: The guards handle loading states automatically
4. **Keep components pure**: Let guards handle auth logic, keep components focused on rendering
5. **Test thoroughly**: Test both authenticated and unauthenticated scenarios
