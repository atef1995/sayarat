import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import { message, Spin } from "antd";
import { AdminRouteProps } from "./types";

/**
 * AdminRoute Component
 *
 * A route guard that ensures only authenticated admin users can access protected admin routes.
 * Redirects non-admin users to a fallback route (default: home page).
 *
 * Features:
 * - Checks both authentication and admin status
 * - Configurable fallback route
 * - Loading state during auth check
 * - User feedback via messages
 * - Error boundaries for graceful error handling
 *
 * @param component - The component to render if user is admin
 * @param fallbackRoute - Route to redirect to if user is not admin (default: "/")
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({
  component: Component,
  fallbackRoute = "/",
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isLoading) {
      return;
    }

    // Redirect if not authenticated
    if (!isAuthenticated) {
      console.log("AdminRoute: User not authenticated, redirecting to login");
      message.error("Please log in to access admin features");
      navigate("/login");
      return;
    }

    // Redirect if authenticated but not admin
    if (isAuthenticated && user && !user.isAdmin) {
      console.log(
        "AdminRoute: User is not admin, redirecting to fallback route"
      );
      message.error("Access denied. Admin privileges required.");
      navigate(fallbackRoute);
      return;
    }

    // Log successful admin access
    if (isAuthenticated && user?.isAdmin) {
      console.log("AdminRoute: Admin access granted for user:", user.username);
    }
  }, [isAuthenticated, isLoading, user, navigate, fallbackRoute]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96 p-8">
        <div className="text-center space-y-4">
          <Spin size="large" />
          <p className="text-sm opacity-70">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  // Render the protected admin component
  return <Component />;
};

export default AdminRoute;
