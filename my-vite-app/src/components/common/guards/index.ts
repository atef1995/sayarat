/**
 * Route Guards Index
 *
 * Centralized export for all route guard components.
 * Provides easy access to authentication and authorization guards.
 */

export { ProtectedRoute } from "./ProtectedRoute";
export { AdminRoute } from "./AdminRoute";

// Export default as well for backward compatibility
export { default as ProtectedRouteDefault } from "./ProtectedRoute";
export { default as AdminRouteDefault } from "./AdminRoute";
